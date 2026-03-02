const User = require('../models/userModel');
const Order = require('../models/orderModel');

/**
 * @desc    Get offline orders for logged-in user (exact phone match)
 * @route   GET /api/user/offline-orders
 * @access  Authenticated user
 */
const getUserOfflineOrders = async (req, res, next) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({
                success: false,
                message: 'Access denied. No user context.'
            });
        }

        const dbUser = await User.findById(userId);
        const phone = dbUser?.phone || null;

        const orders = await Order.findOfflineByPhone(phone);

        return res.status(200).json({
            success: true,
            count: orders.length,
            orders
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getUserOfflineOrders
};
