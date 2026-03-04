const { promisePool } = require('../config/db');

const STOCK_LIMIT_MESSAGE = 'Quantity exceeds stock limit';

const aggregateRequestedQuantities = (items) => {
    const safe = Array.isArray(items) ? items : [];
    const byProductId = new Map();

    for (const item of safe) {
        // Unselected items should not participate in stock validation or totals.
        // This is important for the admin verification flow where unchecked products
        // remain on the order but are not part of the verified bill.
        if (item && item.isSelected === false) continue;

        const productId = Number(item?.productId);
        const quantityRaw = Number(item?.quantity);
        const quantity = Number.isFinite(quantityRaw) ? Math.floor(quantityRaw) : NaN;

        if (!Number.isInteger(productId) || productId <= 0) continue;
        if (!Number.isInteger(quantity) || quantity <= 0) continue;

        byProductId.set(productId, (byProductId.get(productId) || 0) + quantity);
    }

    return byProductId;
};

const assertSufficientStock = async (connection, itemsOrMap) => {
    const requested = itemsOrMap instanceof Map ? itemsOrMap : aggregateRequestedQuantities(itemsOrMap);
    const productIds = Array.from(requested.keys());

    if (productIds.length === 0) return;

    const placeholders = productIds.map(() => '?').join(',');
    const [rows] = await connection.query(
        `SELECT id, stock FROM products WHERE id IN (${placeholders}) FOR UPDATE`,
        productIds
    );

    const stockById = new Map((rows || []).map((r) => [Number(r.id), Number(r.stock)]));

    for (const productId of productIds) {
        const qty = requested.get(productId) || 0;
        const rawStock = stockById.get(productId);
        const stock = Number.isFinite(rawStock) && rawStock >= 0 ? rawStock : 0;

        if (qty > stock) {
            throw new Error(STOCK_LIMIT_MESSAGE);
        }
    }
};

const calculateTotalFromItems = (items) => {
    const safe = Array.isArray(items) ? items : [];
    return safe.reduce((sum, it) => {
        // Prefer item.total if present, else quantity * price.
        const quantity = Number(it?.quantity || 0) || 0;
        const price = Number(it?.price || 0) || 0;
        const rowTotal = Number(it?.total);
        const computed = Number.isFinite(rowTotal) ? rowTotal : (quantity * price);
        const isSelected = it?.isSelected;
        const include = (isSelected === undefined || isSelected === null) ? true : Boolean(isSelected);
        return include ? (sum + (Number(computed) || 0)) : sum;
    }, 0);
};

const normalize = (value) => String(value || '').trim().toLowerCase();

const canModifyBeforeVerification = (order) => {
    const type = normalize(order?.orderType);
    const status = normalize(order?.status);

    if (type === 'online') {
        return status === 'accepted';
    }

    // Offline keeps the older workflow.
    return status === 'pending' || status === 'accepted';
};

const Order = {
    /**
     * Create online order with items (using transaction)
     */
    createOnlineOrder: async (orderData, items) => {
        const connection = await promisePool.getConnection();
        
        try {
            await connection.beginTransaction();

            // Backend enforcement: validate stock before creating order/items.
            await assertSufficientStock(connection, items);

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
                VALUES (?, ?, ?, ?, ?, 'Online', 'Pending Acceptance', 'Unpaid', ?)`,
                [customerId, customerName, phone, place, address, totalAmount]
            );

            const orderId = orderResult.insertId;

            // Insert order items
            let computedTotalAmount = 0;
            for (const item of items) {
                const quantity = Number(item?.quantity || 0) || 0;
                const price = Number(item?.price || 0) || 0;
                computedTotalAmount += (quantity * price);
                await connection.query(
                    `INSERT INTO order_items 
                    (orderId, productId, productName, price, quantity, isSelected, total) 
                    VALUES (?, ?, ?, ?, ?, TRUE, ?)`,
                    [orderId, item.productId, item.productName, price, quantity, price * quantity]
                );
            }

            // Persist server-computed total (prevents drift / stale 0 totals)
            await connection.query(
                'UPDATE orders SET totalAmount = ? WHERE id = ?',
                [computedTotalAmount, orderId]
            );

            await connection.commit();

            return {
                id: orderId,
                ...orderData,
                // Ensure API response matches DB total
                totalAmount: computedTotalAmount,
                advanceAmount: 0,
                remainingBalance: computedTotalAmount,
                orderType: 'Online',
                status: 'Pending Acceptance',
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

        const existingTotal = Number(order?.totalAmount || 0) || 0;
        let totalAmountSafe = existingTotal;
        if (existingTotal <= 0 && Array.isArray(itemRows) && itemRows.length > 0) {
            const computedTotal = calculateTotalFromItems(itemRows);
            if (computedTotal > 0) totalAmountSafe = computedTotal;
        }

        const advanceAmountSafe = Number(order?.advanceAmount || 0);
        const advanceAmount = Number.isFinite(advanceAmountSafe) ? advanceAmountSafe : 0;
        const remainingBalance = (Number(totalAmountSafe || 0) || 0) - (Number(advanceAmount || 0) || 0);

        return {
            ...order,
            totalAmount: totalAmountSafe,
            advanceAmount,
            remainingBalance,
            items: itemRows.map((it) => ({
                ...it,
                name: it.productName
            }))
        };
    },

    /**
     * Update advanceAmount for an order.
     * Rules:
     * - advanceAmount must be numeric and >= 0
     * - Not allowed once order is Paid or Completed
     */
    updateAdvanceAmount: async (orderId, advanceAmount) => {
        const connection = await promisePool.getConnection();
        try {
            await connection.beginTransaction();

            const [rows] = await connection.query(
                'SELECT id, status, paymentStatus, isPaid FROM orders WHERE id = ? FOR UPDATE',
                [orderId]
            );
            if (rows.length === 0) throw new Error('Order not found');

            const order = rows[0];
            const status = String(order?.status || '').trim();
            const paymentStatus = String(order?.paymentStatus || '').trim();
            const isPaid = Boolean(order?.isPaid);

            const statusLower = status.toLowerCase();
            const isLocked = isPaid || paymentStatus.toLowerCase() === 'paid' || statusLower === 'paid' || statusLower === 'completed' || statusLower === 'mark paid';

            if (isLocked) {
                throw new Error('Advance amount cannot be updated after Paid/Completed');
            }

            const num = Number(advanceAmount);
            if (!Number.isFinite(num)) throw new Error('Advance amount must be a valid number');
            if (num < 0) throw new Error('Advance amount cannot be negative');

            await connection.query(
                'UPDATE orders SET advanceAmount = ? WHERE id = ?',
                [num, orderId]
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
     * Get orders by customer ID
     */
    findByCustomerId: async (customerId) => {
        const [orders] = await promisePool.query(
            `
            SELECT *
            FROM orders
            WHERE customerId = ?
            ORDER BY COALESCE(createdAt, orderDate, updatedAt) DESC
            `,
            [customerId]
        );

        // Get items for each order
        for (let order of orders) {
            // Ensure a consistent date field for clients.
            // Some older UI code expects `date`, while newer prefers `createdAt`.
            const createdAtSafe = order?.createdAt || order?.orderDate || order?.updatedAt || null;
            order.createdAt = createdAtSafe;
            order.date = order?.date || createdAtSafe;

            const [items] = await promisePool.query(
                'SELECT * FROM order_items WHERE orderId = ?',
                [order.id]
            );
            order.items = items;

            const existingTotal = Number(order?.totalAmount || 0) || 0;
            if (existingTotal <= 0 && Array.isArray(items) && items.length > 0) {
                const computedTotal = calculateTotalFromItems(items);
                if (computedTotal > 0) {
                    order.totalAmount = computedTotal;
                }
            }

            const totalAmountSafe = Number(order?.totalAmount || 0) || 0;
            const advanceAmountSafe = Number(order?.advanceAmount || 0);
            order.advanceAmount = Number.isFinite(advanceAmountSafe) ? advanceAmountSafe : 0;
            order.remainingBalance = totalAmountSafe - (Number(order.advanceAmount || 0) || 0);
        }

        return orders;
    },

    /**
     * Get orders for a registered customer, including offline orders whose phone
     * exactly matches the customer's registered phone number.
     *
     * IMPORTANT: phone matching is exact (no partial), non-null, non-empty.
     */
    findByCustomerIdIncludingOfflineByPhone: async (customerId, phone) => {
        const cleanedPhone = String(phone || '').replace(/\D/g, '');
        const canMatchPhone = /^\d{10}$/.test(cleanedPhone);

        const params = [customerId];
        let whereSql = 'WHERE customerId = ?';

        if (canMatchPhone) {
            whereSql += " OR (orderType = 'Offline' AND phone = ?)";
            params.push(cleanedPhone);
        }

        const [orders] = await promisePool.query(
            `
            SELECT *
            FROM orders
            ${whereSql}
            ORDER BY COALESCE(createdAt, orderDate, updatedAt) DESC
            `,
            params
        );

        for (let order of orders) {
            const createdAtSafe = order?.createdAt || order?.orderDate || order?.updatedAt || null;
            order.createdAt = createdAtSafe;
            order.date = order?.date || createdAtSafe;

            const [items] = await promisePool.query('SELECT * FROM order_items WHERE orderId = ?', [order.id]);
            order.items = items;

            const existingTotal = Number(order?.totalAmount || 0) || 0;
            if (existingTotal <= 0 && Array.isArray(items) && items.length > 0) {
                const computedTotal = calculateTotalFromItems(items);
                if (computedTotal > 0) {
                    order.totalAmount = computedTotal;
                }
            }

            const totalAmountSafe = Number(order?.totalAmount || 0) || 0;
            const advanceAmountSafe = Number(order?.advanceAmount || 0);
            order.advanceAmount = Number.isFinite(advanceAmountSafe) ? advanceAmountSafe : 0;
            order.remainingBalance = totalAmountSafe - (Number(order.advanceAmount || 0) || 0);
        }

        return orders;
    },

    /**
     * Get offline orders for a phone number (exact match).
     * - Excludes null/empty/invalid phone numbers
     * - Sorts latest-first
     * - Includes items and ensures totalAmount/date fields are consistent
     */
    findOfflineByPhone: async (phone) => {
        const cleanedPhone = String(phone || '').replace(/\D/g, '');
        const canMatchPhone = /^\d{10}$/.test(cleanedPhone);

        if (!canMatchPhone) return [];

        const [orders] = await promisePool.query(
            `
            SELECT *
            FROM orders
            WHERE orderType = 'Offline'
              AND phone IS NOT NULL
              AND phone <> ''
              AND phone = ?
            ORDER BY COALESCE(createdAt, orderDate, updatedAt) DESC
            `,
            [cleanedPhone]
        );

        for (let order of orders) {
            const createdAtSafe = order?.createdAt || order?.orderDate || order?.updatedAt || null;
            order.createdAt = createdAtSafe;
            order.date = order?.date || createdAtSafe;

            const [items] = await promisePool.query('SELECT * FROM order_items WHERE orderId = ?', [order.id]);
            order.items = items;

            const existingTotal = Number(order?.totalAmount || 0) || 0;
            if (existingTotal <= 0 && Array.isArray(items) && items.length > 0) {
                const computedTotal = calculateTotalFromItems(items);
                if (computedTotal > 0) {
                    order.totalAmount = computedTotal;
                }
            }

            const totalAmountSafe = Number(order?.totalAmount || 0) || 0;
            const advanceAmountSafe = Number(order?.advanceAmount || 0);
            order.advanceAmount = Number.isFinite(advanceAmountSafe) ? advanceAmountSafe : 0;
            order.remainingBalance = totalAmountSafe - (Number(order.advanceAmount || 0) || 0);
        }

        return orders;
    },

    /**
     * Get all orders (admin view) with pagination
     */
    findAll: async (options = {}) => {
        const {
            page = 1,
            limit = 50,
            status = null,
            orderType = null,
            statusIn = null,
            statusNotIn = null,
            sortBy = null,
            view = null,
            search = null
        } = options;
        const offset = (page - 1) * limit;

        // Join users to safely display the real phone for online orders.
        // Some older UI flows sent a placeholder phone (e.g., '0000000000');
        // this coalesces to the user's registered phone when available.
        let query = `
            SELECT 
                o.*,
                COALESCE(NULLIF(NULLIF(o.phone, ''), '0000000000'), u.phone) AS phone
            FROM orders o
            LEFT JOIN users u ON o.customerId = u.id
        `;
        let countQuery = 'SELECT COUNT(*) as total FROM orders o';
        const params = [];
        const countParams = [];
        const conditions = [];

        if (status) {
            conditions.push('o.status = ?');
            params.push(status);
            countParams.push(status);
        }

        if (Array.isArray(statusIn) && statusIn.length > 0) {
            const placeholders = statusIn.map(() => '?').join(',');
            conditions.push(`o.status IN (${placeholders})`);
            params.push(...statusIn);
            countParams.push(...statusIn);
        }

        if (Array.isArray(statusNotIn) && statusNotIn.length > 0) {
            const placeholders = statusNotIn.map(() => '?').join(',');
            conditions.push(`o.status NOT IN (${placeholders})`);
            params.push(...statusNotIn);
            countParams.push(...statusNotIn);
        }

        if (orderType) {
            conditions.push('o.orderType = ?');
            params.push(orderType);
            countParams.push(orderType);
        }

        if (view === 'active') {
            conditions.push('o.isArchived = FALSE');
        } else if (view === 'bills') {
            conditions.push('o.isArchived = TRUE');
        }

        if (search) {
            conditions.push('o.customerName LIKE ?');
            params.push(`%${search}%`);
            countParams.push(`%${search}%`);
        }

        if (conditions.length > 0) {
            query += ' WHERE ' + conditions.join(' AND ');
            countQuery += ' WHERE ' + conditions.join(' AND ');
        }

        if (sortBy === 'updatedAt') {
            query += ' ORDER BY o.updatedAt DESC LIMIT ? OFFSET ?';
        } else {
            query += ' ORDER BY o.orderDate DESC LIMIT ? OFFSET ?';
        }
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

            const existingTotal = Number(order?.totalAmount || 0) || 0;
            if (existingTotal <= 0 && Array.isArray(items) && items.length > 0) {
                const computedTotal = calculateTotalFromItems(items);
                if (computedTotal > 0) {
                    order.totalAmount = computedTotal;
                }
            }

            // Normalize advance/remaining for consumers
            const advanceAmountSafe = Number(order?.advanceAmount || 0);
            order.advanceAmount = Number.isFinite(advanceAmountSafe) ? advanceAmountSafe : 0;
            const totalAmountSafe = Number(order?.totalAmount || 0) || 0;
            order.remainingBalance = totalAmountSafe - (Number(order.advanceAmount || 0) || 0);
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
                'SELECT status, orderType FROM orders WHERE id = ? FOR UPDATE',
                [orderId]
            );

            if (orderCheck.length === 0) {
                throw new Error('Order not found');
            }

            if (!canModifyBeforeVerification(orderCheck[0])) {
                throw new Error('Order is locked. Cannot modify after verification.');
            }

            // Backend enforcement: validate stock against the full updated quantities.
            await assertSufficientStock(connection, items);

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
            const computedTotalAmount = calculateTotalFromItems(items);
            await connection.query(
                'UPDATE orders SET totalAmount = ? WHERE id = ?',
                [(computedTotalAmount > 0 ? computedTotalAmount : (Number(totalAmount || 0) || 0)), orderId]
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

            if (!canModifyBeforeVerification(orderCheck[0])) {
                if (normalize(orderCheck[0]?.orderType) === 'online' && normalize(orderCheck[0]?.status) === 'pending acceptance') {
                    throw new Error('Order must be accepted before verification');
                }
                throw new Error('Order already verified or processed');
            }

            // Get selected items
            const [items] = await connection.query(
                'SELECT * FROM order_items WHERE orderId = ? AND isSelected = TRUE',
                [orderId]
            );

            // Ensure bill amount matches verified (selected) items.
            // This makes remaining balance (totalAmount - advanceAmount) correct immediately.
            const verifiedTotal = calculateTotalFromItems(items);
            await connection.query(
                'UPDATE orders SET totalAmount = ? WHERE id = ?',
                [Number(verifiedTotal || 0) || 0, orderId]
            );

            // Update stock for each selected item
            for (const item of items) {
                const [stockResult] = await connection.query(
                    'UPDATE products SET stock = stock - ? WHERE id = ? AND stock >= ?',
                    [item.quantity, item.productId, item.quantity]
                );

                if (stockResult.affectedRows === 0) {
                    throw new Error(STOCK_LIMIT_MESSAGE);
                }
            }

            // Update order status
            await connection.query(
                'UPDATE orders SET isVerified = TRUE, status = ?, verifiedAt = NOW() WHERE id = ?',
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
        const [orderRows] = await promisePool.query(
            'SELECT id, status, isVerified, isPaid, isDelivered, totalAmount, advanceAmount FROM orders WHERE id = ?',
            [orderId]
        );

        if (orderRows.length === 0) throw new Error('Order not found');

        const order = orderRows[0];
        if (order.status === 'Rejected') throw new Error('Rejected order cannot be marked as paid');
        if (!order.isVerified) throw new Error('Order must be verified before marking as paid');

        const totalAmount = Number(order?.totalAmount || 0) || 0;
        const advanceAmount = Number(order?.advanceAmount || 0) || 0;
        const remaining = totalAmount - advanceAmount;
        if (Math.abs(remaining) > 0.009) {
            throw new Error('Remaining balance must be 0 before marking as paid');
        }
        // Keep this operation idempotent, but still allow it to correct derived fields
        // like status/isArchived if an older row was missing updates.

        const [result] = await promisePool.query(
            `
            UPDATE orders
            SET isPaid = TRUE,
                paymentStatus = 'Paid',
                status = CASE
                           WHEN isDelivered = TRUE THEN 'Completed'
                           ELSE 'Paid'
                         END
                                ,isArchived = CASE
                                                             WHEN isDelivered = TRUE THEN TRUE
                                                             ELSE FALSE
                                                         END
            WHERE id = ? AND isVerified = TRUE
            `,
            [orderId]
        );

        // If affectedRows is 0, it's most likely not verified (or id mismatch)
        if (result.affectedRows === 0) {
            throw new Error('Order must be verified before marking as paid');
        }

        return true;
    },

    /**
     * Mark order as delivered
     */
    markDelivered: async (orderId) => {
        const [orderRows] = await promisePool.query(
            'SELECT id, status, isVerified, isPaid, isDelivered FROM orders WHERE id = ?',
            [orderId]
        );

        if (orderRows.length === 0) throw new Error('Order not found');

        const order = orderRows[0];
        if (order.status === 'Rejected') throw new Error('Rejected order cannot be delivered');
        if (!order.isVerified) throw new Error('Order must be verified before delivery');
        // Keep this operation idempotent, but still allow it to correct derived fields
        // like status/isArchived if an older row was missing updates.

        const [result] = await promisePool.query(
            `
            UPDATE orders
            SET isDelivered = TRUE,
                deliveredAt = NOW(),
                status = CASE
                           WHEN isPaid = TRUE THEN 'Completed'
                           ELSE 'Delivered'
                         END
                                ,isArchived = CASE
                                                             WHEN isPaid = TRUE THEN TRUE
                                                             ELSE FALSE
                                                         END
            WHERE id = ? AND isVerified = TRUE
            `,
            [orderId]
        );

        if (result.affectedRows === 0) {
            throw new Error('Order must be verified before delivery');
        }

        return true;
    },

    /**
     * Reject order (only if Pending)
     */
    rejectOrder: async (orderId) => {
        const connection = await promisePool.getConnection();

        try {
            await connection.beginTransaction();

            const [orderCheck] = await connection.query(
                'SELECT status, orderType FROM orders WHERE id = ? FOR UPDATE',
                [orderId]
            );

            if (orderCheck.length === 0) {
                throw new Error('Order not found');
            }

            const orderType = normalize(orderCheck[0]?.orderType);
            const status = normalize(orderCheck[0]?.status);

            if (orderType === 'online') {
                if (!['pending acceptance', 'accepted'].includes(status)) {
                    throw new Error('Only Pending Acceptance/Accepted online orders can be rejected');
                }
            } else {
                if (status !== 'pending') {
                    throw new Error('Only Pending offline orders can be rejected');
                }
            }

            const [result] = await connection.query(
                'UPDATE orders SET status = ?, isArchived = TRUE WHERE id = ?',
                ['Rejected', orderId]
            );

            await connection.commit();
            return result.affectedRows > 0;
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
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
                'SELECT status, orderType, totalAmount FROM orders WHERE id = ? FOR UPDATE',
                [orderId]
            );

            if (orderCheck.length === 0) {
                throw new Error('Order not found');
            }

            if (!canModifyBeforeVerification(orderCheck[0])) {
                throw new Error('Cannot add items to a verified order');
            }

            // Backend enforcement: ensure cumulative quantity for this product in this order
            // does not exceed available stock.
            const [existingQtyRows] = await connection.query(
                'SELECT COALESCE(SUM(quantity), 0) AS qty FROM order_items WHERE orderId = ? AND productId = ?',
                [orderId, item.productId]
            );
            const existingQty = Number(existingQtyRows?.[0]?.qty || 0) || 0;
            const requestedTotalQty = existingQty + (Number(item?.quantity || 0) || 0);
            const requestedMap = new Map([[Number(item.productId), requestedTotalQty]]);
            await assertSufficientStock(connection, requestedMap);

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

            // Backend enforcement: validate stock before creating order/items.
            await assertSufficientStock(connection, items);

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
            let computedTotalAmount = 0;
            for (const item of items) {
                const quantity = Number(item?.quantity || 0) || 0;
                const price = Number(item?.price || 0) || 0;
                computedTotalAmount += (quantity * price);
                await connection.query(
                    `INSERT INTO order_items 
                    (orderId, productId, productName, price, quantity, isSelected, total) 
                    VALUES (?, ?, ?, ?, ?, TRUE, ?)`,
                    [orderId, item.productId, item.productName, price, quantity, price * quantity]
                );
            }

            // Persist server-computed total (prevents drift / stale 0 totals)
            await connection.query(
                'UPDATE orders SET totalAmount = ? WHERE id = ?',
                [computedTotalAmount, orderId]
            );

            await connection.commit();

            return {
                id: orderId,
                ...orderData,
                totalAmount: computedTotalAmount,
                advanceAmount: 0,
                remainingBalance: computedTotalAmount,
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
        const { page = 1, limit = 50, status = null, view = 'active', search = null } = options;
        const offset = (page - 1) * limit;

        let query = "SELECT * FROM orders WHERE orderType = 'Offline'";
        let countQuery = "SELECT COUNT(*) as total FROM orders WHERE orderType = 'Offline'";
        const params = [];
        const countParams = [];

        if (view === 'active') {
            query += ' AND isArchived = FALSE';
            countQuery += ' AND isArchived = FALSE';
        } else if (view === 'bills') {
            query += ' AND isArchived = TRUE';
            countQuery += ' AND isArchived = TRUE';
        }

        if (search) {
            query += ' AND customerName LIKE ?';
            countQuery += ' AND customerName LIKE ?';
            params.push(`%${search}%`);
            countParams.push(`%${search}%`);
        }

        if (status) {
            query += ' AND status = ?';
            countQuery += ' AND status = ?';
            params.push(status);
            countParams.push(status);
        }

        if (view === 'bills') {
            query += ' ORDER BY updatedAt DESC LIMIT ? OFFSET ?';
        } else {
            query += ' ORDER BY orderDate DESC LIMIT ? OFFSET ?';
        }
        params.push(parseInt(limit), parseInt(offset));

        const [orders] = await promisePool.query(query, params);
        const [countResult] = await promisePool.query(countQuery, countParams);

        // Get items for each order
        for (let order of orders) {
            const [items] = await promisePool.query(
                'SELECT * FROM order_items WHERE orderId = ?',
                [order.id]
            );
            order.items = items.map((it) => ({
                ...it,
                name: it.productName
            }));

            const existingTotal = Number(order?.totalAmount || 0) || 0;
            if (existingTotal <= 0 && Array.isArray(items) && items.length > 0) {
                const computedTotal = calculateTotalFromItems(items);
                if (computedTotal > 0) {
                    order.totalAmount = computedTotal;
                }
            }
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
    ,

    /**
     * Update order status (admin)
     * Note: Do NOT use this to set status=Verified; use verifyOrder() to update stock.
     */
    updateStatus: async (orderId, nextStatus) => {
        const allowed = new Set(['Paid', 'Delivered', 'Rejected']);
        if (!allowed.has(nextStatus)) {
            throw new Error('Invalid status');
        }

        const connection = await promisePool.getConnection();
        try {
            await connection.beginTransaction();

            const [orderRows] = await connection.query(
                'SELECT status, orderType, paymentStatus, isVerified, isPaid, isDelivered, totalAmount, advanceAmount FROM orders WHERE id = ? FOR UPDATE',
                [orderId]
            );

            if (orderRows.length === 0) {
                throw new Error('Order not found');
            }

            const currentStatus = orderRows[0].status;
            const currentOrderType = normalize(orderRows[0].orderType);
            const currentPayment = orderRows[0].paymentStatus;
            const isVerified = !!orderRows[0].isVerified;
            const currentStatusLower = normalize(currentStatus);

            if (currentStatus === 'Rejected' && nextStatus !== 'Rejected') {
                throw new Error('Rejected order cannot be updated');
            }

            if (nextStatus === 'Rejected') {
                if (currentOrderType === 'online') {
                    if (!['pending acceptance', 'accepted'].includes(currentStatusLower)) {
                        throw new Error('Only Pending Acceptance/Accepted online orders can be rejected');
                    }
                } else if (currentStatusLower !== 'pending') {
                    throw new Error('Only Pending offline orders can be rejected');
                }
            }

            if (nextStatus === 'Paid' && !isVerified) {
                throw new Error('Order must be verified before marking as paid');
            }

            if (nextStatus === 'Paid') {
                const totalAmount = Number(orderRows[0]?.totalAmount || 0) || 0;
                const advanceAmount = Number(orderRows[0]?.advanceAmount || 0) || 0;
                const remaining = totalAmount - advanceAmount;
                if (Math.abs(remaining) > 0.009) {
                    throw new Error('Remaining balance must be 0 before marking as paid');
                }
            }

            if (nextStatus === 'Delivered' && !isVerified) {
                throw new Error('Order must be verified before delivery');
            }

            if (nextStatus === 'Paid') {
                await connection.query(
                    `
                    UPDATE orders
                    SET isPaid = TRUE,
                        paymentStatus = 'Paid',
                        status = CASE
                                   WHEN isDelivered = TRUE THEN 'Completed'
                                   ELSE 'Paid'
                                 END
                        ,isArchived = CASE
                                       WHEN isDelivered = TRUE THEN TRUE
                                       ELSE FALSE
                                     END
                    WHERE id = ? AND isVerified = TRUE
                    `,
                    [orderId]
                );
            } else if (nextStatus === 'Delivered') {
                await connection.query(
                    `
                    UPDATE orders
                    SET isDelivered = TRUE,
                        deliveredAt = NOW(),
                        status = CASE
                                   WHEN isPaid = TRUE THEN 'Completed'
                                   ELSE 'Delivered'
                                 END
                        ,isArchived = CASE
                                       WHEN isPaid = TRUE THEN TRUE
                                       ELSE FALSE
                                     END
                    WHERE id = ? AND isVerified = TRUE
                    `,
                    [orderId]
                );
            } else if (nextStatus === 'Rejected') {
                await connection.query(
                    'UPDATE orders SET status = ?, isArchived = TRUE WHERE id = ?',
                    ['Rejected', orderId]
                );
            } else {
                await connection.query(
                    'UPDATE orders SET status = ? WHERE id = ?',
                    [nextStatus, orderId]
                );
            }

            await connection.commit();
            return true;
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    }
    ,

    /**
     * Accept online order (admin action)
     */
    acceptOnlineOrder: async (orderId) => {
        const connection = await promisePool.getConnection();
        try {
            await connection.beginTransaction();

            const [orderRows] = await connection.query(
                'SELECT id, orderType, status, isVerified, isPaid, isDelivered FROM orders WHERE id = ? FOR UPDATE',
                [orderId]
            );

            if (orderRows.length === 0) throw new Error('Order not found');

            const order = orderRows[0];
            if (normalize(order.orderType) !== 'online') {
                throw new Error('Only online orders can be accepted');
            }

            if (order.isVerified || order.isPaid || order.isDelivered) {
                throw new Error('Order already processed and cannot be accepted');
            }

            const currentStatus = normalize(order.status);
            if (currentStatus === 'accepted') {
                await connection.commit();
                return true;
            }

            if (!['pending acceptance', 'pending'].includes(currentStatus)) {
                throw new Error('Only Pending/Pending Acceptance orders can be accepted');
            }

            await connection.query(
                'UPDATE orders SET status = ?, acceptedAt = NOW() WHERE id = ?',
                ['Accepted', orderId]
            );

            await connection.commit();
            return true;
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    }
};

module.exports = Order;
