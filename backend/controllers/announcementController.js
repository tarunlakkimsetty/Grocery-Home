const Announcement = require('../models/announcementModel');

const parseDateValue = (value) => {
    if (!value) return null;
    if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value.trim())) {
        return new Date(`${value.trim()}T00:00:00`);
    }
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
};

const ensureValidPayload = (body) => {
    const errors = [];
    const title = String(body?.title || '').trim();
    const message = String(body?.message || '').trim();
    const startDate = parseDateValue(body?.startDate);
    const expiryDate = parseDateValue(body?.expiryDate);
    const status = String(body?.status || 'Inactive').trim();

    if (!title) errors.push({ field: 'title', message: 'Title is required' });
    if (!message) errors.push({ field: 'message', message: 'Message is required' });
    if (!startDate || Number.isNaN(startDate.getTime())) errors.push({ field: 'startDate', message: 'Start date is required' });
    if (!expiryDate || Number.isNaN(expiryDate.getTime())) errors.push({ field: 'expiryDate', message: 'Expiry date is required' });

    if (startDate && expiryDate && expiryDate < startDate) {
        errors.push({ field: 'expiryDate', message: 'Expiry date cannot be before start date' });
    }

    const normalizedStatus = /(active|inactive)/i.test(status) ? (status.toLowerCase() === 'active' ? 'Active' : 'Inactive') : 'Inactive';
    if (!['Active', 'Inactive'].includes(normalizedStatus)) {
        errors.push({ field: 'status', message: 'Status must be Active or Inactive' });
    }

    return { errors, normalizedStatus };
};

const serialiseAnnouncement = (announcement) => ({
    ...announcement,
    dismissKey: `announcement_${announcement.id}`,
});

const listAnnouncements = async (req, res, next) => {
    try {
        const announcements = await Announcement.list();
        res.status(200).json({
            success: true,
            data: announcements.map(serialiseAnnouncement),
        });
    } catch (error) {
        next(error);
    }
};

const getActiveAnnouncements = async (req, res, next) => {
    try {
        const announcements = await Announcement.getActive();
        res.status(200).json({
            success: true,
            data: announcements.map(serialiseAnnouncement),
        });
    } catch (error) {
        next(error);
    }
};

const getAnnouncementById = async (req, res, next) => {
    try {
        const id = Number(req.params.id);
        if (!Number.isInteger(id) || id <= 0) {
            return res.status(400).json({ success: false, message: 'Invalid announcement ID' });
        }

        const announcement = await Announcement.getById(id);
        if (!announcement) {
            return res.status(404).json({ success: false, message: 'Announcement not found' });
        }

        return res.status(200).json({ success: true, data: serialiseAnnouncement(announcement) });
    } catch (error) {
        next(error);
    }
};

const createAnnouncement = async (req, res, next) => {
    try {
        const { errors, normalizedStatus } = ensureValidPayload(req.body);
        if (errors.length > 0) {
            return res.status(400).json({ success: false, message: 'Validation failed', errors });
        }

        const announcement = await Announcement.create({
            title: req.body.title,
            message: req.body.message,
            image: req.body.image || null,
            startDate: req.body.startDate,
            expiryDate: req.body.expiryDate,
            status: normalizedStatus,
            actionText: req.body.actionText || null,
            actionLink: req.body.actionLink || null,
        });

        return res.status(201).json({
            success: true,
            message: 'Announcement created successfully',
            data: serialiseAnnouncement(announcement),
        });
    } catch (error) {
        next(error);
    }
};

const updateAnnouncement = async (req, res, next) => {
    try {
        const id = Number(req.params.id);
        if (!Number.isInteger(id) || id <= 0) {
            return res.status(400).json({ success: false, message: 'Invalid announcement ID' });
        }

        const existing = await Announcement.getById(id);
        if (!existing) {
            return res.status(404).json({ success: false, message: 'Announcement not found' });
        }

        const { errors, normalizedStatus } = ensureValidPayload({
            ...existing,
            ...req.body,
            status: req.body.status !== undefined ? req.body.status : existing.status,
        });

        if (errors.length > 0) {
            return res.status(400).json({ success: false, message: 'Validation failed', errors });
        }

        const announcement = await Announcement.update(id, {
            ...req.body,
            status: normalizedStatus,
        });

        return res.status(200).json({
            success: true,
            message: 'Announcement updated successfully',
            data: serialiseAnnouncement(announcement),
        });
    } catch (error) {
        next(error);
    }
};

const toggleAnnouncementStatus = async (req, res, next) => {
    try {
        const id = Number(req.params.id);
        if (!Number.isInteger(id) || id <= 0) {
            return res.status(400).json({ success: false, message: 'Invalid announcement ID' });
        }

        const status = String(req.body?.status || '').trim();
        if (!['Active', 'Inactive'].includes(status) && !['active', 'inactive'].includes(status.toLowerCase())) {
            return res.status(400).json({ success: false, message: 'Status must be Active or Inactive' });
        }

        const announcement = await Announcement.updateStatus(id, status);
        if (!announcement) {
            return res.status(404).json({ success: false, message: 'Announcement not found' });
        }

        return res.status(200).json({
            success: true,
            message: `Announcement ${announcement.status.toLowerCase() === 'active' ? 'activated' : 'deactivated'} successfully`,
            data: serialiseAnnouncement(announcement),
        });
    } catch (error) {
        next(error);
    }
};

const deleteAnnouncement = async (req, res, next) => {
    try {
        const id = Number(req.params.id);
        if (!Number.isInteger(id) || id <= 0) {
            return res.status(400).json({ success: false, message: 'Invalid announcement ID' });
        }

        const deleted = await Announcement.delete(id);
        if (!deleted) {
            return res.status(404).json({ success: false, message: 'Announcement not found' });
        }

        return res.status(200).json({
            success: true,
            message: 'Announcement deleted successfully',
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    listAnnouncements,
    getAnnouncementById,
    getActiveAnnouncements,
    createAnnouncement,
    updateAnnouncement,
    toggleAnnouncementStatus,
    deleteAnnouncement,
};
