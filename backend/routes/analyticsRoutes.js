const express = require('express');
const router = express.Router();
const { protect, isAdmin } = require('../middleware');
const {
    getDailyAnalytics,
    getMonthlyAnalytics,
    getTotalAnalytics
} = require('../controllers/analyticsController');
const { analyticsValidators } = require('../middleware/validationMiddleware');

// All routes require admin authentication
router.use(protect);
router.use(isAdmin);

// GET /api/admin/analytics/daily - Get daily analytics
router.get('/daily', analyticsValidators.daily, getDailyAnalytics);

// GET /api/admin/analytics/monthly - Get monthly analytics
router.get('/monthly', analyticsValidators.monthly, getMonthlyAnalytics);

// GET /api/admin/analytics/total - Get total (all-time) analytics
router.get('/total', getTotalAnalytics);

module.exports = router;
