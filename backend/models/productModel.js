const { promisePool } = require('../config/db');

const Product = {
    /**
     * Create new product
     */
    create: async (productData) => {
        const { name, category, price, stock = 0, unit = 'pack', emoji = '📦' } = productData;
        
        const [result] = await promisePool.query(
            'INSERT INTO products (name, category, price, stock, unit, emoji) VALUES (?, ?, ?, ?, ?, ?)',
            [name, category, price, stock, unit, emoji]
        );
        
        return {
            id: result.insertId,
            name,
            category,
            price,
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
        return rows[0] || null;
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
            products: rows,
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
        return rows;
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
        const { name, category, price, stock } = productData;
        
        const [result] = await promisePool.query(
            'UPDATE products SET name = ?, category = ?, price = ?, stock = ? WHERE id = ?',
            [name, category, price, stock, id]
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
