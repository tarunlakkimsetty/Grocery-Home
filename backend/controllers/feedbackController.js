const Feedback = require('../models/feedbackModel');
const ProductRatingVisibility = require('../models/productRatingVisibilityModel');

/**
 * @desc    Get Completed orders that still need feedback (customer)
 * @route   GET /api/feedback/pending
 * @access  Private/Customer
 */
const getPendingFeedback = async (req, res, next) => {
    try {
        const customerId = req.user && req.user.id;
        const pending = await Feedback.getPendingOrdersForCustomer(customerId);

        res.status(200).json({
            success: true,
            data: pending,
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Submit feedback for an order
 * @route   POST /api/feedback
 * @access  Private/Customer
 */
const submitFeedback = async (req, res, next) => {
    try {
        const customerId = req.user && req.user.id;
        const { orderId, rating, comment } = req.body || {};

        await Feedback.submitFeedback({
            orderId,
            customerId,
            rating,
            comment,
        });

        res.status(201).json({
            success: true,
            message: 'Feedback submitted',
        });
    } catch (error) {
        // Validation-ish errors -> 400
        const msg = String(error && error.message ? error.message : error);
        if (
            msg.includes('Invalid') ||
            msg.includes('must be between') ||
            msg.includes('not allowed') ||
            msg.includes('only for Completed') ||
            msg.includes('already submitted') ||
            msg.includes('not found')
        ) {
            return res.status(400).json({
                success: false,
                message: msg,
            });
        }
        next(error);
    }
};

/**
 * @desc    Admin: overall store rating summary
 * @route   GET /api/feedback/admin/summary
 * @access  Private/Admin
 */
const getAdminFeedbackSummary = async (req, res, next) => {
    try {
        const summary = await Feedback.getOverallSummary();
        res.status(200).json({
            success: true,
            data: summary,
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Get completed-order products that are pending rating (customer)
 * @route   GET /api/feedback/pending-products
 * @access  Private/Customer
 */
const getPendingProductFeedback = async (req, res, next) => {
    try {
        const customerId = req.user && req.user.id;
        const pending = await Feedback.getPendingProductsForCustomer(customerId);

        res.status(200).json({
            success: true,
            data: pending,
        });
    } catch (error) {
        next(error);
    }
};

const getProductVisibilitySettings = async (req, res, next) => {
    try {
        res.status(200).json({ success: true, data: await ProductRatingVisibility.get() });
    } catch (error) {
        next(error);
    }
};

const updateProductVisibilitySettings = async (req, res, next) => {
    try {
        const body = req.body || {};
        if (typeof body.showRatingsToCustomers !== 'boolean' || typeof body.showCommentsToCustomers !== 'boolean') {
            return res.status(400).json({
                success: false,
                message: 'Both visibility settings must be boolean values',
            });
        }

        const data = await ProductRatingVisibility.update({
            showRatingsToCustomers: body.showRatingsToCustomers,
            showCommentsToCustomers: body.showCommentsToCustomers,
            updatedBy: req.user.id,
        });
        res.status(200).json({ success: true, message: 'Product visibility settings updated', data });
    } catch (error) {
        next(error);
    }
};

const getCustomerProductReviews = async (req, res, next) => {
    try {
        const result = await Feedback.getCustomerProductReviews(req.params.productId);
        res.status(200).json({ success: true, data: result.reviews, count: result.count });
    } catch (error) {
        if (String(error?.message || '').includes('Invalid product id')) {
            return res.status(400).json({ success: false, message: error.message });
        }
        next(error);
    }
};

/**
 * @desc    Submit product ratings for purchased products (customer)
 * @route   POST /api/feedback/product-ratings
 * @access  Private/Customer
 */
const submitProductRatings = async (req, res, next) => {
    try {
        const customerId = req.user && req.user.id;
        const { items, comment } = req.body || {};

        const result = await Feedback.submitProductRatings({
            customerId,
            items,
            globalComment: comment,
        });

        res.status(201).json({
            success: true,
            message: result.insertedCount > 0 ? 'Product ratings submitted' : 'No ratings selected to submit',
            data: result,
        });
    } catch (error) {
        const msg = String(error && error.message ? error.message : error);
        if (
            msg.includes('Invalid') ||
            msg.includes('allowed only') ||
            msg.includes('not allowed') ||
            msg.includes('not found') ||
            msg.includes('purchased')
        ) {
            return res.status(400).json({
                success: false,
                message: msg,
            });
        }
        next(error);
    }
};

/**
 * @desc    Admin: list products with ratings
 * @route   GET /api/feedback/admin/product-ratings
 * @access  Private/Admin
 */
const getAdminProductRatings = async (req, res, next) => {
    try {
        const { search = '', page = 1, limit = 50 } = req.query || {};
        const result = await Feedback.getAdminRatedProducts({ search, page, limit });

        res.status(200).json({
            success: true,
            data: result.products,
            pagination: result.pagination,
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Admin: get reviews for a specific product
 * @route   GET /api/feedback/admin/product-ratings/:productId/reviews
 * @access  Private/Admin
 */
const getAdminProductRatingReviews = async (req, res, next) => {
    try {
        const productId = req.params && req.params.productId;
        const { page = 1, limit = 50 } = req.query || {};
        const result = await Feedback.getAdminReviewsForProduct(productId, { page, limit });

        res.status(200).json({
            success: true,
            data: result.reviews,
            pagination: result.pagination,
            productId: result.productId,
        });
    } catch (error) {
        const msg = String(error && error.message ? error.message : error);
        if (msg.includes('Invalid product id')) {
            return res.status(400).json({
                success: false,
                message: msg,
            });
        }
        next(error);
    }
};

module.exports = {
    getPendingFeedback,
    submitFeedback,
    getAdminFeedbackSummary,
    getPendingProductFeedback,
    getProductVisibilitySettings,
    updateProductVisibilitySettings,
    getCustomerProductReviews,
    submitProductRatings,
    getAdminProductRatings,
    getAdminProductRatingReviews,
};
