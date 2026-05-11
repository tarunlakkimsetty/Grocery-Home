const fs = require('fs');
const path = require('path');
const { promisePool } = require('../config/db');

const uploadsDir = path.join(__dirname, '../uploads/order-images');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

const OrderImage = {
    createMany: async (records) => {
        const safeRecords = Array.isArray(records) ? records : [];
        if (safeRecords.length === 0) return [];

        const connection = await promisePool.getConnection();
        try {
            await connection.beginTransaction();

            const inserted = [];
            for (const record of safeRecords) {
                const [result] = await connection.query(
                    `INSERT INTO order_images (
                        entityType,
                        entityId,
                        orderType,
                        imagePath,
                        originalName,
                        mimeType,
                        sizeBytes,
                        uploadedBy,
                        uploadedByRole
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                    [
                        record.entityType,
                        record.entityId,
                        record.orderType || null,
                        record.imagePath,
                        record.originalName || null,
                        record.mimeType || null,
                        record.sizeBytes || 0,
                        record.uploadedBy || null,
                        record.uploadedByRole || null,
                    ]
                );

                const [rows] = await connection.query(
                    `SELECT oi.*, u.fullName AS uploadedByName, u.phone AS uploadedByPhone
                     FROM order_images oi
                     LEFT JOIN users u ON oi.uploadedBy = u.id
                     WHERE oi.id = ?
                     LIMIT 1`,
                    [result.insertId]
                );

                const insertedRow = rows?.[0] || null;

                inserted.push({
                    ...(insertedRow || { id: result.insertId, ...record }),
                });
            }

            await connection.commit();
            return inserted;
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    },

    findByEntity: async (entityType, entityId) => {
        const [rows] = await promisePool.query(
            `SELECT oi.*, u.fullName AS uploadedByName, u.phone AS uploadedByPhone
             FROM order_images oi
             LEFT JOIN users u ON oi.uploadedBy = u.id
             WHERE oi.entityType = ? AND oi.entityId = ?
             ORDER BY oi.createdAt DESC, oi.id DESC`,
            [entityType, entityId]
        );

        return rows || [];
    },

    findById: async (id) => {
        const [rows] = await promisePool.query(
            `SELECT oi.*, u.fullName AS uploadedByName, u.phone AS uploadedByPhone
             FROM order_images oi
             LEFT JOIN users u ON oi.uploadedBy = u.id
             WHERE oi.id = ?
             LIMIT 1`,
            [id]
        );

        return rows?.[0] || null;
    },

    deleteById: async (id) => {
        const [result] = await promisePool.query('DELETE FROM order_images WHERE id = ?', [id]);
        return result.affectedRows > 0;
    },
};

module.exports = OrderImage;