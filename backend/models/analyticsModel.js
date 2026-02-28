const { promisePool } = require('../config/db');

const Analytics = {
    /**
     * Get daily analytics for a specific date (default: today)
     */
    getDailyAnalytics: async (date = null) => {
        const targetDate = date || new Date().toISOString().split('T')[0];

        // Total revenue (all orders for the day)
        const [totalResult] = await promisePool.query(
            `SELECT 
                COALESCE(SUM(totalAmount), 0) as totalRevenue,
                COUNT(*) as totalOrders
            FROM orders 
            WHERE DATE(orderDate) = ?`,
            [targetDate]
        );

        // Paid revenue
        const [paidResult] = await promisePool.query(
            `SELECT 
                COALESCE(SUM(totalAmount), 0) as paidRevenue,
                COUNT(*) as paidOrders
            FROM orders 
            WHERE DATE(orderDate) = ? AND paymentStatus = 'Paid'`,
            [targetDate]
        );

        // Pending revenue (Unpaid)
        const [pendingResult] = await promisePool.query(
            `SELECT 
                COALESCE(SUM(totalAmount), 0) as pendingRevenue,
                COUNT(*) as pendingOrders
            FROM orders 
            WHERE DATE(orderDate) = ? AND paymentStatus = 'Unpaid'`,
            [targetDate]
        );

        // Online revenue
        const [onlineResult] = await promisePool.query(
            `SELECT 
                COALESCE(SUM(totalAmount), 0) as onlineRevenue,
                COUNT(*) as onlineOrders
            FROM orders 
            WHERE DATE(orderDate) = ? AND orderType = 'Online'`,
            [targetDate]
        );

        // Offline revenue
        const [offlineResult] = await promisePool.query(
            `SELECT 
                COALESCE(SUM(totalAmount), 0) as offlineRevenue,
                COUNT(*) as offlineOrders
            FROM orders 
            WHERE DATE(orderDate) = ? AND orderType = 'Offline'`,
            [targetDate]
        );

        return {
            date: targetDate,
            totalRevenue: parseFloat(totalResult[0].totalRevenue),
            totalOrders: totalResult[0].totalOrders,
            paidRevenue: parseFloat(paidResult[0].paidRevenue),
            paidOrders: paidResult[0].paidOrders,
            pendingRevenue: parseFloat(pendingResult[0].pendingRevenue),
            pendingOrders: pendingResult[0].pendingOrders,
            onlineRevenue: parseFloat(onlineResult[0].onlineRevenue),
            onlineOrders: onlineResult[0].onlineOrders,
            offlineRevenue: parseFloat(offlineResult[0].offlineRevenue),
            offlineOrders: offlineResult[0].offlineOrders
        };
    },

    /**
     * Get monthly analytics for a specific month (default: current month)
     */
    getMonthlyAnalytics: async (year = null, month = null) => {
        const now = new Date();
        const targetYear = year || now.getFullYear();
        const targetMonth = month || (now.getMonth() + 1);

        // Total revenue for the month
        const [totalResult] = await promisePool.query(
            `SELECT 
                COALESCE(SUM(totalAmount), 0) as totalRevenue,
                COUNT(*) as totalOrders
            FROM orders 
            WHERE YEAR(orderDate) = ? AND MONTH(orderDate) = ?`,
            [targetYear, targetMonth]
        );

        // Paid revenue
        const [paidResult] = await promisePool.query(
            `SELECT 
                COALESCE(SUM(totalAmount), 0) as paidRevenue,
                COUNT(*) as paidOrders
            FROM orders 
            WHERE YEAR(orderDate) = ? AND MONTH(orderDate) = ? AND paymentStatus = 'Paid'`,
            [targetYear, targetMonth]
        );

        // Pending revenue
        const [pendingResult] = await promisePool.query(
            `SELECT 
                COALESCE(SUM(totalAmount), 0) as pendingRevenue,
                COUNT(*) as pendingOrders
            FROM orders 
            WHERE YEAR(orderDate) = ? AND MONTH(orderDate) = ? AND paymentStatus = 'Unpaid'`,
            [targetYear, targetMonth]
        );

        // Online revenue
        const [onlineResult] = await promisePool.query(
            `SELECT 
                COALESCE(SUM(totalAmount), 0) as onlineRevenue,
                COUNT(*) as onlineOrders
            FROM orders 
            WHERE YEAR(orderDate) = ? AND MONTH(orderDate) = ? AND orderType = 'Online'`,
            [targetYear, targetMonth]
        );

        // Offline revenue
        const [offlineResult] = await promisePool.query(
            `SELECT 
                COALESCE(SUM(totalAmount), 0) as offlineRevenue,
                COUNT(*) as offlineOrders
            FROM orders 
            WHERE YEAR(orderDate) = ? AND MONTH(orderDate) = ? AND orderType = 'Offline'`,
            [targetYear, targetMonth]
        );

        // Daily breakdown for the month
        const [dailyBreakdown] = await promisePool.query(
            `SELECT 
                DATE(orderDate) as date,
                COALESCE(SUM(totalAmount), 0) as revenue,
                COUNT(*) as orders
            FROM orders 
            WHERE YEAR(orderDate) = ? AND MONTH(orderDate) = ?
            GROUP BY DATE(orderDate)
            ORDER BY date ASC`,
            [targetYear, targetMonth]
        );

        return {
            year: targetYear,
            month: targetMonth,
            totalRevenue: parseFloat(totalResult[0].totalRevenue),
            totalOrders: totalResult[0].totalOrders,
            paidRevenue: parseFloat(paidResult[0].paidRevenue),
            paidOrders: paidResult[0].paidOrders,
            pendingRevenue: parseFloat(pendingResult[0].pendingRevenue),
            pendingOrders: pendingResult[0].pendingOrders,
            onlineRevenue: parseFloat(onlineResult[0].onlineRevenue),
            onlineOrders: onlineResult[0].onlineOrders,
            offlineRevenue: parseFloat(offlineResult[0].offlineRevenue),
            offlineOrders: offlineResult[0].offlineOrders,
            dailyBreakdown: dailyBreakdown.map(d => ({
                date: d.date,
                revenue: parseFloat(d.revenue),
                orders: d.orders
            }))
        };
    },

    /**
     * Get total (all-time) analytics
     */
    getTotalAnalytics: async () => {
        // Total revenue (all time)
        const [totalResult] = await promisePool.query(
            `SELECT 
                COALESCE(SUM(totalAmount), 0) as totalRevenue,
                COUNT(*) as totalOrders
            FROM orders`
        );

        // Paid revenue
        const [paidResult] = await promisePool.query(
            `SELECT 
                COALESCE(SUM(totalAmount), 0) as paidRevenue,
                COUNT(*) as paidOrders
            FROM orders 
            WHERE paymentStatus = 'Paid'`
        );

        // Pending revenue
        const [pendingResult] = await promisePool.query(
            `SELECT 
                COALESCE(SUM(totalAmount), 0) as pendingRevenue,
                COUNT(*) as pendingOrders
            FROM orders 
            WHERE paymentStatus = 'Unpaid'`
        );

        // Online revenue
        const [onlineResult] = await promisePool.query(
            `SELECT 
                COALESCE(SUM(totalAmount), 0) as onlineRevenue,
                COUNT(*) as onlineOrders
            FROM orders 
            WHERE orderType = 'Online'`
        );

        // Offline revenue
        const [offlineResult] = await promisePool.query(
            `SELECT 
                COALESCE(SUM(totalAmount), 0) as offlineRevenue,
                COUNT(*) as offlineOrders
            FROM orders 
            WHERE orderType = 'Offline'`
        );

        // Monthly breakdown (last 12 months)
        const [monthlyBreakdown] = await promisePool.query(
            `SELECT 
                YEAR(orderDate) as year,
                MONTH(orderDate) as month,
                COALESCE(SUM(totalAmount), 0) as revenue,
                COUNT(*) as orders
            FROM orders 
            WHERE orderDate >= DATE_SUB(CURDATE(), INTERVAL 12 MONTH)
            GROUP BY YEAR(orderDate), MONTH(orderDate)
            ORDER BY year DESC, month DESC`
        );

        return {
            totalRevenue: parseFloat(totalResult[0].totalRevenue),
            totalOrders: totalResult[0].totalOrders,
            paidRevenue: parseFloat(paidResult[0].paidRevenue),
            paidOrders: paidResult[0].paidOrders,
            pendingRevenue: parseFloat(pendingResult[0].pendingRevenue),
            pendingOrders: pendingResult[0].pendingOrders,
            onlineRevenue: parseFloat(onlineResult[0].onlineRevenue),
            onlineOrders: onlineResult[0].onlineOrders,
            offlineRevenue: parseFloat(offlineResult[0].offlineRevenue),
            offlineOrders: offlineResult[0].offlineOrders,
            monthlyBreakdown: monthlyBreakdown.map(m => ({
                year: m.year,
                month: m.month,
                revenue: parseFloat(m.revenue),
                orders: m.orders
            }))
        };
    }
};

module.exports = Analytics;
