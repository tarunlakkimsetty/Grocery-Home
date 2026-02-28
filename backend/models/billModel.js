const { promisePool } = require('../config/db');

const Bill = {
    /**
     * Create a new bill
     */
    create: async (billData, items) => {
        const connection = await promisePool.getConnection();
        try {
            await connection.beginTransaction();

            // Insert bill
            const [billResult] = await connection.query(
                `INSERT INTO bills (userId, grandTotal, paymentMethod) VALUES (?, ?, ?)`,
                [billData.userId, billData.grandTotal, billData.paymentMethod || 'Cash']
            );

            const billId = billResult.insertId;

            // Insert bill items
            for (const item of items) {
                await connection.query(
                    `INSERT INTO bill_items (billId, productId, productName, price, quantity, total) 
                     VALUES (?, ?, ?, ?, ?, ?)`,
                    [billId, item.productId, item.name || item.productName, item.price, item.quantity, item.total || (item.price * item.quantity)]
                );
            }

            await connection.commit();

            return {
                id: billId,
                userId: billData.userId,
                grandTotal: billData.grandTotal,
                paymentMethod: billData.paymentMethod || 'Cash',
                date: new Date().toISOString()
            };
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    },

    /**
     * Find bill by ID with items
     */
    findById: async (id) => {
        const [bills] = await promisePool.query(
            `SELECT * FROM bills WHERE id = ?`,
            [id]
        );

        if (bills.length === 0) return null;

        const bill = bills[0];

        // Get bill items
        const [items] = await promisePool.query(
            `SELECT * FROM bill_items WHERE billId = ?`,
            [id]
        );

        return {
            ...bill,
            items
        };
    },

    /**
     * Find bills by user ID
     */
    findByUserId: async (userId) => {
        const [bills] = await promisePool.query(
            `SELECT * FROM bills WHERE userId = ? ORDER BY createdAt DESC`,
            [userId]
        );

        // Get items for each bill
        for (const bill of bills) {
            const [items] = await promisePool.query(
                `SELECT * FROM bill_items WHERE billId = ?`,
                [bill.id]
            );
            bill.items = items;
        }

        return bills;
    },

    /**
     * Find all bills (admin)
     */
    findAll: async (options = {}) => {
        const { page = 1, limit = 50 } = options;
        const offset = (page - 1) * limit;

        // Get total count
        const [countResult] = await promisePool.query('SELECT COUNT(*) as total FROM bills');
        const total = countResult[0].total;

        // Get bills with pagination
        const [bills] = await promisePool.query(
            `SELECT b.*, u.fullName as customerName 
             FROM bills b 
             LEFT JOIN users u ON b.userId = u.id 
             ORDER BY b.createdAt DESC 
             LIMIT ? OFFSET ?`,
            [limit, offset]
        );

        // Get items for each bill
        for (const bill of bills) {
            const [items] = await promisePool.query(
                `SELECT * FROM bill_items WHERE billId = ?`,
                [bill.id]
            );
            bill.items = items;
        }

        return {
            bills,
            pagination: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit)
            }
        };
    }
};

module.exports = Bill;
