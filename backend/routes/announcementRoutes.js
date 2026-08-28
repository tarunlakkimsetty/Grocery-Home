const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const { isAdmin } = require('../middleware/roleMiddleware');
const {
    listAnnouncements,
    getAnnouncementById,
    getActiveAnnouncements,
    createAnnouncement,
    updateAnnouncement,
    toggleAnnouncementStatus,
    deleteAnnouncement,
} = require('../controllers/announcementController');

router.get('/announcements/active', getActiveAnnouncements);
router.get('/admin/announcements', authMiddleware, isAdmin, listAnnouncements);
router.get('/admin/announcements/:id', authMiddleware, isAdmin, getAnnouncementById);
router.post('/admin/announcements', authMiddleware, isAdmin, createAnnouncement);
router.put('/admin/announcements/:id', authMiddleware, isAdmin, updateAnnouncement);
router.patch('/admin/announcements/:id/status', authMiddleware, isAdmin, toggleAnnouncementStatus);
router.delete('/admin/announcements/:id', authMiddleware, isAdmin, deleteAnnouncement);

module.exports = router;
