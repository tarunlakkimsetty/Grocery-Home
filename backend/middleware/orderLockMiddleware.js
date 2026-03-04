const Order = require('../models/orderModel');

/**
 * Middleware to prevent modification of locked orders
 * Online orders are editable only after admin accepts them (status='Accepted').
 * Offline orders keep legacy behavior (status='Pending').
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

        const orderType = String(order?.orderType || '').trim().toLowerCase();
        const status = String(order?.status || '').trim().toLowerCase();

        const isEditable = orderType === 'online'
            ? status === 'accepted'
            : status === 'pending' || status === 'accepted';

        if (!isEditable) {
            return res.status(403).json({
                success: false,
                message: 'Order is locked and cannot be modified before acceptance.'
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
