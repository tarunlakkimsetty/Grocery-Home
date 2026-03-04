const Feedback = require('../models/feedbackModel');

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

module.exports = {
    getPendingFeedback,
    submitFeedback,
    getAdminFeedbackSummary,
};
