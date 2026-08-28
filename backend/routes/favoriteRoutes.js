const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const {
    addFavorite,
    removeFavorite,
    getFavorites,
    getFavoritesCount,
    checkFavorite
} = require('../controllers/favoriteController');

// All routes require authentication
router.use(authMiddleware);

/**
 * GET /api/favorites/count
 * Get count of favorites for logged-in customer
 * MUST come before /:productId routes
 */
router.get('/count', getFavoritesCount);

/**
 * GET /api/favorites/:productId/check
 * Check if a product is favorited
 * MUST come before other /:productId routes
 */
router.get('/:productId/check', checkFavorite);

/**
 * GET /api/favorites
 * Get all favorites for logged-in customer
 */
router.get('/', getFavorites);

/**
 * POST /api/favorites/:productId
 * Add a product to favorites
 */
router.post('/:productId', addFavorite);

/**
 * DELETE /api/favorites/:productId
 * Remove a product from favorites
 */
router.delete('/:productId', removeFavorite);

module.exports = router;
