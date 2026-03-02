const express = require('express');
const router = express.Router();

const authMiddleware = require('../middleware/authMiddleware');
const { getUserOfflineOrders } = require('../controllers/userController');

// User portal routes
router.get('/offline-orders', authMiddleware, getUserOfflineOrders);

module.exports = router;
