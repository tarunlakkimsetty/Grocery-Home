const { promisePool } = require('../config/db');

const Feedback = {
    getRecentForCustomer: async (customerId, { limit = 5 } = {}) => {
        const cid = Number(customerId);
        const safeLimit = Number(limit);
        const finalLimit = Number.isFinite(safeLimit) ? Math.max(1, Math.min(20, Math.floor(safeLimit))) : 5;

        if (!Number.isInteger(cid) || cid <= 0) return [];

        const [rows] = await promisePool.query(
            `SELECT id, order_id, customer_id, rating, comment, created_at
             FROM feedback
             WHERE customer_id = ?
             ORDER BY created_at DESC, id DESC
             LIMIT ${finalLimit}`,
            [cid]
        );

        return Array.isArray(rows) ? rows : [];
    },

    getOverallSummary: async () => {
        const [rows] = await promisePool.query(
            `SELECT AVG(rating) AS overall_rating, COUNT(*) AS rating_count
             FROM feedback`
        );
        const r = rows && rows[0] ? rows[0] : {};
        const overallRaw = r.overall_rating;
        const overall = overallRaw === null || overallRaw === undefined ? null : Number(overallRaw);
        return {
            overall_rating: Number.isFinite(overall) ? overall : null,
            rating_count: Number(r.rating_count || 0),
        };
    },

    getPendingOrdersForCustomer: async (customerId) => {
        const id = Number(customerId);
        if (!Number.isInteger(id) || id <= 0) return [];

        const [userRows] = await promisePool.query(
            'SELECT id, phone, role FROM users WHERE id = ? LIMIT 1',
            [id]
        );
        if (!userRows || userRows.length === 0) return [];
        const user = userRows[0];
        if (String(user.role || '').toLowerCase() !== 'customer') return [];

        const phone = String(user.phone || '').trim();

        const [rows] = await promisePool.query(
            `
            SELECT
                o.id,
                o.orderType,
                o.status,
                o.totalAmount,
                COALESCE(o.createdAt, o.orderDate, o.updatedAt) AS createdAt
            FROM orders o
            LEFT JOIN feedback f
              ON f.order_id = o.id
            WHERE
                o.status = 'Completed'
                AND f.id IS NULL
                AND (
                    (o.orderType = 'Online' AND o.customerId = ?)
                    OR (o.orderType = 'Offline' AND o.phone = ?)
                )
            ORDER BY COALESCE(o.createdAt, o.orderDate, o.updatedAt) ASC
            `,
            [id, phone]
        );

        return Array.isArray(rows) ? rows : [];
    },

    submitFeedback: async ({ orderId, customerId, rating, comment }) => {
        const oid = Number(orderId);
        const cid = Number(customerId);
        const r = Number(rating);
        const safeRating = Number.isFinite(r) ? Math.floor(r) : NaN;
        const safeComment = (comment === null || comment === undefined) ? null : String(comment).trim();

        if (!Number.isInteger(oid) || oid <= 0) throw new Error('Invalid order id');
        if (!Number.isInteger(cid) || cid <= 0) throw new Error('Invalid customer id');
        if (!Number.isInteger(safeRating) || safeRating < 1 || safeRating > 5) {
            throw new Error('Rating must be between 1 and 5');
        }

        const connection = await promisePool.getConnection();
        try {
            await connection.beginTransaction();

            const [userRows] = await connection.query(
                'SELECT id, phone, role FROM users WHERE id = ? FOR UPDATE',
                [cid]
            );
            if (!userRows || userRows.length === 0) throw new Error('Customer not found');
            const user = userRows[0];
            if (String(user.role || '').toLowerCase() !== 'customer') {
                throw new Error('Customer account required');
            }

            const phone = String(user.phone || '').trim();

            const [orderRows] = await connection.query(
                `SELECT id, status, orderType, customerId, phone
                 FROM orders
                 WHERE id = ?
                 FOR UPDATE`,
                [oid]
            );
            if (!orderRows || orderRows.length === 0) throw new Error('Order not found');

            const order = orderRows[0];
            if (String(order.status || '') !== 'Completed') {
                throw new Error('Feedback is allowed only for Completed orders');
            }

            const orderType = String(order.orderType || '');
            const isOnlineMatch = orderType === 'Online' && Number(order.customerId) === cid;
            const isOfflineMatch = orderType === 'Offline' && String(order.phone || '').trim() === phone;

            if (!isOnlineMatch && !isOfflineMatch) {
                throw new Error('You are not allowed to submit feedback for this order');
            }

            try {
                await connection.query(
                    `INSERT INTO feedback (order_id, customer_id, rating, comment)
                     VALUES (?, ?, ?, ?)`,
                    [oid, cid, safeRating, safeComment && safeComment.length ? safeComment : null]
                );
            } catch (err) {
                const msg = String(err && err.message ? err.message : err);
                if (msg.includes('Duplicate') || msg.includes('ER_DUP_ENTRY')) {
                    throw new Error('Feedback already submitted for this order');
                }
                throw err;
            }

            // Keep only the latest 5 *comments* per customer.
            // We do NOT delete old feedback rows because that would cause the same Completed
            // orders to show up as "pending" again. Instead, we clear old comments.
            await connection.query(
                `UPDATE feedback
                 SET comment = NULL
                 WHERE customer_id = ?
                   AND id NOT IN (
                        SELECT id FROM (
                            SELECT id
                            FROM feedback
                            WHERE customer_id = ?
                            ORDER BY created_at DESC, id DESC
                            LIMIT 5
                        ) t
                   )`,
                [cid, cid]
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
};

module.exports = Feedback;
