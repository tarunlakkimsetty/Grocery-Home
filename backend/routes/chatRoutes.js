const express = require('express');
const router = express.Router();
const { protect, isCustomer } = require('../middleware');
const {
    getCustomerConversation,
    sendCustomerMessage,
    markCustomerRead,
    getCustomerUnreadCount,
} = require('../controllers/chatController');

router.use(protect, isCustomer);
router.get('/conversation', getCustomerConversation);
router.get('/unread-count', getCustomerUnreadCount);
router.post('/messages', sendCustomerMessage);
router.patch('/read', markCustomerRead);

module.exports = router;
