const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const { isAdmin } = require('../middleware/roleMiddleware');
const {
  getOrderAvailabilitySettingsHandler,
  updateOrderAvailabilitySettingsHandler,
} = require('../controllers/orderAvailabilitySettingsController');

router.get('/order-availability', authMiddleware, getOrderAvailabilitySettingsHandler);
router.get('/admin/order-availability', authMiddleware, isAdmin, getOrderAvailabilitySettingsHandler);
router.put('/admin/order-availability', authMiddleware, isAdmin, updateOrderAvailabilitySettingsHandler);

module.exports = router;
