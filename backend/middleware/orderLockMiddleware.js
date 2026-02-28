const Order = require('../models/orderModel');

/**
 * Middleware to prevent modification of locked orders
 * Order is locked when status !== 'Pending'
 */
const checkOrderNotLocked = async (req, res, next) => {
    try {
        const { id } = req.params;

        if (!id) {
            return res.status(400).json({
                success: false,
                message: 'Order ID is required'
            });
        }

        const order = await Order.findById(id);

        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Order not found'
            });
        }

        if (order.status !== 'Pending') {
            return res.status(403).json({
                success: false,
                message: 'Order is locked and cannot be modified.'
            });
        }

        // Attach order to request for use in controller
        req.order = order;
        next();
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Error checking order status'
        });
    }
};

module.exports = checkOrderNotLocked;
