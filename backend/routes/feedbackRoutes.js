const express = require('express');
const router = express.Router();

const { protect, isAdmin, isCustomer } = require('../middleware');
const {
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
} = require('../controllers/feedbackController');

router.use(protect);

// Customer endpoints
router.get('/pending', isCustomer, getPendingFeedback);
router.post('/', isCustomer, submitFeedback);
router.get('/pending-products', isCustomer, getPendingProductFeedback);
router.get('/pending-products/', isCustomer, getPendingProductFeedback);
router.post('/product-ratings', isCustomer, submitProductRatings);
router.get('/products/:productId/reviews', isCustomer, getCustomerProductReviews);

// Admin endpoints
router.get('/visibility-settings', isAdmin, getProductVisibilitySettings);
router.put('/visibility-settings', isAdmin, updateProductVisibilitySettings);
router.get('/admin/summary', isAdmin, getAdminFeedbackSummary);
router.get('/admin/product-ratings', isAdmin, getAdminProductRatings);
router.get('/admin/product-ratings/:productId/reviews', isAdmin, getAdminProductRatingReviews);

module.exports = router;
