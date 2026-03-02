const Customer = require('../models/customerModel');

/**
 * @desc    Get all customers with aggregated analytics
 * @route   GET /api/admin/customers
 * @access  Private/Admin
 */
const getAdminCustomers = async (req, res, next) => {
    try {
        const customers = await Customer.getAllWithAnalytics();
        res.status(200).json({
            success: true,
            data: customers,
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Get a single customer with aggregated analytics
 * @route   GET /api/admin/customers/:id
 * @access  Private/Admin
 */
const getAdminCustomerById = async (req, res, next) => {
    try {
        const id = parseInt(req.params.id);
        if (!Number.isFinite(id) || id <= 0) {
            return res.status(400).json({
                success: false,
                message: 'Invalid customer id',
            });
        }

        const customer = await Customer.getOneWithAnalyticsById(id);
        if (!customer) {
            return res.status(404).json({
                success: false,
                message: 'Customer not found',
            });
        }

        res.status(200).json({
            success: true,
            data: customer,
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getAdminCustomers,
    getAdminCustomerById,
};
