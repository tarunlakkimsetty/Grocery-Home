const { promisePool } = require('../config/db');
const ProductRatingVisibility = require('./productRatingVisibilityModel');
const { calculatePricing } = require('../utils/pricing');

const attachCustomerReviewData = async (products) => {
    const safeProducts = Array.isArray(products) ? products : [];
    if (safeProducts.length === 0) return safeProducts;

    const visibility = await ProductRatingVisibility.get();
    if (!visibility.showRatingsToCustomers && !visibility.showCommentsToCustomers) {
        return safeProducts;
    }

    const productIds = safeProducts.map((product) => Number(product.id || 0)).filter((id) => id > 0);
    if (productIds.length === 0) return safeProducts;

    const placeholders = productIds.map(() => '?').join(',');
    const [rows] = await promisePool.query(
        `SELECT product_id, AVG(rating) AS average_rating, COUNT(*) AS rating_count
         FROM product_reviews
         WHERE product_id IN (${placeholders}) AND rating BETWEEN 1 AND 5
         GROUP BY product_id`,
        productIds
    );
    const summaries = new Map((Array.isArray(rows) ? rows : []).map((row) => [
        Number(row.product_id),
        { average_rating: Number(row.average_rating || 0), rating_count: Number(row.rating_count || 0) },
    ]));

    let commentsByProduct = new Map();
    let commentCounts = new Map();
    if (visibility.showCommentsToCustomers) {
        const [commentRows] = await promisePool.query(
            `SELECT product_id, comment, created_at,
                    COUNT(*) OVER (PARTITION BY product_id) AS comment_count
             FROM product_reviews
             WHERE product_id IN (${placeholders})
               AND rating BETWEEN 1 AND 5
               AND comment IS NOT NULL AND TRIM(comment) <> ''
             ORDER BY created_at DESC, id DESC`,
            productIds
        );
        for (const row of (Array.isArray(commentRows) ? commentRows : [])) {
            const productId = Number(row.product_id || 0);
            if (!productId) continue;
            commentCounts.set(productId, Number(row.comment_count || 0));
            const comments = commentsByProduct.get(productId) || [];
            if (comments.length < 3) {
                comments.push({ comment: row.comment, created_at: row.created_at });
                commentsByProduct.set(productId, comments);
            }
        }
    }

    return safeProducts.map((product) => {
        const nextProduct = { ...product };
        const summary = summaries.get(Number(product.id));
        if (visibility.showRatingsToCustomers && summary?.rating_count > 0) {
            nextProduct.average_rating = summary.average_rating;
            nextProduct.rating_count = summary.rating_count;
        }
        if (visibility.showCommentsToCustomers) {
            const comments = commentsByProduct.get(Number(product.id)) || [];
            nextProduct.comment_count = commentCounts.get(Number(product.id)) || 0;
            nextProduct.latest_comments = comments;
        }
        return nextProduct;
    });
};

const Product = {
    /**
     * Create new product
     */
    create: async (productData) => {
        const { name, category, price, originalPrice, discountedPrice, stock = 0, unit = 'pack', emoji = '📦', freeItemName = null, freeItemQuantity = null, freeItemUnit = null, freeItemDescription = null, freeItemActive = false } = productData;
        const pricing = calculatePricing({ originalPrice: originalPrice ?? price, discountedPrice: discountedPrice ?? price });
        
        const [result] = await promisePool.query(
            `INSERT INTO products
                (name, category, price, originalPrice, discountedPrice, stock, unit, emoji, freeItemName, freeItemQuantity, freeItemUnit, freeItemDescription, freeItemActive)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [name, category, pricing.price, pricing.originalPrice, pricing.discountedPrice, stock, unit, emoji, freeItemName || null, freeItemQuantity || null, freeItemUnit || null, freeItemDescription || null, Boolean(freeItemActive)]
        );
        
        return {
            id: result.insertId,
            name,
            category,
            price: pricing.price,
            originalPrice: pricing.originalPrice,
            discountedPrice: pricing.discountedPrice,
            discountAmount: pricing.discountAmount,
            discountPercentage: pricing.discountPercentage,
            freeItemName: freeItemName || null,
            freeItemQuantity: freeItemQuantity || null,
            freeItemUnit: freeItemUnit || null,
            freeItemDescription: freeItemDescription || null,
            freeItemActive: Boolean(freeItemActive),
            stock,
            unit,
            emoji
        };
    },

    /**
     * Find product by ID
     */
    findById: async (id) => {
        const [rows] = await promisePool.query(
            'SELECT * FROM products WHERE id = ?',
            [id]
        );
        const products = await attachCustomerReviewData(rows[0] ? [rows[0]] : []);
        return products[0] || null;
    },

    /**
     * Get all products with pagination
     */
    findAll: async (options = {}) => {
        const { page = 1, limit = 50, category = null } = options;
        const offset = (page - 1) * limit;

        let query = 'SELECT * FROM products';
        let countQuery = 'SELECT COUNT(*) as total FROM products';
        const params = [];
        const countParams = [];

        if (category) {
            query += ' WHERE category = ?';
            countQuery += ' WHERE category = ?';
            params.push(category);
            countParams.push(category);
        }

        query += ' ORDER BY name ASC LIMIT ? OFFSET ?';
        params.push(parseInt(limit), parseInt(offset));

        const [rows] = await promisePool.query(query, params);
        const [countResult] = await promisePool.query(countQuery, countParams);

        return {
            products: await attachCustomerReviewData(rows),
            pagination: {
                total: countResult[0].total,
                page: parseInt(page),
                limit: parseInt(limit),
                totalPages: Math.ceil(countResult[0].total / limit)
            }
        };
    },

    /**
     * Get products by category
     */
    findByCategory: async (category) => {
        const [rows] = await promisePool.query(
            'SELECT * FROM products WHERE category = ? ORDER BY name ASC',
            [category]
        );
        return attachCustomerReviewData(rows);
    },

    /**
     * Get all unique categories
     */
    getCategories: async () => {
        const [rows] = await promisePool.query(
            'SELECT DISTINCT category FROM products ORDER BY category ASC'
        );
        return rows.map(row => row.category);
    },

    /**
     * Update product
     */
    update: async (id, productData) => {
        const { name, category, price, originalPrice, discountedPrice, stock, unit, freeItemName, freeItemQuantity, freeItemUnit, freeItemDescription, freeItemActive } = productData;
        const pricing = calculatePricing({ originalPrice: originalPrice ?? price, discountedPrice: discountedPrice ?? price });

        const [result] = await promisePool.query(
            `UPDATE products SET name = ?, category = ?, price = ?, originalPrice = ?, discountedPrice = ?, stock = ?, unit = ?,
                freeItemName = ?, freeItemQuantity = ?, freeItemUnit = ?, freeItemDescription = ?, freeItemActive = ? WHERE id = ?`,
            [name, category, pricing.price, pricing.originalPrice, pricing.discountedPrice, stock, unit, freeItemName || null, freeItemQuantity || null, freeItemUnit || null, freeItemDescription || null, Boolean(freeItemActive), id]
        );

        return result.affectedRows > 0;
    },

    /**
     * Update stock only
     */
    updateStock: async (id, stock) => {
        const [result] = await promisePool.query(
            'UPDATE products SET stock = ? WHERE id = ?',
            [stock, id]
        );
        return result.affectedRows > 0;
    },

    /**
     * Decrease stock by quantity
     */
    decreaseStock: async (id, quantity) => {
        const [result] = await promisePool.query(
            'UPDATE products SET stock = stock - ? WHERE id = ? AND stock >= ?',
            [quantity, id, quantity]
        );
        return result.affectedRows > 0;
    },

    /**
     * Delete product
     */
    delete: async (id) => {
        const [result] = await promisePool.query(
            'DELETE FROM products WHERE id = ?',
            [id]
        );
        return result.affectedRows > 0;
    }
};

module.exports = Product;
