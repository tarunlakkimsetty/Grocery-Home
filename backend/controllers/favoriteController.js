const Favorite = require('../models/favoriteModel');
const Product = require('../models/productModel');

/**
 * @desc    Add a product to favorites
 * @route   POST /api/favorites/:productId
 * @access  Authenticated customer
 */
const addFavorite = async (req, res, next) => {
    try {
        const customerId = req.user?.id;
        const { productId } = req.params;

        if (!customerId) {
            return res.status(401).json({
                success: false,
                message: 'Unauthorized. Please log in.'
            });
        }

        // Validate productId
        const productIdNum = parseInt(productId);
        if (!Number.isInteger(productIdNum) || productIdNum <= 0) {
            return res.status(400).json({
                success: false,
                message: 'Invalid product ID'
            });
        }

        // Check if product exists
        const product = await Product.findById(productIdNum);
        if (!product) {
            return res.status(404).json({
                success: false,
                message: 'Product not found'
            });
        }

        // Check if already favorited
        const isFavorited = await Favorite.isFavorited(customerId, productIdNum);
        if (isFavorited) {
            return res.status(400).json({
                success: false,
                message: 'Product is already in favorites'
            });
        }

        // Add to favorites
        const favorite = await Favorite.add(customerId, productIdNum);

        res.status(201).json({
            success: true,
            message: 'Product added to favorites',
            favorite
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Remove a product from favorites
 * @route   DELETE /api/favorites/:productId
 * @access  Authenticated customer
 */
const removeFavorite = async (req, res, next) => {
    try {
        const customerId = req.user?.id;
        const { productId } = req.params;

        if (!customerId) {
            return res.status(401).json({
                success: false,
                message: 'Unauthorized. Please log in.'
            });
        }

        // Validate productId
        const productIdNum = parseInt(productId);
        if (!Number.isInteger(productIdNum) || productIdNum <= 0) {
            return res.status(400).json({
                success: false,
                message: 'Invalid product ID'
            });
        }

        // Remove from favorites
        const removed = await Favorite.remove(customerId, productIdNum);

        if (!removed) {
            return res.status(404).json({
                success: false,
                message: 'Favorite not found'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Product removed from favorites'
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Get all favorites for logged-in customer
 * @route   GET /api/favorites
 * @access  Authenticated customer
 */
const getFavorites = async (req, res, next) => {
    try {
        const customerId = req.user?.id;

        if (!customerId) {
            return res.status(401).json({
                success: false,
                message: 'Unauthorized. Please log in.'
            });
        }

        const { page = 1, limit = 50 } = req.query;

        const result = await Favorite.getByCustomerId(customerId, {
            page: parseInt(page),
            limit: parseInt(limit)
        });

        res.status(200).json({
            success: true,
            ...result
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Get count of favorites for logged-in customer
 * @route   GET /api/favorites/count
 * @access  Authenticated customer
 */
const getFavoritesCount = async (req, res, next) => {
    try {
        const customerId = req.user?.id;

        if (!customerId) {
            return res.status(401).json({
                success: false,
                message: 'Unauthorized. Please log in.'
            });
        }

        const count = await Favorite.getCountByCustomerId(customerId);

        res.status(200).json({
            success: true,
            count
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Check if a product is favorited by logged-in customer
 * @route   GET /api/favorites/:productId/check
 * @access  Authenticated customer
 */
const checkFavorite = async (req, res, next) => {
    try {
        const customerId = req.user?.id;
        const { productId } = req.params;

        if (!customerId) {
            return res.status(401).json({
                success: false,
                message: 'Unauthorized. Please log in.'
            });
        }

        const productIdNum = parseInt(productId);
        if (!Number.isInteger(productIdNum) || productIdNum <= 0) {
            return res.status(400).json({
                success: false,
                message: 'Invalid product ID'
            });
        }

        const isFavorited = await Favorite.isFavorited(customerId, productIdNum);

        res.status(200).json({
            success: true,
            isFavorited
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    addFavorite,
    removeFavorite,
    getFavorites,
    getFavoritesCount,
    checkFavorite
};
