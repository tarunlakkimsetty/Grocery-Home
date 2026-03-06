const { promisePool } = require('../config/db');

const Analytics = {
    /**
     * Get dashboard analytics for the admin Sales Analytics page.
     * Uses completed orders (status=Completed or paymentStatus=Paid or isPaid=TRUE) for sales.
     */
    getDashboardAnalytics: async () => {
        const completedWhere = `(LOWER(o.status) = 'completed' OR o.isPaid = TRUE OR o.paymentStatus = 'Paid')`;

        // Total sales from completed orders (sum of selected order items)
        const [salesRows] = await promisePool.query(
            `SELECT
                COALESCE(SUM(
                    CASE
                        WHEN (oi.isSelected IS NULL OR oi.isSelected = TRUE)
                        THEN COALESCE(oi.total, (COALESCE(oi.quantity, 0) * COALESCE(oi.price, 0)), 0)
                        ELSE 0
                    END
                ), 0) AS totalSales,
                COUNT(DISTINCT o.id) AS completedOrders
            FROM orders o
            LEFT JOIN order_items oi ON oi.orderId = o.id
            WHERE ${completedWhere}`
        );

        // Total bills/orders generated (all orders)
        const [ordersCountRows] = await promisePool.query(
            `SELECT COUNT(*) AS totalBillsGenerated FROM orders`
        );

        // Total stock (sum of quantities)
        const [stockRows] = await promisePool.query(
            `SELECT COALESCE(SUM(stock), 0) AS totalStockQty, COUNT(*) AS productCount FROM products`
        );

        // Top selling products (completed orders)
        const [topProductRows] = await promisePool.query(
            `SELECT
                oi.productId AS productId,
                COALESCE(p.name, oi.productName) AS name,
                COALESCE(p.emoji, '📦') AS emoji,
                COALESCE(SUM(
                    CASE WHEN (oi.isSelected IS NULL OR oi.isSelected = TRUE)
                    THEN COALESCE(oi.quantity, 0)
                    ELSE 0 END
                ), 0) AS quantitySold,
                COALESCE(SUM(
                    CASE WHEN (oi.isSelected IS NULL OR oi.isSelected = TRUE)
                    THEN COALESCE(oi.total, (COALESCE(oi.quantity, 0) * COALESCE(oi.price, 0)), 0)
                    ELSE 0 END
                ), 0) AS revenue
            FROM order_items oi
            INNER JOIN orders o ON o.id = oi.orderId
            LEFT JOIN products p ON p.id = oi.productId
            WHERE ${completedWhere}
            GROUP BY oi.productId, COALESCE(p.name, oi.productName), COALESCE(p.emoji, '📦')
            ORDER BY quantitySold DESC, revenue DESC
            LIMIT 5`
        );

        // Category stock totals
        const [categoryStockRows] = await promisePool.query(
            `SELECT
                category,
                COALESCE(SUM(stock), 0) AS stockQty,
                COUNT(*) AS productCount
            FROM products
            GROUP BY category
            ORDER BY category ASC`
        );

        // Category items sold totals (completed orders)
        const [categorySoldRows] = await promisePool.query(
            `SELECT
                p.category AS category,
                COALESCE(SUM(
                    CASE WHEN (oi.isSelected IS NULL OR oi.isSelected = TRUE)
                    THEN COALESCE(oi.quantity, 0)
                    ELSE 0 END
                ), 0) AS itemsSold
            FROM order_items oi
            INNER JOIN orders o ON o.id = oi.orderId
            INNER JOIN products p ON p.id = oi.productId
            WHERE ${completedWhere}
            GROUP BY p.category`
        );

        const soldByCategory = new Map(
            (Array.isArray(categorySoldRows) ? categorySoldRows : []).map((r) => [String(r.category || ''), Number(r.itemsSold || 0)])
        );

        const categoryAnalytics = (Array.isArray(categoryStockRows) ? categoryStockRows : []).map((r) => ({
            category: r.category,
            stockQty: Number(r.stockQty || 0),
            productCount: Number(r.productCount || 0),
            itemsSold: Number(soldByCategory.get(String(r.category || '')) || 0),
        }));

        // Payment method analytics: prefer orders.paymentMethod if present; else fallback to bills.
        let paymentMethods = [];
        try {
            const [colRows] = await promisePool.query("SHOW COLUMNS FROM orders LIKE 'paymentMethod'");
            const hasPaymentMethod = Array.isArray(colRows) && colRows.length > 0;

            if (hasPaymentMethod) {
                const [pmRows] = await promisePool.query(
                    `SELECT
                        COALESCE(paymentMethod, 'Unknown') AS method,
                        COUNT(*) AS orders,
                        COALESCE(SUM(totalAmount), 0) AS totalSales
                    FROM orders o
                    WHERE ${completedWhere.replaceAll('o.', '')}
                    GROUP BY COALESCE(paymentMethod, 'Unknown')
                    ORDER BY totalSales DESC`
                );
                paymentMethods = Array.isArray(pmRows) ? pmRows : [];
            } else {
                const [pmRows] = await promisePool.query(
                    `SELECT
                        COALESCE(paymentMethod, 'Unknown') AS method,
                        COUNT(*) AS orders,
                        COALESCE(SUM(grandTotal), 0) AS totalSales
                    FROM bills
                    GROUP BY COALESCE(paymentMethod, 'Unknown')
                    ORDER BY totalSales DESC`
                );
                paymentMethods = Array.isArray(pmRows) ? pmRows : [];
            }
        } catch (e) {
            // Safe fallback: no payment method analytics
            paymentMethods = [];
        }

        // Low stock list for the panel
        const [lowStockRows] = await promisePool.query(
            `SELECT id, name, emoji, stock, price
             FROM products
             WHERE COALESCE(stock, 0) < 30
             ORDER BY stock ASC, id ASC
             LIMIT 8`
        );

        const totalSales = Number(salesRows?.[0]?.totalSales || 0);
        const totalBillsGenerated = Number(ordersCountRows?.[0]?.totalBillsGenerated || 0);
        const totalStockQty = Number(stockRows?.[0]?.totalStockQty || 0);
        const productCount = Number(stockRows?.[0]?.productCount || 0);
        const completedOrders = Number(salesRows?.[0]?.completedOrders || 0);

        return {
            totals: {
                totalSales,
                totalBillsGenerated,
                totalStockQty,
                productCount,
                completedOrders,
                salesAnalytics: totalSales,
            },
            topSellingProducts: (Array.isArray(topProductRows) ? topProductRows : []).map((r) => ({
                productId: Number(r.productId || 0),
                name: r.name,
                emoji: r.emoji,
                quantitySold: Number(r.quantitySold || 0),
                revenue: Number(r.revenue || 0),
            })),
            categoryAnalytics,
            paymentMethods: (Array.isArray(paymentMethods) ? paymentMethods : []).map((r) => ({
                method: r.method,
                orders: Number(r.orders || 0),
                totalSales: Number(r.totalSales || 0),
            })),
            lowStockProducts: (Array.isArray(lowStockRows) ? lowStockRows : []).map((p) => ({
                id: p.id,
                name: p.name,
                emoji: p.emoji,
                stock: Number(p.stock || 0),
                price: Number(p.price || 0),
            })),
        };
    },

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
    },

    /**
     * Get sales summary for a given date range (inclusive).
     * This is designed for the Admin Sales Analytics dashboard date filter.
     *
     * Totals include BOTH online and offline orders.
     * - totalSalesAmount + totalProductsSold are computed from completed/paid orders
     *   and sum only selected items (order_items.isSelected).
     * - totalBillsGenerated counts ALL orders created in the given range.
     */
    getSalesSummaryByDateRange: async ({ startDate, endDate }) => {
        const completedWhere = `(LOWER(o.status) = 'completed' OR o.isPaid = TRUE OR o.paymentStatus = 'Paid')`;

        // Use a consistent date source for filtering.
        const dateExpr = `DATE(COALESCE(o.orderDate, o.createdAt, o.updatedAt))`;

        const [billsRows] = await promisePool.query(
            `SELECT
                COUNT(*) AS totalBillsGenerated
             FROM orders o
             WHERE ${dateExpr} BETWEEN ? AND ?`,
            [startDate, endDate]
        );

        const [salesRows] = await promisePool.query(
            `SELECT
                COALESCE(SUM(
                    CASE
                        WHEN (oi.isSelected IS NULL OR oi.isSelected = TRUE)
                        THEN COALESCE(oi.total, (COALESCE(oi.quantity, 0) * COALESCE(oi.price, 0)), 0)
                        ELSE 0
                    END
                ), 0) AS totalSalesAmount,
                COALESCE(SUM(
                    CASE
                        WHEN (oi.isSelected IS NULL OR oi.isSelected = TRUE)
                        THEN COALESCE(oi.quantity, 0)
                        ELSE 0
                    END
                ), 0) AS totalProductsSold
             FROM orders o
             LEFT JOIN order_items oi ON oi.orderId = o.id
             WHERE ${completedWhere}
               AND ${dateExpr} BETWEEN ? AND ?`,
            [startDate, endDate]
        );

        return {
            startDate,
            endDate,
            totalSalesAmount: Number(salesRows?.[0]?.totalSalesAmount || 0) || 0,
            totalBillsGenerated: Number(billsRows?.[0]?.totalBillsGenerated || 0) || 0,
            totalProductsSold: Number(salesRows?.[0]?.totalProductsSold || 0) || 0,
        };
    },
};

module.exports = Analytics;
