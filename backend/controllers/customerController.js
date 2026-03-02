const Customer = require('../models/customerModel');

/**
 * @desc    Get all customers with aggregated analytics
 * @route   GET /api/admin/customers
 * @access  Private/Admin
 */
const getAdminCustomers = async (req, res, next) => {
    try {
        const search = typeof req.query.search === 'string' ? req.query.search.trim() : '';
        const customers = await Customer.getAllWithAnalytics({ search });

        if (process.env.NODE_ENV === 'development') {
            // Debug: aggregated output only (no raw order rows)
            console.log('[CustomerAnalytics] getAdminCustomers rows:', Array.isArray(customers) ? customers.length : 0);
            console.log(
                '[CustomerAnalytics] sample:',
                (Array.isArray(customers) ? customers.slice(0, 5) : []).map((c) => ({
                    id: c.id,
                    phone: c.phone,
                    completed_orders: c.completed_orders,
                    rejected_orders: c.rejected_orders,
                    total_spent: c.total_spent,
                }))
            );
        }
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

        if (process.env.NODE_ENV === 'development') {
            console.log('[CustomerAnalytics] getAdminCustomerById:', {
                id: customer.id,
                phone: customer.phone,
                total_orders: customer.total_orders,
                completed_orders: customer.completed_orders,
                rejected_orders: customer.rejected_orders,
                total_spent: customer.total_spent,
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
