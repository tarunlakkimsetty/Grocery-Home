const { promisePool } = require('../config/db');

const SuggestedProduct = {
    getAll: async () => {
        const [rows] = await promisePool.query(`
            SELECT
                sp.id,
                sp.product_id,
                sp.created_by,
                sp.created_at,
                p.name,
                p.category,
                p.price,
                p.stock,
                p.unit,
                p.emoji,
                u.fullName AS created_by_name
            FROM suggested_products sp
            JOIN products p ON p.id = sp.product_id
            LEFT JOIN users u ON u.id = sp.created_by
            ORDER BY sp.created_at DESC, p.name ASC
        `);

        return rows;
    },

    isSuggested: async (productId) => {
        const [rows] = await promisePool.query(
            'SELECT 1 FROM suggested_products WHERE product_id = ? LIMIT 1',
            [productId]
        );
        return rows.length > 0;
    },

    add: async (productId, createdBy) => {
        const exists = await SuggestedProduct.isSuggested(productId);
        if (exists) {
            return {
                id: null,
                product_id: productId,
                created_by: createdBy,
                alreadyExists: true
            };
        }

        const [result] = await promisePool.query(
            'INSERT INTO suggested_products (product_id, created_by) VALUES (?, ?)',
            [productId, createdBy]
        );

        return {
            id: result.insertId,
            product_id: productId,
            created_by: createdBy,
            alreadyExists: false
        };
    },

    remove: async (productId) => {
        const [result] = await promisePool.query(
            'DELETE FROM suggested_products WHERE product_id = ?',
            [productId]
        );
        return result.affectedRows > 0;
    }
};

module.exports = SuggestedProduct;
