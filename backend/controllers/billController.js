const Bill = require('../models/billModel');

/**
 * @desc    Generate a new bill
 * @route   POST /api/bills
 * @access  Private
 */
const generateBill = async (req, res, next) => {
    try {
        const { items, grandTotal, paymentMethod } = req.body;
        const userId = req.user.id;

        if (!items || items.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Please provide items for the bill'
            });
        }

        const bill = await Bill.create(
            { userId, grandTotal, paymentMethod },
            items
        );

        res.status(201).json({
            success: true,
            message: 'Bill generated successfully',
            data: bill
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Get bill history for a user
 * @route   GET /api/bills/history
 * @access  Private
 */
const getBillHistory = async (req, res, next) => {
    try {
        // Use query param userId or fall back to authenticated user's id
        const userId = req.query.userId || req.user.id;

        // Authorization: customers can only view own bills
        if (req.user.role !== 'admin' && req.user.id !== parseInt(userId)) {
            return res.status(403).json({
                success: false,
                message: 'Access denied. You can only view your own bills.'
            });
        }

        const bills = await Bill.findByUserId(userId);

        res.status(200).json({
            success: true,
            count: bills.length,
            data: bills
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Get bill details by ID
 * @route   GET /api/bills/:id
 * @access  Private
 */
const getBillDetails = async (req, res, next) => {
    try {
        const { id } = req.params;

        const bill = await Bill.findById(id);

        if (!bill) {
            return res.status(404).json({
                success: false,
                message: 'Bill not found'
            });
        }

        // Authorization: customers can only view own bills
        if (req.user.role !== 'admin' && req.user.id !== bill.userId) {
            return res.status(403).json({
                success: false,
                message: 'Access denied. You can only view your own bills.'
            });
        }

        res.status(200).json({
            success: true,
            data: bill
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Get all bills (admin only)
 * @route   GET /api/bills
 * @access  Admin
 */
const getAllBills = async (req, res, next) => {
    try {
        const { page = 1, limit = 50 } = req.query;

        const result = await Bill.findAll({
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

module.exports = {
    generateBill,
    getBillHistory,
    getBillDetails,
    getAllBills
};
