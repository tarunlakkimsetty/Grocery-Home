const express = require('express');
const router = express.Router();
const {
    generateBill,
    getBillHistory,
    getBillDetails,
    getAllBills
} = require('../controllers/billController');
const authMiddleware = require('../middleware/authMiddleware');
const { isAdmin } = require('../middleware/roleMiddleware');

// All routes require authentication
router.use(authMiddleware);

// GET /api/bills/history - Get bill history for a user (must be before /:id)
router.get('/history', getBillHistory);

// GET /api/bills - Get all bills (admin only)
router.get('/', isAdmin, getAllBills);

// GET /api/bills/:id - Get bill details
router.get('/:id', getBillDetails);

// POST /api/bills - Generate a new bill
router.post('/', generateBill);

module.exports = router;
