const { promisePool } = require('../config/db');

const Favorite = {
    /**
     * Add a product to favorites
     */
    add: async (customerId, productId) => {
        try {
            const [result] = await promisePool.query(
                'INSERT INTO favorites (customer_id, product_id) VALUES (?, ?)',
                [customerId, productId]
            );
            
            return {
                id: result.insertId,
                customerId,
                productId,
                createdAt: new Date()
            };
        } catch (error) {
            // Check if it's a unique constraint violation (already favorited)
            if (error.code === 'ER_DUP_ENTRY') {
                throw new Error('Product already in favorites');
            }
            throw error;
        }
    },

    /**
     * Remove a product from favorites
     */
    remove: async (customerId, productId) => {
        const [result] = await promisePool.query(
            'DELETE FROM favorites WHERE customer_id = ? AND product_id = ?',
            [customerId, productId]
        );
        
        return result.affectedRows > 0;
    },

    /**
     * Check if product is in customer's favorites
     */
    isFavorited: async (customerId, productId) => {
        const [rows] = await promisePool.query(
            'SELECT 1 FROM favorites WHERE customer_id = ? AND product_id = ? LIMIT 1',
            [customerId, productId]
        );
        
        return rows.length > 0;
    },

    /**
     * Get all favorite products for a customer
     */
    getByCustomerId: async (customerId, options = {}) => {
        const { page = 1, limit = 50 } = options;
        const offset = (page - 1) * limit;

        // Get favorite product IDs
        const [favorites] = await promisePool.query(
            `SELECT f.id, f.product_id, f.created_at, p.* 
             FROM favorites f
             JOIN products p ON f.product_id = p.id
             WHERE f.customer_id = ?
             ORDER BY f.created_at DESC
             LIMIT ? OFFSET ?`,
            [customerId, limit, offset]
        );

        // Get total count
        const [countResult] = await promisePool.query(
            'SELECT COUNT(*) as total FROM favorites WHERE customer_id = ?',
            [customerId]
        );

        return {
            favorites: favorites || [],
            total: countResult[0]?.total || 0,
            page,
            limit,
            pages: Math.ceil((countResult[0]?.total || 0) / limit)
        };
    },

    /**
     * Get count of favorites for a customer
     */
    getCountByCustomerId: async (customerId) => {
        const [result] = await promisePool.query(
            'SELECT COUNT(*) as count FROM favorites WHERE customer_id = ?',
            [customerId]
        );
        
        return result[0]?.count || 0;
    },

    /**
     * Get list of favorite product IDs for a customer
     */
    getProductIdsByCustomerId: async (customerId) => {
        const [rows] = await promisePool.query(
            'SELECT product_id FROM favorites WHERE customer_id = ? ORDER BY created_at DESC',
            [customerId]
        );
        
        return rows.map(row => row.product_id);
    }
};

module.exports = Favorite;
