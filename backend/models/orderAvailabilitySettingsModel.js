const { promisePool } = require('../config/db');

const DEFAULT_ORDER_AVAILABILITY = {
    onlineOrdersEnabled: true,
    listOrdersEnabled: true,
};

const normalizeAvailabilitySettings = (raw = {}) => {
    const source = raw && typeof raw === 'object' ? raw : {};

    const onlineOrdersEnabled = source.onlineOrdersEnabled === undefined
        ? DEFAULT_ORDER_AVAILABILITY.onlineOrdersEnabled
        : Boolean(source.onlineOrdersEnabled === true || source.onlineOrdersEnabled === 'true' || source.onlineOrdersEnabled === 1 || source.onlineOrdersEnabled === '1');

    const listOrdersEnabled = source.listOrdersEnabled === undefined
        ? DEFAULT_ORDER_AVAILABILITY.listOrdersEnabled
        : Boolean(source.listOrdersEnabled === true || source.listOrdersEnabled === 'true' || source.listOrdersEnabled === 1 || source.listOrdersEnabled === '1');

    return {
        onlineOrdersEnabled,
        listOrdersEnabled,
    };
};

const ensureOrderAvailabilityTable = async () => {
    const tableSql = `
        CREATE TABLE IF NOT EXISTS order_availability_settings (
            id INT AUTO_INCREMENT PRIMARY KEY,
            onlineOrdersEnabled BOOLEAN NOT NULL DEFAULT TRUE,
            listOrdersEnabled BOOLEAN NOT NULL DEFAULT TRUE,
            updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `;

    await promisePool.query(tableSql);

    const [rows] = await promisePool.query('SELECT * FROM order_availability_settings ORDER BY id DESC LIMIT 1');
    if (!rows || rows.length === 0) {
        await promisePool.query(
            'INSERT INTO order_availability_settings (onlineOrdersEnabled, listOrdersEnabled) VALUES (?, ?)',
            [DEFAULT_ORDER_AVAILABILITY.onlineOrdersEnabled, DEFAULT_ORDER_AVAILABILITY.listOrdersEnabled]
        );
    }
};

const getOrderAvailabilitySettings = async () => {
    await ensureOrderAvailabilityTable();
    const [rows] = await promisePool.query('SELECT onlineOrdersEnabled, listOrdersEnabled FROM order_availability_settings ORDER BY id DESC LIMIT 1');
    if (!rows || rows.length === 0) {
        return { ...DEFAULT_ORDER_AVAILABILITY };
    }

    return normalizeAvailabilitySettings(rows[0]);
};

const updateOrderAvailabilitySettings = async (settings) => {
    const normalized = normalizeAvailabilitySettings(settings);
    await ensureOrderAvailabilityTable();

    const [result] = await promisePool.query(
        'UPDATE order_availability_settings SET onlineOrdersEnabled = ?, listOrdersEnabled = ?, updatedAt = CURRENT_TIMESTAMP ORDER BY id DESC LIMIT 1',
        [normalized.onlineOrdersEnabled, normalized.listOrdersEnabled]
    );

    if (result && result.affectedRows === 0) {
        await promisePool.query(
            'INSERT INTO order_availability_settings (onlineOrdersEnabled, listOrdersEnabled) VALUES (?, ?)',
            [normalized.onlineOrdersEnabled, normalized.listOrdersEnabled]
        );
    }

    return normalized;
};

module.exports = {
    DEFAULT_ORDER_AVAILABILITY,
    normalizeAvailabilitySettings,
    ensureOrderAvailabilityTable,
    getOrderAvailabilitySettings,
    updateOrderAvailabilitySettings,
};
