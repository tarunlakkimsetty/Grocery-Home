const { promisePool } = require('../config/db');

// NOTE:
// This project uses `users` as customers (role='customer') and `orders.status` as the order status.
// The spec's `customers` + `orders.order_status` maps to:
// - customers -> users
// - name -> fullName
// - order_status -> status
// - total_amount -> totalAmount
// - created_at -> createdAt (fallback to orderDate/updatedAt)

const Customer = {
    /**
     * Admin: list all customers with aggregated order analytics.
     */
    getAllWithAnalytics: async () => {
        const [rows] = await promisePool.query(
            `SELECT 
                u.id,
                u.fullName AS name,
                u.phone,
                u.place,

                SUM(CASE WHEN o.status = 'Completed' THEN 1 ELSE 0 END) AS completed_orders,
                SUM(CASE WHEN o.status = 'Rejected' THEN 1 ELSE 0 END) AS rejected_orders,

                COALESCE(SUM(CASE WHEN o.status = 'Completed' THEN o.totalAmount ELSE 0 END), 0) AS total_spent,

                MAX(CASE WHEN o.status = 'Completed' THEN COALESCE(o.createdAt, o.orderDate, o.updatedAt) END) AS last_completed_date,
                MAX(CASE WHEN o.status = 'Rejected' THEN COALESCE(o.createdAt, o.orderDate, o.updatedAt) END) AS last_rejected_date

            FROM users u
            LEFT JOIN orders o ON u.id = o.customerId
            WHERE u.role = 'customer'
            GROUP BY u.id
            ORDER BY u.fullName ASC`
        );

        return rows.map((r) => ({
            ...r,
            completed_orders: Number(r.completed_orders || 0),
            rejected_orders: Number(r.rejected_orders || 0),
            total_spent: Number(r.total_spent || 0),
        }));
    },

    /**
     * Admin: get a single customer's aggregated analytics.
     * Uses parameterized query to prevent SQL injection.
     */
    getOneWithAnalyticsById: async (customerId) => {
        const [rows] = await promisePool.query(
            `SELECT 
                u.id,
                u.fullName AS name,
                u.phone,
                u.place,

                COUNT(o.id) AS total_orders,
                SUM(CASE WHEN o.status = 'Completed' THEN 1 ELSE 0 END) AS completed_orders,
                SUM(CASE WHEN o.status = 'Rejected' THEN 1 ELSE 0 END) AS rejected_orders,

                COALESCE(SUM(CASE WHEN o.status = 'Completed' THEN o.totalAmount ELSE 0 END), 0) AS total_spent,

                MAX(CASE WHEN o.status = 'Completed' THEN COALESCE(o.createdAt, o.orderDate, o.updatedAt) END) AS last_completed_date,
                MAX(CASE WHEN o.status = 'Rejected' THEN COALESCE(o.createdAt, o.orderDate, o.updatedAt) END) AS last_rejected_date

            FROM users u
            LEFT JOIN orders o ON u.id = o.customerId
            WHERE u.role = 'customer' AND u.id = ?
            GROUP BY u.id
            LIMIT 1`,
            [customerId]
        );

        if (!rows || rows.length === 0) return null;
        const r = rows[0];
        return {
            ...r,
            total_orders: Number(r.total_orders || 0),
            completed_orders: Number(r.completed_orders || 0),
            rejected_orders: Number(r.rejected_orders || 0),
            total_spent: Number(r.total_spent || 0),
        };
    },
};

module.exports = Customer;
