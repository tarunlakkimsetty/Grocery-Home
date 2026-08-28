const { promisePool } = require('../config/db');

const normalizeStatus = (value) => {
    const normalized = String(value || '').trim().toLowerCase();
    if (normalized === 'active') return 'Active';
    if (normalized === 'inactive') return 'Inactive';
    return 'Inactive';
};

const toSqlDateTime = (value) => {
    if (!value) return null;
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return null;
    const adjusted = new Date(date.getTime() - (date.getTimezoneOffset() * 60000));
    return adjusted.toISOString().slice(0, 19).replace('T', ' ');
};

const Announcement = {
    async list() {
        const [rows] = await promisePool.query(
            `SELECT * FROM announcements ORDER BY CASE WHEN status = 'Active' THEN 0 ELSE 1 END, startDate DESC, createdAt DESC`
        );
        return rows.map((row) => ({
            id: Number(row.id),
            title: row.title,
            message: row.message,
            image: row.image || null,
            startDate: row.startDate,
            expiryDate: row.expiryDate,
            status: normalizeStatus(row.status),
            actionText: row.actionText || null,
            actionLink: row.actionLink || null,
            createdAt: row.createdAt,
            updatedAt: row.updatedAt,
        }));
    },

    async getActive() {
        const [rows] = await promisePool.query(
            `SELECT * FROM announcements
             WHERE status = 'Active'
               AND startDate <= NOW()
               AND expiryDate >= NOW()
             ORDER BY startDate DESC, createdAt DESC`
        );
        return rows.map((row) => ({
            id: Number(row.id),
            title: row.title,
            message: row.message,
            image: row.image || null,
            startDate: row.startDate,
            expiryDate: row.expiryDate,
            status: normalizeStatus(row.status),
            actionText: row.actionText || null,
            actionLink: row.actionLink || null,
            createdAt: row.createdAt,
            updatedAt: row.updatedAt,
        }));
    },

    async getById(id) {
        const [rows] = await promisePool.query('SELECT * FROM announcements WHERE id = ? LIMIT 1', [id]);
        if (!rows[0]) return null;
        const row = rows[0];
        return {
            id: Number(row.id),
            title: row.title,
            message: row.message,
            image: row.image || null,
            startDate: row.startDate,
            expiryDate: row.expiryDate,
            status: normalizeStatus(row.status),
            actionText: row.actionText || null,
            actionLink: row.actionLink || null,
            createdAt: row.createdAt,
            updatedAt: row.updatedAt,
        };
    },

    async create(data) {
        const payload = {
            title: String(data.title || '').trim(),
            message: String(data.message || '').trim(),
            image: data.image ? String(data.image).trim() : null,
            startDate: toSqlDateTime(data.startDate),
            expiryDate: toSqlDateTime(data.expiryDate),
            status: normalizeStatus(data.status),
            actionText: data.actionText ? String(data.actionText).trim() : null,
            actionLink: data.actionLink ? String(data.actionLink).trim() : null,
        };

        const [result] = await promisePool.query(
            `INSERT INTO announcements (title, message, image, startDate, expiryDate, status, actionText, actionLink)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [payload.title, payload.message, payload.image, payload.startDate, payload.expiryDate, payload.status, payload.actionText, payload.actionLink]
        );

        return this.getById(result.insertId);
    },

    async update(id, data) {
        const existing = await this.getById(id);
        if (!existing) return null;

        const payload = {
            title: data.title !== undefined ? String(data.title || '').trim() : existing.title,
            message: data.message !== undefined ? String(data.message || '').trim() : existing.message,
            image: data.image !== undefined ? (data.image ? String(data.image).trim() : null) : existing.image,
            startDate: data.startDate !== undefined ? toSqlDateTime(data.startDate) : existing.startDate,
            expiryDate: data.expiryDate !== undefined ? toSqlDateTime(data.expiryDate) : existing.expiryDate,
            status: data.status !== undefined ? normalizeStatus(data.status) : existing.status,
            actionText: data.actionText !== undefined ? (data.actionText ? String(data.actionText).trim() : null) : existing.actionText,
            actionLink: data.actionLink !== undefined ? (data.actionLink ? String(data.actionLink).trim() : null) : existing.actionLink,
        };

        await promisePool.query(
            `UPDATE announcements
             SET title = ?, message = ?, image = ?, startDate = ?, expiryDate = ?, status = ?, actionText = ?, actionLink = ?
             WHERE id = ?`,
            [payload.title, payload.message, payload.image, payload.startDate, payload.expiryDate, payload.status, payload.actionText, payload.actionLink, id]
        );

        return this.getById(id);
    },

    async delete(id) {
        const [result] = await promisePool.query('DELETE FROM announcements WHERE id = ?', [id]);
        return result.affectedRows > 0;
    },

    async updateStatus(id, status) {
        const nextStatus = normalizeStatus(status);
        await promisePool.query('UPDATE announcements SET status = ? WHERE id = ?', [nextStatus, id]);
        return this.getById(id);
    },
};

module.exports = Announcement;
