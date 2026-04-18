const express = require('express');
const router = express.Router();
const {
    createOnlineOrder,
    getCustomerOrders,
    getAdminOrders,
    getOrder,
    updateOrderItems,
    acceptOrder,
    verifyOrder,
    markOrderPaid,
    markOrderDelivered,
    updateOrderAdvance,
    updateOrderReturn,
    updateOrderStatus,
    rejectOrder,
    addItemToOrder,
    createOfflineOrder,
    getOfflineOrders,
    getOrderPrintData,
} = require('../controllers/orderController');
const authMiddleware = require('../middleware/authMiddleware');
const { isAdmin } = require('../middleware/roleMiddleware');
const checkOrderNotLocked = require('../middleware/orderLockMiddleware');
const { orderValidators } = require('../middleware/validationMiddleware');

// Customer routes
router.post('/online', authMiddleware, orderValidators.createOnline, createOnlineOrder);
router.get('/customer/:id', authMiddleware, getCustomerOrders);

// Admin routes
router.get('/admin', authMiddleware, isAdmin, getAdminOrders);

// Offline order routes (admin only)
router.post('/offline', authMiddleware, isAdmin, orderValidators.createOffline, createOfflineOrder);
router.get('/offline', authMiddleware, isAdmin, getOfflineOrders);

// Order management routes (admin only)
router.put('/:id/update-items', authMiddleware, isAdmin, checkOrderNotLocked, orderValidators.updateItems, updateOrderItems);
router.put('/:id/accept', authMiddleware, isAdmin, orderValidators.getById, acceptOrder);
router.put('/:id/verify', authMiddleware, isAdmin, orderValidators.getById, verifyOrder);
router.put('/:id/mark-paid', authMiddleware, isAdmin, orderValidators.getById, markOrderPaid);
router.put('/:id/deliver', authMiddleware, isAdmin, orderValidators.getById, markOrderDelivered);
router.put('/:id/advance', authMiddleware, isAdmin, orderValidators.updateAdvance, updateOrderAdvance);
router.put('/:id/return', authMiddleware, isAdmin, orderValidators.updateReturn, updateOrderReturn);
router.put('/:id/status', authMiddleware, isAdmin, orderValidators.getById, updateOrderStatus);
router.put('/:id/reject', authMiddleware, isAdmin, orderValidators.getById, rejectOrder);
router.post('/:id/add-item', authMiddleware, isAdmin, checkOrderNotLocked, orderValidators.addItem, addItemToOrder);
router.get('/:id/print', authMiddleware, isAdmin, orderValidators.getById, getOrderPrintData);

// Get single order (customer can view own, admin can view all)
router.get('/:id', authMiddleware, orderValidators.getById, getOrder);

module.exports = router;
