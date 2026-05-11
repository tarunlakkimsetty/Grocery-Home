const fs = require('fs');
const path = require('path');
const Order = require('../models/orderModel');
const Bill = require('../models/billModel');
const User = require('../models/userModel');
const OrderImage = require('../models/orderImageModel');

const uploadsDir = path.join(__dirname, '../uploads/order-images');

const normalizeEntityType = (value) => String(value || '').trim().toLowerCase();

const cleanFileName = (name) => String(name || 'image')
    .replace(/[^a-zA-Z0-9._-]+/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_+|_+$/g, '');

const toPublicUrl = (fileName) => `/uploads/order-images/${fileName}`;

const getPublicUrl = (req, imagePath) => {
    if (!imagePath) return '';
    if (/^https?:\/\//i.test(imagePath)) return imagePath;

    const host = req?.get?.('host');
    const protocol = req?.protocol || 'http';
    if (host) {
        return `${protocol}://${host}${imagePath.startsWith('/') ? imagePath : `/${imagePath}`}`;
    }

    return imagePath;
};

const formatImageResponse = (req, image) => ({
    id: image.id,
    entityType: image.entityType,
    entityId: image.entityId,
    orderType: image.orderType,
    imagePath: image.imagePath,
    imageUrl: getPublicUrl(req, image.imagePath),
    publicUrl: getPublicUrl(req, image.imagePath),
    originalName: image.originalName,
    mimeType: image.mimeType,
    sizeBytes: image.sizeBytes,
    uploadedBy: image.uploadedBy,
    uploadedByName: image.uploadedByName || null,
    uploadedByRole: image.uploadedByRole || null,
    createdAt: image.createdAt,
    uploadedAt: image.createdAt,
});

const resolveTarget = async (entityType, entityId) => {
    if (entityType === 'bill') {
        return Bill.findById(entityId);
    }

    const order = await Order.findById(entityId);
    if (order) return order;

    // Some bill/history rows are surfaced from finalized billing data even when
    // the underlying row is resolved through the bills table rather than orders.
    return Bill.findById(entityId);
};

const getEntityAccess = async (entityType, target, user) => {
    if (!target) return false;
    if (user?.role === 'admin') return true;

    const userId = Number(user?.id || 0) || null;
    if (entityType === 'bill') {
        return Number(target.userId || 0) === userId;
    }

    const targetCustomerId = Number(target.customerId || 0) || null;
    if (targetCustomerId && targetCustomerId === userId) {
        return true;
    }

    if (!userId) return false;

    try {
        const dbUser = await User.findById(userId);
        const userPhone = String(dbUser?.phone || '').replace(/\D/g, '');
        const targetPhone = String(target?.phone || target?.customerPhone || '').replace(/\D/g, '');

        return Boolean(userPhone && targetPhone && userPhone === targetPhone);
    } catch {
        return false;
    }
};

const deleteFileIfExists = async (filePath) => {
    if (!filePath) return;

    const normalized = String(filePath).replace(/^\//, '');
    const absolutePath = path.join(path.dirname(uploadsDir), normalized.replace(/^uploads[\\/]/, 'uploads/'));

    try {
        if (fs.existsSync(absolutePath)) {
            await fs.promises.unlink(absolutePath);
        }
    } catch {
        // Best effort cleanup only.
    }
};

const OrderImageController = {
    getOrderImages: async (req, res, next) => {
        try {
            const entityType = normalizeEntityType(req.query.entityType);
            const entityId = Number(req.query.entityId);

            if (!['order', 'bill'].includes(entityType) || !Number.isInteger(entityId) || entityId <= 0) {
                return res.status(400).json({
                    success: false,
                    message: 'entityType and entityId are required',
                });
            }

            const target = await resolveTarget(entityType, entityId);
            if (!target) {
                return res.status(404).json({
                    success: false,
                    message: 'Target not found',
                    data: [],
                    count: 0,
                });
            }

            const hasAccess = await getEntityAccess(entityType, target, req.user);
            if (!hasAccess) {
                return res.status(403).json({
                    success: false,
                    message: 'Access denied',
                });
            }

            const images = await OrderImage.findByEntity(entityType, entityId);

            res.status(200).json({
                success: true,
                count: images.length,
                data: images.map((image) => formatImageResponse(req, image)),
            });
        } catch (error) {
            next(error);
        }
    },

    uploadOrderImages: async (req, res, next) => {
        const savedFiles = [];
        try {
            const entityType = normalizeEntityType(req.body.entityType);
            const entityId = Number(req.body.entityId);
            const orderType = req.body.orderType || null;
            const files = Array.isArray(req.files) ? req.files : [];

            if (!['order', 'bill'].includes(entityType) || !Number.isInteger(entityId) || entityId <= 0) {
                return res.status(400).json({
                    success: false,
                    message: 'entityType and entityId are required',
                });
            }

            if (files.length === 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Please select at least one image',
                });
            }

            const target = await resolveTarget(entityType, entityId);
            if (!target) {
                return res.status(404).json({
                    success: false,
                    message: 'Target not found',
                });
            }

            const safeFiles = files.filter((file) => Boolean(file && file.buffer));
            if (safeFiles.length === 0) {
                return res.status(400).json({
                    success: false,
                    message: 'No valid image files were uploaded',
                });
            }

            await fs.promises.mkdir(uploadsDir, { recursive: true });

            const records = [];
            for (const file of safeFiles) {
                const baseName = cleanFileName(path.parse(file.originalname || 'image').name || 'image');
                const extension = cleanFileName(path.extname(file.originalname || '').replace('.', ''));
                const suffix = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
                const fileName = `order-image-${entityType}-${entityId}-${suffix}-${baseName}${extension ? `.${extension}` : ''}`;
                const filePath = path.join(uploadsDir, fileName);

                await fs.promises.writeFile(filePath, file.buffer);
                savedFiles.push(filePath);

                records.push({
                    entityType,
                    entityId,
                    orderType,
                    imagePath: toPublicUrl(fileName),
                    originalName: file.originalname || fileName,
                    mimeType: file.mimetype || null,
                    sizeBytes: file.size || file.buffer.length || 0,
                    uploadedBy: req.user?.id || null,
                    uploadedByRole: req.user?.role || null,
                });
            }

            const inserted = await OrderImage.createMany(records);

            res.status(201).json({
                success: true,
                message: `${inserted.length} image(s) uploaded successfully`,
                count: inserted.length,
                data: inserted.map((image, index) => ({
                    ...formatImageResponse(req, image),
                    tempIndex: index,
                })),
            });
        } catch (error) {
            console.error('[order-images] upload failed:', {
                message: error?.message,
                stack: error?.stack,
            });
            await Promise.all(savedFiles.map((filePath) => deleteFileIfExists(filePath)));
            next(error);
        }
    },

    deleteOrderImage: async (req, res, next) => {
        try {
            const imageId = Number(req.params.id);
            if (!Number.isInteger(imageId) || imageId <= 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Valid image id is required',
                });
            }

            const image = await OrderImage.findById(imageId);
            if (!image) {
                return res.status(404).json({
                    success: false,
                    message: 'Image not found',
                });
            }

            const hasPermission = req.user?.role === 'admin' || Number(image.uploadedBy || 0) === Number(req.user?.id || 0);
            if (!hasPermission) {
                return res.status(403).json({
                    success: false,
                    message: 'Access denied',
                });
            }

            await deleteFileIfExists(image.imagePath);
            await OrderImage.deleteById(imageId);

            res.status(200).json({
                success: true,
                message: 'Image deleted successfully',
            });
        } catch (error) {
            next(error);
        }
    },
};

module.exports = OrderImageController;