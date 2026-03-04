const express = require('express');
const router = express.Router();

const { protect, isAdmin, isCustomer } = require('../middleware');
const {
    getPendingFeedback,
    submitFeedback,
    getAdminFeedbackSummary,
} = require('../controllers/feedbackController');

router.use(protect);

// Customer endpoints
router.get('/pending', isCustomer, getPendingFeedback);
router.post('/', isCustomer, submitFeedback);

// Admin endpoints
router.get('/admin/summary', isAdmin, getAdminFeedbackSummary);

module.exports = router;
