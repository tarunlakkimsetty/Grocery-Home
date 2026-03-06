const Analytics = require('../models/analyticsModel');

/**
 * @desc    Get daily analytics
 * @route   GET /api/admin/analytics/daily
 * @access  Private/Admin
 * @query   date (optional) - YYYY-MM-DD format
 */
const getDailyAnalytics = async (req, res, next) => {
    try {
        const { date } = req.query;
        const analytics = await Analytics.getDailyAnalytics(date);
        
        res.status(200).json({
            success: true,
            data: analytics
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Get monthly analytics
 * @route   GET /api/admin/analytics/monthly
 * @access  Private/Admin
 * @query   year (optional), month (optional)
 */
const getMonthlyAnalytics = async (req, res, next) => {
    try {
        const { year, month } = req.query;
        const analytics = await Analytics.getMonthlyAnalytics(
            year ? parseInt(year) : null,
            month ? parseInt(month) : null
        );
        
        res.status(200).json({
            success: true,
            data: analytics
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Get total (all-time) analytics
 * @route   GET /api/admin/analytics/total
 * @access  Private/Admin
 */
const getTotalAnalytics = async (req, res, next) => {
    try {
        const analytics = await Analytics.getTotalAnalytics();
        
        res.status(200).json({
            success: true,
            data: analytics
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Get Sales Analytics dashboard data (cards + tables)
 * @route   GET /api/admin/analytics/dashboard
 * @access  Private/Admin
 */
const getDashboardAnalytics = async (req, res, next) => {
    try {
        const analytics = await Analytics.getDashboardAnalytics();
        res.status(200).json({
            success: true,
            data: analytics,
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Get sales summary by date range (for Sales Analytics dashboard filter)
 * @route   GET /api/admin/analytics/sales-summary
 * @access  Private/Admin
 * @query   startDate (required) - YYYY-MM-DD
 * @query   endDate (required) - YYYY-MM-DD
 */
const getSalesSummaryByDateRange = async (req, res, next) => {
    try {
        const { startDate, endDate } = req.query || {};
        const data = await Analytics.getSalesSummaryByDateRange({ startDate, endDate });
        res.status(200).json({
            success: true,
            data,
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getDailyAnalytics,
    getMonthlyAnalytics,
    getTotalAnalytics,
    getDashboardAnalytics,
    getSalesSummaryByDateRange,
};
