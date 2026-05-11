const config = require('./config/config');
const app = require('./app');
const { testConnection, promisePool } = require('./config/db');

const ensureOrdersStatusVarchar = async () => {
    try {
        await promisePool.query(`
            ALTER TABLE orders
            MODIFY COLUMN status VARCHAR(50) DEFAULT 'Pending'
        `);
        console.log('✓ orders.status ensured as VARCHAR(50)');
    } catch (err) {
        const msg = String(err && err.message ? err.message : err);
        if (msg.includes("doesn't exist") || msg.includes('Unknown column')) {
            return;
        }
        console.log('! Could not ensure orders.status is VARCHAR:', msg);
    }
};

const ensureAdvanceAmountColumn = async () => {
    try {
        await promisePool.query(
            'ALTER TABLE orders ADD COLUMN advanceAmount DECIMAL(12,2) NOT NULL DEFAULT 0.00'
        );
        console.log('✓ orders.advanceAmount ensured');
    } catch (err) {
        const msg = String(err && err.message ? err.message : err);
        if (msg.includes('Duplicate column')) {
            return;
        }
        if (msg.includes("doesn't exist") || msg.includes('Unknown table')) {
            return;
        }
        console.log('! Could not ensure orders.advanceAmount column:', msg);
    }
};

const ensurePaymentMethodColumn = async () => {
    try {
        await promisePool.query(
            "ALTER TABLE orders ADD COLUMN paymentMethod ENUM('Cash','Card','UPI','Other') NULL DEFAULT NULL"
        );
        console.log('✓ orders.paymentMethod ensured');
    } catch (err) {
        const msg = String(err && err.message ? err.message : err);
        if (msg.includes('Duplicate column')) {
            return;
        }
        if (msg.includes("doesn't exist") || msg.includes('Unknown table')) {
            return;
        }
        console.log('! Could not ensure orders.paymentMethod column:', msg);
    }
};

const ensureOrderPaymentHistoryTable = async () => {
    try {
        await promisePool.query(`
            CREATE TABLE IF NOT EXISTS order_payment_history (
                id INT AUTO_INCREMENT PRIMARY KEY,
                orderId INT NOT NULL,
                deltaAmount DECIMAL(12,2) NOT NULL,
                updatedByUserId INT NULL,
                createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                INDEX idx_order_payment_history_orderId (orderId),
                INDEX idx_order_payment_history_createdAt (createdAt),
                CONSTRAINT fk_order_payment_history_orderId_orders
                    FOREIGN KEY (orderId) REFERENCES orders(id) ON DELETE CASCADE ON UPDATE RESTRICT,
                CONSTRAINT fk_order_payment_history_updatedBy_users
                    FOREIGN KEY (updatedByUserId) REFERENCES users(id) ON DELETE SET NULL ON UPDATE RESTRICT
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `);
        console.log('✓ order_payment_history table ensured');
    } catch (err) {
        const msg = String(err && err.message ? err.message : err);
        console.log('! Could not ensure order_payment_history table:', msg);
    }
};

const ensureOrderImagesTable = async () => {
    try {
        await promisePool.query(`
            CREATE TABLE IF NOT EXISTS order_images (
                id INT AUTO_INCREMENT PRIMARY KEY,
                entityType ENUM('order', 'bill') NOT NULL,
                entityId INT NOT NULL,
                orderType VARCHAR(50) NULL,
                imagePath VARCHAR(255) NOT NULL,
                originalName VARCHAR(255) NULL,
                mimeType VARCHAR(100) NULL,
                sizeBytes INT NOT NULL DEFAULT 0,
                uploadedBy INT NULL,
                uploadedByRole VARCHAR(20) NULL,
                createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                INDEX idx_order_images_entity (entityType, entityId),
                INDEX idx_order_images_uploadedBy (uploadedBy),
                CONSTRAINT fk_order_images_uploadedBy_users
                    FOREIGN KEY (uploadedBy) REFERENCES users(id) ON DELETE SET NULL ON UPDATE RESTRICT
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `);
        console.log('✓ order_images table ensured');
    } catch (err) {
        const msg = String(err && err.message ? err.message : err);
        console.log('! Could not ensure order_images table:', msg);
    }
};

const ensureTypeOriginColumns = async () => {
    try {
        try {
            await promisePool.query(
                'ALTER TABLE orders ADD COLUMN `type` VARCHAR(32) DEFAULT NULL'
            );
            console.log('✓ orders.type column ensured');
        } catch (err) {
            const msg = String(err && err.message ? err.message : err);
            if (!msg.includes('Duplicate column')) {
                console.log('! Could not add orders.type column:', msg);
            }
        }

        try {
            await promisePool.query(
                'ALTER TABLE orders ADD COLUMN `origin` VARCHAR(32) DEFAULT NULL'
            );
            console.log('✓ orders.origin column ensured');
        } catch (err) {
            const msg = String(err && err.message ? err.message : err);
            if (!msg.includes('Duplicate column')) {
                console.log('! Could not add orders.origin column:', msg);
            }
        }

        try {
            await promisePool.query('CREATE INDEX idx_orders_type ON orders(`type`)');
            console.log('✓ orders.type index ensured');
        } catch (err) {
            // Ignore if already exists
        }

        try {
            await promisePool.query('CREATE INDEX idx_orders_origin ON orders(`origin`)');
            console.log('✓ orders.origin index ensured');
        } catch (err) {
            // Ignore if already exists
        }
    } catch (err) {
        console.log('! Could not ensure orders.type/origin columns:', String(err && err.message ? err.message : err));
    }
};

const startServer = async () => {
    const isConnected = await testConnection();

    if (!isConnected) {
        console.warn('⚠️  Warning: Could not connect to database during startup');
        console.warn('    Server will still start, but database operations will fail');
        console.warn('    Check DB_HOST, DB_USER, DB_PASSWORD, DB_NAME environment variables');
    }

    if (isConnected) {
        await ensureOrdersStatusVarchar();
        await ensureAdvanceAmountColumn();
        await ensurePaymentMethodColumn();
        await ensureOrderPaymentHistoryTable();
        await ensureOrderImagesTable();
        await ensureTypeOriginColumns();

        try {
            const [columns] = await promisePool.query(
                "SELECT COLUMN_NAME FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'orders' AND COLUMN_NAME = 'type'"
            );

            if (columns && columns.length > 0) {
                await promisePool.query("UPDATE orders SET origin = 'list_orders' WHERE `type` = 'list_converted' AND (origin IS NULL OR origin = '')");
                console.log('✓ backfilled origin for list_converted orders');
            }
        } catch (err) {
            const msg = String(err && err.message ? err.message : err);
            if (!msg.includes('Unknown column')) {
                console.log('! Could not backfill converted origins:', msg);
            }
        }
    }

    app.listen(config.port, () => {
        console.log(`✅ Server running in ${config.env} mode on port ${config.port}`);
        console.log(`📝 API available at http://localhost:${config.port}/`);
        if (isConnected) {
            console.log('✓ Database: Connected');
        } else {
            console.log('⚠️  Database: Not connected');
        }
    });
};

module.exports = { startServer };
