const { promisePool } = require('../config/db');

const Order = {
    /**
     * Create online order with items (using transaction)
     */
    createOnlineOrder: async (orderData, items) => {
        const connection = await promisePool.getConnection();
        
        try {
            await connection.beginTransaction();

            const {
                customerId,
                customerName,
                phone,
                place,
                address,
                totalAmount
            } = orderData;

            // Insert order
            const [orderResult] = await connection.query(
                `INSERT INTO orders 
                (customerId, customerName, phone, place, address, orderType, status, paymentStatus, totalAmount) 
                VALUES (?, ?, ?, ?, ?, 'Online', 'Pending', 'Unpaid', ?)`,
                [customerId, customerName, phone, place, address, totalAmount]
            );

            const orderId = orderResult.insertId;

            // Insert order items
            for (const item of items) {
                await connection.query(
                    `INSERT INTO order_items 
                    (orderId, productId, productName, price, quantity, isSelected, total) 
                    VALUES (?, ?, ?, ?, ?, TRUE, ?)`,
                    [orderId, item.productId, item.productName, item.price, item.quantity, item.price * item.quantity]
                );
            }

            await connection.commit();

            return {
                id: orderId,
                ...orderData,
                orderType: 'Online',
                status: 'Pending',
                paymentStatus: 'Unpaid'
            };
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    },

    /**
     * Find order by ID with items
     */
    findById: async (id) => {
        const [orderRows] = await promisePool.query(
            'SELECT * FROM orders WHERE id = ?',
            [id]
        );

        if (orderRows.length === 0) return null;

        const order = orderRows[0];

        const [itemRows] = await promisePool.query(
            'SELECT * FROM order_items WHERE orderId = ?',
            [id]
        );

        return {
            ...order,
            items: itemRows
        };
    },

    /**
     * Get orders by customer ID
     */
    findByCustomerId: async (customerId) => {
        const [orders] = await promisePool.query(
            `SELECT * FROM orders WHERE customerId = ? ORDER BY orderDate DESC`,
            [customerId]
        );

        // Get items for each order
        for (let order of orders) {
            const [items] = await promisePool.query(
                'SELECT * FROM order_items WHERE orderId = ?',
                [order.id]
            );
            order.items = items;
        }

        return orders;
    },

    /**
     * Get all orders (admin view) with pagination
     */
    findAll: async (options = {}) => {
        const { page = 1, limit = 50, status = null, orderType = null } = options;
        const offset = (page - 1) * limit;

        let query = 'SELECT * FROM orders';
        let countQuery = 'SELECT COUNT(*) as total FROM orders';
        const params = [];
        const countParams = [];
        const conditions = [];

        if (status) {
            conditions.push('status = ?');
            params.push(status);
            countParams.push(status);
        }

        if (orderType) {
            conditions.push('orderType = ?');
            params.push(orderType);
            countParams.push(orderType);
        }

        if (conditions.length > 0) {
            query += ' WHERE ' + conditions.join(' AND ');
            countQuery += ' WHERE ' + conditions.join(' AND ');
        }

        query += ' ORDER BY orderDate DESC LIMIT ? OFFSET ?';
        params.push(parseInt(limit), parseInt(offset));

        const [orders] = await promisePool.query(query, params);
        const [countResult] = await promisePool.query(countQuery, countParams);

        // Get items for each order
        for (let order of orders) {
            const [items] = await promisePool.query(
                'SELECT * FROM order_items WHERE orderId = ?',
                [order.id]
            );
            order.items = items;
        }

        return {
            orders,
            pagination: {
                total: countResult[0].total,
                page: parseInt(page),
                limit: parseInt(limit),
                totalPages: Math.ceil(countResult[0].total / limit)
            }
        };
    },

    /**
     * Update order items before verification (only if Pending)
     */
    updateOrderItems: async (orderId, items, totalAmount) => {
        const connection = await promisePool.getConnection();

        try {
            await connection.beginTransaction();

            // Check if order is still Pending
            const [orderCheck] = await connection.query(
                'SELECT status FROM orders WHERE id = ? FOR UPDATE',
                [orderId]
            );

            if (orderCheck.length === 0) {
                throw new Error('Order not found');
            }

            if (orderCheck[0].status !== 'Pending') {
                throw new Error('Order is locked. Cannot modify after verification.');
            }

            // Delete existing items
            await connection.query('DELETE FROM order_items WHERE orderId = ?', [orderId]);

            // Insert updated items
            for (const item of items) {
                await connection.query(
                    `INSERT INTO order_items 
                    (orderId, productId, productName, price, quantity, isSelected, total) 
                    VALUES (?, ?, ?, ?, ?, ?, ?)`,
                    [orderId, item.productId, item.productName, item.price, item.quantity, item.isSelected, item.total]
                );
            }

            // Update total amount
            await connection.query(
                'UPDATE orders SET totalAmount = ? WHERE id = ?',
                [totalAmount, orderId]
            );

            await connection.commit();
            return true;
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    },

    /**
     * Verify order and update stock (transaction)
     */
    verifyOrder: async (orderId) => {
        const connection = await promisePool.getConnection();

        try {
            await connection.beginTransaction();

            // Lock order for update
            const [orderCheck] = await connection.query(
                'SELECT * FROM orders WHERE id = ? FOR UPDATE',
                [orderId]
            );

            if (orderCheck.length === 0) {
                throw new Error('Order not found');
            }

            if (orderCheck[0].status !== 'Pending') {
                throw new Error('Order already verified or processed');
            }

            // Get selected items
            const [items] = await connection.query(
                'SELECT * FROM order_items WHERE orderId = ? AND isSelected = TRUE',
                [orderId]
            );

            // Update stock for each selected item
            for (const item of items) {
                const [stockResult] = await connection.query(
                    'UPDATE products SET stock = stock - ? WHERE id = ? AND stock >= ?',
                    [item.quantity, item.productId, item.quantity]
                );

                if (stockResult.affectedRows === 0) {
                    throw new Error(`Insufficient stock for product: ${item.productName}`);
                }
            }

            // Update order status
            await connection.query(
                'UPDATE orders SET status = ?, verifiedAt = NOW() WHERE id = ?',
                ['Verified', orderId]
            );

            await connection.commit();
            return true;
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    },

    /**
     * Mark order as paid
     */
    markPaid: async (orderId) => {
        const [orderCheck] = await promisePool.query(
            'SELECT status FROM orders WHERE id = ?',
            [orderId]
        );

        if (orderCheck.length === 0) {
            throw new Error('Order not found');
        }

        if (orderCheck[0].status === 'Pending') {
            throw new Error('Order must be verified before marking as paid');
        }

        const [result] = await promisePool.query(
            'UPDATE orders SET paymentStatus = ?, status = ? WHERE id = ?',
            ['Paid', 'Paid', orderId]
        );

        return result.affectedRows > 0;
    },

    /**
     * Mark order as delivered
     */
    markDelivered: async (orderId) => {
        const [orderCheck] = await promisePool.query(
            'SELECT status, paymentStatus FROM orders WHERE id = ?',
            [orderId]
        );

        if (orderCheck.length === 0) {
            throw new Error('Order not found');
        }

        if (orderCheck[0].status === 'Pending') {
            throw new Error('Order must be verified before delivery');
        }

        const [result] = await promisePool.query(
            'UPDATE orders SET status = ?, deliveredAt = NOW() WHERE id = ?',
            ['Delivered', orderId]
        );

        return result.affectedRows > 0;
    },

    /**
     * Add item to order (only if Pending)
     */
    addItemToOrder: async (orderId, item) => {
        const connection = await promisePool.getConnection();

        try {
            await connection.beginTransaction();

            // Check if order is Pending
            const [orderCheck] = await connection.query(
                'SELECT status, totalAmount FROM orders WHERE id = ? FOR UPDATE',
                [orderId]
            );

            if (orderCheck.length === 0) {
                throw new Error('Order not found');
            }

            if (orderCheck[0].status !== 'Pending') {
                throw new Error('Cannot add items to a verified order');
            }

            // Insert new item
            const itemTotal = item.price * item.quantity;
            await connection.query(
                `INSERT INTO order_items 
                (orderId, productId, productName, price, quantity, isSelected, total) 
                VALUES (?, ?, ?, ?, ?, TRUE, ?)`,
                [orderId, item.productId, item.productName, item.price, item.quantity, itemTotal]
            );

            // Update order total
            const newTotal = parseFloat(orderCheck[0].totalAmount || 0) + itemTotal;
            await connection.query(
                'UPDATE orders SET totalAmount = ? WHERE id = ?',
                [newTotal, orderId]
            );

            await connection.commit();
            return true;
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    },

    /**
     * Create offline order (admin creates for walk-in customer)
     */
    createOfflineOrder: async (orderData, items) => {
        const connection = await promisePool.getConnection();
        
        try {
            await connection.beginTransaction();

            const {
                customerName,
                phone,
                place,
                address,
                totalAmount
            } = orderData;

            // Insert order (customerId is NULL for offline orders)
            const [orderResult] = await connection.query(
                `INSERT INTO orders 
                (customerId, customerName, phone, place, address, orderType, status, paymentStatus, totalAmount) 
                VALUES (NULL, ?, ?, ?, ?, 'Offline', 'Pending', 'Unpaid', ?)`,
                [customerName, phone, place, address, totalAmount]
            );

            const orderId = orderResult.insertId;

            // Insert order items
            for (const item of items) {
                await connection.query(
                    `INSERT INTO order_items 
                    (orderId, productId, productName, price, quantity, isSelected, total) 
                    VALUES (?, ?, ?, ?, ?, TRUE, ?)`,
                    [orderId, item.productId, item.productName, item.price, item.quantity, item.price * item.quantity]
                );
            }

            await connection.commit();

            return {
                id: orderId,
                ...orderData,
                orderType: 'Offline',
                status: 'Pending',
                paymentStatus: 'Unpaid'
            };
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    },

    /**
     * Get all offline orders with pagination
     */
    getOfflineOrders: async (options = {}) => {
        const { page = 1, limit = 50, status = null } = options;
        const offset = (page - 1) * limit;

        let query = "SELECT * FROM orders WHERE orderType = 'Offline'";
        let countQuery = "SELECT COUNT(*) as total FROM orders WHERE orderType = 'Offline'";
        const params = [];
        const countParams = [];

        if (status) {
            query += ' AND status = ?';
            countQuery += ' AND status = ?';
            params.push(status);
            countParams.push(status);
        }

        query += ' ORDER BY orderDate DESC LIMIT ? OFFSET ?';
        params.push(parseInt(limit), parseInt(offset));

        const [orders] = await promisePool.query(query, params);
        const [countResult] = await promisePool.query(countQuery, countParams);

        // Get items for each order
        for (let order of orders) {
            const [items] = await promisePool.query(
                'SELECT * FROM order_items WHERE orderId = ?',
                [order.id]
            );
            order.items = items;
        }

        return {
            orders,
            pagination: {
                total: countResult[0].total,
                page: parseInt(page),
                limit: parseInt(limit),
                totalPages: Math.ceil(countResult[0].total / limit)
            }
        };
    }
};

module.exports = Order;
