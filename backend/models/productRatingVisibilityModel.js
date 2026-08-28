const { promisePool } = require('../config/db');

const DEFAULTS = {
    showRatingsToCustomers: true,
    showCommentsToCustomers: false,
};

const toBoolean = (value, fallback) => {
    if (value === true || value === 1 || value === '1') return true;
    if (value === false || value === 0 || value === '0') return false;
    return fallback;
};

const normalize = (row = {}) => ({
    showRatingsToCustomers: toBoolean(row.show_ratings_to_customers, DEFAULTS.showRatingsToCustomers),
    showCommentsToCustomers: toBoolean(row.show_comments_to_customers, DEFAULTS.showCommentsToCustomers),
});

const ProductRatingVisibility = {
    get: async () => {
        const [rows] = await promisePool.query(
            `SELECT show_ratings_to_customers, show_comments_to_customers
             FROM product_rating_visibility
             WHERE id = 1
             LIMIT 1`
        );
        return normalize(rows && rows[0]);
    },

    update: async ({ showRatingsToCustomers, showCommentsToCustomers, updatedBy }) => {
        const [result] = await promisePool.query(
            `UPDATE product_rating_visibility
             SET show_ratings_to_customers = ?,
                 show_comments_to_customers = ?,
                 updated_by = ?,
                 updated_at = CURRENT_TIMESTAMP
             WHERE id = 1`,
            [showRatingsToCustomers ? 1 : 0, showCommentsToCustomers ? 1 : 0, updatedBy || null]
        );

        if (!result.affectedRows) {
            await promisePool.query(
                `INSERT INTO product_rating_visibility
                    (id, show_ratings_to_customers, show_comments_to_customers, updated_by)
                 VALUES (1, ?, ?, ?)`,
                [showRatingsToCustomers ? 1 : 0, showCommentsToCustomers ? 1 : 0, updatedBy || null]
            );
        }

        return ProductRatingVisibility.get();
    },
};

module.exports = ProductRatingVisibility;
