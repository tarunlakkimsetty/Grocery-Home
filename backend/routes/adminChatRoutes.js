const express = require('express');
const router = express.Router();
const { protect, isAdmin } = require('../middleware');
const {
    getAdminChats,
    getAdminChat,
    sendAdminMessage,
    markAdminRead,
    getAdminUnreadCount,
} = require('../controllers/chatController');

router.use(protect, isAdmin);
router.get('/unread-count', getAdminUnreadCount);
router.get('/', getAdminChats);
router.get('/:customerId', getAdminChat);
router.post('/:customerId/messages', sendAdminMessage);
router.patch('/:customerId/read', markAdminRead);

module.exports = router;
