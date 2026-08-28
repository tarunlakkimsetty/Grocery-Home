const { promisePool } = require('../config/db');
const ProductRatingVisibility = require('./productRatingVisibilityModel');

const normalizeText = (value) => String(value || '').trim();

const toSafeInt = (value) => {
    const n = Number(value);
    if (!Number.isFinite(n)) return null;
    const i = Math.floor(n);
    return Number.isInteger(i) && i > 0 ? i : null;
};

const Feedback = {
    getCustomerProductReviews: async (productId) => {
        const pid = toSafeInt(productId);
        if (!pid) throw new Error('Invalid product id');

        const visibility = await ProductRatingVisibility.get();
        if (!visibility.showCommentsToCustomers) return { reviews: [], count: 0 };

        const [rows] = await promisePool.query(
            `SELECT pr.comment, pr.rating, pr.created_at
             FROM product_reviews pr
             WHERE pr.product_id = ?
               AND pr.rating BETWEEN 1 AND 5
               AND pr.comment IS NOT NULL AND TRIM(pr.comment) <> ''
             ORDER BY pr.created_at DESC, pr.id DESC
             LIMIT 50`,
            [pid]
        );

        const reviews = (Array.isArray(rows) ? rows : []).map((row) => {
            const review = {
                comment: row.comment || '',
                created_at: row.created_at || null,
            };
            if (visibility.showRatingsToCustomers) review.rating = Number(row.rating || 0);
            return review;
        });

        return { reviews, count: reviews.length };
    },

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
             FROM product_reviews`
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

    getPendingProductsForCustomer: async (customerId) => {
        const cid = toSafeInt(customerId);
        if (!cid) return [];

        const [userRows] = await promisePool.query(
            'SELECT id, phone, role FROM users WHERE id = ? LIMIT 1',
            [cid]
        );
        if (!Array.isArray(userRows) || userRows.length === 0) return [];

        const user = userRows[0] || {};
        if (normalizeText(user.role).toLowerCase() !== 'customer') return [];
        const phone = normalizeText(user.phone);

        const [rows] = await promisePool.query(
            `
            SELECT
                o.id AS orderId,
                o.orderType,
                o.status,
                COALESCE(o.createdAt, o.orderDate, o.updatedAt) AS orderDate,
                oi.productId,
                MIN(oi.id) AS orderItemId,
                COALESCE(p.name, oi.productName, CONCAT('Product #', oi.productId)) AS productName,
                COALESCE(p.category, 'Unknown') AS productCategory,
                COALESCE(p.emoji, '📦') AS productEmoji,
                COALESCE(SUM(oi.quantity), 0) AS quantityPurchased
            FROM orders o
            INNER JOIN order_items oi
                ON oi.orderId = o.id
            LEFT JOIN products p
                ON p.id = oi.productId
            LEFT JOIN product_reviews pr
                ON pr.order_id = o.id
               AND pr.product_id = oi.productId
               AND pr.customer_id = ?
            WHERE
                o.status = 'Completed'
                AND pr.id IS NULL
                AND (
                    (o.orderType = 'Online' AND o.customerId = ?)
                    OR (o.orderType = 'Offline' AND o.phone = ?)
                )
            GROUP BY
                o.id,
                o.orderType,
                o.status,
                COALESCE(o.createdAt, o.orderDate, o.updatedAt),
                oi.productId,
                COALESCE(p.name, oi.productName, CONCAT('Product #', oi.productId)),
                COALESCE(p.category, 'Unknown'),
                COALESCE(p.emoji, '📦')
            ORDER BY orderDate ASC, o.id ASC, productName ASC
            `,
            [cid, cid, phone]
        );

        const grouped = new Map();
        for (const row of (Array.isArray(rows) ? rows : [])) {
            const orderId = toSafeInt(row.orderId);
            const productId = toSafeInt(row.productId);
            if (!orderId || !productId) continue;

            if (!grouped.has(orderId)) {
                grouped.set(orderId, {
                    orderId,
                    orderType: row.orderType || null,
                    status: row.status || null,
                    orderDate: row.orderDate || null,
                    products: [],
                });
            }

            grouped.get(orderId).products.push({
                orderId,
                orderItemId: toSafeInt(row.orderItemId),
                productId,
                productName: row.productName || `Product #${productId}`,
                productCategory: row.productCategory || 'Unknown',
                productEmoji: row.productEmoji || '📦',
                quantityPurchased: Number(row.quantityPurchased || 0),
            });
        }

        return Array.from(grouped.values());
    },

    submitProductRatings: async ({ customerId, items, globalComment }) => {
        const cid = toSafeInt(customerId);
        if (!cid) throw new Error('Invalid customer id');

        const rawItems = Array.isArray(items) ? items : [];
        const dedup = new Map();

        for (const raw of rawItems) {
            const orderId = toSafeInt(raw?.orderId);
            const productId = toSafeInt(raw?.productId);
            const ratingNumber = Number(raw?.rating);
            const rating = Number.isFinite(ratingNumber) ? Math.floor(ratingNumber) : NaN;

            if (!orderId || !productId) continue;
            if (!Number.isInteger(rating) || rating < 1 || rating > 5) continue;

            const perItemComment = normalizeText(raw?.comment);
            const key = `${orderId}:${productId}`;
            if (!dedup.has(key)) {
                dedup.set(key, {
                    orderId,
                    productId,
                    rating,
                    comment: perItemComment,
                });
            }
        }

        const finalItems = Array.from(dedup.values());
        if (finalItems.length === 0) {
            return { insertedCount: 0, skippedCount: 0, duplicateCount: 0 };
        }

        const safeGlobalComment = normalizeText(globalComment);

        const connection = await promisePool.getConnection();
        try {
            await connection.beginTransaction();

            const [userRows] = await connection.query(
                'SELECT id, phone, role FROM users WHERE id = ? FOR UPDATE',
                [cid]
            );
            if (!Array.isArray(userRows) || userRows.length === 0) {
                throw new Error('Customer not found');
            }

            const user = userRows[0] || {};
            if (normalizeText(user.role).toLowerCase() !== 'customer') {
                throw new Error('Customer account required');
            }

            const phone = normalizeText(user.phone);
            let insertedCount = 0;
            let duplicateCount = 0;

            for (const item of finalItems) {
                const [orderRows] = await connection.query(
                    `SELECT id, status, orderType, customerId, phone
                     FROM orders
                     WHERE id = ?
                     FOR UPDATE`,
                    [item.orderId]
                );

                if (!Array.isArray(orderRows) || orderRows.length === 0) {
                    throw new Error(`Order not found: ${item.orderId}`);
                }

                const order = orderRows[0] || {};
                if (normalizeText(order.status) !== 'Completed') {
                    throw new Error('Ratings are allowed only for Completed orders');
                }

                const orderType = normalizeText(order.orderType);
                const isOnlineMatch = orderType === 'Online' && Number(order.customerId) === cid;
                const isOfflineMatch = orderType === 'Offline' && normalizeText(order.phone) === phone;

                if (!isOnlineMatch && !isOfflineMatch) {
                    throw new Error('You are not allowed to submit ratings for this order');
                }

                const [orderItemRows] = await connection.query(
                    `SELECT id
                     FROM order_items
                     WHERE orderId = ? AND productId = ?
                     ORDER BY id ASC
                     LIMIT 1`,
                    [item.orderId, item.productId]
                );

                if (!Array.isArray(orderItemRows) || orderItemRows.length === 0) {
                    throw new Error(`Product ${item.productId} was not purchased in order ${item.orderId}`);
                }

                const orderItemId = Number(orderItemRows[0].id || 0) || null;
                const finalComment = item.comment || safeGlobalComment || null;

                try {
                    await connection.query(
                        `INSERT INTO product_reviews
                            (order_id, order_item_id, product_id, customer_id, rating, comment)
                         VALUES (?, ?, ?, ?, ?, ?)`,
                        [item.orderId, orderItemId, item.productId, cid, item.rating, finalComment]
                    );
                    insertedCount += 1;
                } catch (err) {
                    const msg = String(err && err.message ? err.message : err);
                    if (msg.includes('Duplicate') || msg.includes('ER_DUP_ENTRY')) {
                        duplicateCount += 1;
                        continue;
                    }
                    throw err;
                }
            }

            await connection.commit();
            return {
                insertedCount,
                skippedCount: Math.max(0, finalItems.length - insertedCount - duplicateCount),
                duplicateCount,
            };
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    },

    getAdminRatedProducts: async ({ search = '', page = 1, limit = 50 } = {}) => {
        const safePageNum = Number(page);
        const safeLimitNum = Number(limit);
        const safePage = Number.isFinite(safePageNum) ? Math.max(1, Math.floor(safePageNum)) : 1;
        const safeLimit = Number.isFinite(safeLimitNum) ? Math.max(1, Math.min(100, Math.floor(safeLimitNum))) : 50;
        const offset = (safePage - 1) * safeLimit;
        const searchTerm = normalizeText(search);

        const where = [];
        const params = [];

        if (searchTerm) {
            where.push('(LOWER(COALESCE(p.name, "")) LIKE ? OR LOWER(COALESCE(p.category, "")) LIKE ? OR CAST(pr.product_id AS CHAR) LIKE ?)');
            params.push(`%${searchTerm.toLowerCase()}%`, `%${searchTerm.toLowerCase()}%`, `%${searchTerm}%`);
        }

        const whereClause = where.length > 0 ? `WHERE ${where.join(' AND ')}` : '';

        const [countRows] = await promisePool.query(
            `
            SELECT COUNT(*) AS total
            FROM (
                SELECT pr.product_id
                FROM product_reviews pr
                LEFT JOIN products p ON p.id = pr.product_id
                ${whereClause}
                GROUP BY pr.product_id
            ) x
            `,
            params
        );

        const [rows] = await promisePool.query(
            `
            SELECT
                pr.product_id,
                COALESCE(p.name, CONCAT('Product #', pr.product_id)) AS product_name,
                COALESCE(p.category, 'Unknown') AS product_category,
                COALESCE(p.emoji, '📦') AS product_emoji,
                AVG(pr.rating) AS average_rating,
                COUNT(*) AS rating_count,
                MAX(pr.created_at) AS last_reviewed_at
            FROM product_reviews pr
            LEFT JOIN products p ON p.id = pr.product_id
            ${whereClause}
            GROUP BY pr.product_id, COALESCE(p.name, CONCAT('Product #', pr.product_id)), COALESCE(p.category, 'Unknown'), COALESCE(p.emoji, '📦')
            HAVING COUNT(*) > 0
            ORDER BY average_rating DESC, rating_count DESC, last_reviewed_at DESC
            LIMIT ? OFFSET ?
            `,
            [...params, safeLimit, offset]
        );

        const products = Array.isArray(rows) ? rows.map((row) => ({
            product_id: Number(row.product_id || 0),
            product_name: row.product_name || '-',
            product_category: row.product_category || '-',
            product_emoji: row.product_emoji || '📦',
            average_rating: Number(row.average_rating || 0),
            rating_count: Number(row.rating_count || 0),
            last_reviewed_at: row.last_reviewed_at || null,
            latest_comments: [],
        })) : [];

        const productIds = products.map((p) => p.product_id).filter((id) => id > 0);
        if (productIds.length > 0) {
            const placeholders = productIds.map(() => '?').join(',');
            const [commentRows] = await promisePool.query(
                `
                SELECT
                    pr.product_id,
                    pr.comment,
                    pr.rating,
                    pr.created_at,
                    u.fullName AS customer_name
                FROM product_reviews pr
                LEFT JOIN users u ON u.id = pr.customer_id
                WHERE pr.product_id IN (${placeholders})
                  AND pr.comment IS NOT NULL
                  AND TRIM(pr.comment) <> ''
                ORDER BY pr.created_at DESC, pr.id DESC
                `,
                productIds
            );

            const commentsByProduct = new Map();
            for (const row of (Array.isArray(commentRows) ? commentRows : [])) {
                const pid = Number(row.product_id || 0);
                if (!pid) continue;
                if (!commentsByProduct.has(pid)) commentsByProduct.set(pid, []);
                const arr = commentsByProduct.get(pid);
                if (arr.length >= 3) continue;
                arr.push({
                    comment: row.comment || '',
                    rating: Number(row.rating || 0),
                    created_at: row.created_at || null,
                    customer_name: row.customer_name || 'Customer',
                });
            }

            for (const product of products) {
                product.latest_comments = commentsByProduct.get(product.product_id) || [];
            }
        }

        const total = Number((countRows && countRows[0] && countRows[0].total) || 0);
        return {
            products,
            pagination: {
                page: safePage,
                limit: safeLimit,
                total,
                totalPages: Math.ceil(total / safeLimit) || 0,
            },
        };
    },

    getAdminReviewsForProduct: async (productId, { page = 1, limit = 50 } = {}) => {
        const pid = toSafeInt(productId);
        if (!pid) throw new Error('Invalid product id');

        const safePageNum = Number(page);
        const safeLimitNum = Number(limit);
        const safePage = Number.isFinite(safePageNum) ? Math.max(1, Math.floor(safePageNum)) : 1;
        const safeLimit = Number.isFinite(safeLimitNum) ? Math.max(1, Math.min(100, Math.floor(safeLimitNum))) : 50;
        const offset = (safePage - 1) * safeLimit;

        const [countRows] = await promisePool.query(
            'SELECT COUNT(*) AS total FROM product_reviews WHERE product_id = ?',
            [pid]
        );

        const [rows] = await promisePool.query(
            `
            SELECT
                pr.id,
                pr.order_id,
                pr.order_item_id,
                pr.product_id,
                pr.customer_id,
                pr.rating,
                pr.comment,
                pr.created_at,
                COALESCE(u.fullName, CONCAT('Customer #', pr.customer_id)) AS customer_name,
                u.phone AS customer_phone,
                COALESCE(p.name, CONCAT('Product #', pr.product_id)) AS product_name,
                COALESCE(p.category, 'Unknown') AS product_category,
                COALESCE(p.emoji, '📦') AS product_emoji
            FROM product_reviews pr
            LEFT JOIN users u ON u.id = pr.customer_id
            LEFT JOIN products p ON p.id = pr.product_id
            WHERE pr.product_id = ?
            ORDER BY pr.created_at DESC, pr.id DESC
            LIMIT ? OFFSET ?
            `,
            [pid, safeLimit, offset]
        );

        return {
            productId: pid,
            reviews: Array.isArray(rows) ? rows.map((row) => ({
                id: Number(row.id || 0),
                order_id: Number(row.order_id || 0),
                order_item_id: Number(row.order_item_id || 0) || null,
                product_id: Number(row.product_id || 0),
                customer_id: Number(row.customer_id || 0),
                customer_name: row.customer_name || 'Customer',
                customer_phone: row.customer_phone || null,
                rating: Number(row.rating || 0),
                comment: row.comment || null,
                created_at: row.created_at || null,
                product_name: row.product_name || `Product #${pid}`,
                product_category: row.product_category || 'Unknown',
                product_emoji: row.product_emoji || '📦',
            })) : [],
            pagination: {
                page: safePage,
                limit: safeLimit,
                total: Number((countRows && countRows[0] && countRows[0].total) || 0),
            },
        };
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
