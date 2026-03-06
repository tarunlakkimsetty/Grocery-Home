const { promisePool } = require('./config/db');

const tableExists = async (tableName) => {
    const [rows] = await promisePool.query(
        `SELECT 1 FROM information_schema.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? LIMIT 1`,
        [tableName]
    );
    return rows.length > 0;
};

const addColumnBestEffort = async (tableName, columnSql, columnNameForLogs) => {
    try {
        await promisePool.query(`ALTER TABLE \`${tableName}\` ADD COLUMN ${columnSql}`);
        console.log(`✓ ${tableName}.${columnNameForLogs} column added`);
    } catch (err) {
        const msg = String(err && err.message ? err.message : err);
        if (msg.includes('Duplicate column')) {
            console.log(`✓ ${tableName}.${columnNameForLogs} already exists`);
            return;
        }
        if (msg.includes("doesn't exist")) {
            console.log(`! ${tableName} table missing (skipping ${columnNameForLogs})`);
            return;
        }
        console.log(`! Could not add ${tableName}.${columnNameForLogs} column:`, msg);
    }
};

const ensureIndex = async (tableName, indexName, indexColumnsSql) => {
    try {
        const [rows] = await promisePool.query(
            `SELECT 1
             FROM information_schema.STATISTICS
             WHERE TABLE_SCHEMA = DATABASE()
               AND TABLE_NAME = ?
               AND INDEX_NAME = ?
             LIMIT 1`,
            [tableName, indexName]
        );

        if (rows.length === 0) {
            await promisePool.query(`CREATE INDEX \`${indexName}\` ON \`${tableName}\` (${indexColumnsSql})`);
            console.log(`✓ index ${indexName} created`);
        }
    } catch (err) {
        const msg = String(err && err.message ? err.message : err);
        console.log(`! Could not ensure index ${indexName}:`, msg);
    }
};

const ensureForeignKey = async ({
    tableName,
    columnName,
    referencedTable,
    referencedColumn,
    deleteRule = 'CASCADE',
    updateRule = 'RESTRICT'
}) => {
    try {
        if (!(await tableExists(tableName))) return;

        const [rows] = await promisePool.query(
            `
            SELECT
                rc.CONSTRAINT_NAME AS constraintName,
                rc.DELETE_RULE AS deleteRule,
                rc.UPDATE_RULE AS updateRule
            FROM information_schema.REFERENTIAL_CONSTRAINTS rc
            JOIN information_schema.KEY_COLUMN_USAGE kcu
              ON rc.CONSTRAINT_SCHEMA = kcu.CONSTRAINT_SCHEMA
             AND rc.CONSTRAINT_NAME = kcu.CONSTRAINT_NAME
            WHERE kcu.TABLE_SCHEMA = DATABASE()
              AND kcu.TABLE_NAME = ?
              AND kcu.COLUMN_NAME = ?
              AND kcu.REFERENCED_TABLE_NAME = ?
              AND kcu.REFERENCED_COLUMN_NAME = ?
            LIMIT 1
            `,
            [tableName, columnName, referencedTable, referencedColumn]
        );

        if (rows.length > 0) {
            const existing = rows[0];
            const hasDeleteRule = String(existing.deleteRule || '').toUpperCase() === String(deleteRule).toUpperCase();
            const hasUpdateRule = String(existing.updateRule || '').toUpperCase() === String(updateRule).toUpperCase();
            if (hasDeleteRule && hasUpdateRule) {
                return;
            }

            await promisePool.query(`ALTER TABLE \`${tableName}\` DROP FOREIGN KEY \`${existing.constraintName}\``);
        }

        const baseName = `fk_${tableName}_${columnName}_${String(deleteRule).toLowerCase()}`;
        const sql = `ALTER TABLE \`${tableName}\`
                     ADD CONSTRAINT \`${baseName}\`
                     FOREIGN KEY (\`${columnName}\`)
                     REFERENCES \`${referencedTable}\`(\`${referencedColumn}\`)
                     ON DELETE ${deleteRule}
                     ON UPDATE ${updateRule}`;

        try {
            await promisePool.query(sql);
        } catch (err) {
            const msg = String(err && err.message ? err.message : err);
            if (!msg.includes('Duplicate key name') && !msg.includes('errno: 121')) throw err;
            const altName = `${baseName}_2`;
            await promisePool.query(
                `ALTER TABLE \`${tableName}\`
                 ADD CONSTRAINT \`${altName}\`
                 FOREIGN KEY (\`${columnName}\`)
                 REFERENCES \`${referencedTable}\`(\`${referencedColumn}\`)
                 ON DELETE ${deleteRule}
                 ON UPDATE ${updateRule}`
            );
        }

        console.log(`✓ foreign key ensured: ${tableName}.${columnName} -> ${referencedTable}.${referencedColumn}`);
    } catch (err) {
        const msg = String(err && err.message ? err.message : err);
        console.log(`! Could not ensure FK for ${tableName}.${columnName}:`, msg);
    }
};

const createCoreTables = async () => {
    await promisePool.query(`
        CREATE TABLE IF NOT EXISTS users (
            id INT AUTO_INCREMENT PRIMARY KEY,
            fullName VARCHAR(100) NOT NULL,
            phone VARCHAR(15) UNIQUE NOT NULL,
            place VARCHAR(100),
            password VARCHAR(255) NOT NULL,
            role ENUM('admin', 'customer') DEFAULT 'customer',
            createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    await promisePool.query(`
        CREATE TABLE IF NOT EXISTS products (
            id INT AUTO_INCREMENT PRIMARY KEY,
            name VARCHAR(150) NOT NULL,
            category VARCHAR(100) NOT NULL,
            price DECIMAL(10,2) NOT NULL,
            stock INT DEFAULT 0,
            unit VARCHAR(50) DEFAULT 'pack',
            emoji VARCHAR(10) DEFAULT '📦',
            createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    await promisePool.query(`
        CREATE TABLE IF NOT EXISTS orders (
            id INT AUTO_INCREMENT PRIMARY KEY,
            customerId INT NULL,
            customerName VARCHAR(100),
            phone VARCHAR(15),
            place VARCHAR(100),
            address TEXT,
            orderType ENUM('Online', 'Offline') NOT NULL,
            isVerified BOOLEAN DEFAULT FALSE,
            isPaid BOOLEAN DEFAULT FALSE,
            isDelivered BOOLEAN DEFAULT FALSE,
            isArchived BOOLEAN DEFAULT FALSE,
            status VARCHAR(50) DEFAULT 'Pending',
            paymentStatus ENUM('Unpaid', 'Paid') DEFAULT 'Unpaid',
            totalAmount DECIMAL(12,2) DEFAULT 0.00,
            advanceAmount DECIMAL(12,2) NOT NULL DEFAULT 0.00,
            createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
            orderDate TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            acceptedAt TIMESTAMP NULL,
            verifiedAt TIMESTAMP NULL,
            deliveredAt TIMESTAMP NULL,
            INDEX idx_orders_customerId (customerId),
            CONSTRAINT fk_orders_customerId_users
                FOREIGN KEY (customerId) REFERENCES users(id) ON DELETE SET NULL ON UPDATE RESTRICT
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    await promisePool.query(`
        CREATE TABLE IF NOT EXISTS order_items (
            id INT AUTO_INCREMENT PRIMARY KEY,
            orderId INT NOT NULL,
            productId INT NOT NULL,
            productName VARCHAR(150),
            price DECIMAL(10,2),
            quantity INT,
            isSelected BOOLEAN DEFAULT TRUE,
            total DECIMAL(12,2),
            INDEX idx_order_items_orderId (orderId),
            INDEX idx_order_items_productId (productId),
            CONSTRAINT fk_order_items_orderId_orders
                FOREIGN KEY (orderId) REFERENCES orders(id) ON DELETE CASCADE ON UPDATE RESTRICT,
            CONSTRAINT fk_order_items_productId_products
                FOREIGN KEY (productId) REFERENCES products(id) ON DELETE CASCADE ON UPDATE RESTRICT
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    await promisePool.query(`
        CREATE TABLE IF NOT EXISTS feedback (
            id INT AUTO_INCREMENT PRIMARY KEY,
            order_id INT NOT NULL,
            customer_id INT NOT NULL,
            rating TINYINT NOT NULL,
            comment TEXT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            UNIQUE KEY uq_feedback_order_id (order_id),
            INDEX idx_feedback_order_id (order_id),
            INDEX idx_feedback_customer_id (customer_id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    await promisePool.query(`
        CREATE TABLE IF NOT EXISTS bills (
            id INT AUTO_INCREMENT PRIMARY KEY,
            userId INT NOT NULL,
            grandTotal DECIMAL(12,2) NOT NULL,
            paymentMethod ENUM('Cash', 'Card', 'UPI', 'Other') DEFAULT 'Cash',
            createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            CONSTRAINT fk_bills_userId_users
                FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE ON UPDATE RESTRICT
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    await promisePool.query(`
        CREATE TABLE IF NOT EXISTS bill_items (
            id INT AUTO_INCREMENT PRIMARY KEY,
            billId INT NOT NULL,
            productId INT NOT NULL,
            productName VARCHAR(150),
            price DECIMAL(10,2),
            quantity INT,
            total DECIMAL(12,2),
            CONSTRAINT fk_bill_items_billId_bills
                FOREIGN KEY (billId) REFERENCES bills(id) ON DELETE CASCADE ON UPDATE RESTRICT,
            CONSTRAINT fk_bill_items_productId_products
                FOREIGN KEY (productId) REFERENCES products(id) ON DELETE CASCADE ON UPDATE RESTRICT
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    await promisePool.query(`
        CREATE TABLE IF NOT EXISTS order_payment_history (
            id INT AUTO_INCREMENT PRIMARY KEY,
            orderId INT NOT NULL,
            deltaAmount DECIMAL(12,2) NOT NULL,
            updatedByUserId INT NULL,
            createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            INDEX idx_order_payment_history_orderId (orderId),
            INDEX idx_order_payment_history_createdAt (createdAt)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    console.log('✓ core tables ensured');
};

const ensureCompatibilityViews = async () => {
    try {
        await promisePool.query('DROP VIEW IF EXISTS customers');
        await promisePool.query(`
            CREATE VIEW customers AS
            SELECT
                id,
                fullName AS name,
                phone,
                place,
                createdAt AS created_at
            FROM users
            WHERE role = 'customer'
        `);

        await promisePool.query('DROP VIEW IF EXISTS online_orders');
        await promisePool.query(`
            CREATE VIEW online_orders AS
            SELECT
                id,
                customerId AS customer_id,
                totalAmount AS total_amount,
                advanceAmount AS advance_amount,
                status AS order_status,
                createdAt AS created_at
            FROM orders
            WHERE orderType = 'Online'
        `);

        await promisePool.query('DROP VIEW IF EXISTS offline_orders');
        await promisePool.query(`
            CREATE VIEW offline_orders AS
            SELECT
                id,
                customerName AS customer_name,
                phone,
                totalAmount AS total_amount,
                advanceAmount AS advance_amount,
                status AS order_status,
                createdAt AS created_at
            FROM orders
            WHERE orderType = 'Offline'
        `);

        await promisePool.query('DROP VIEW IF EXISTS order_products');
        await promisePool.query(`
            CREATE VIEW order_products AS
            SELECT
                id,
                orderId AS order_id,
                productId AS product_id,
                quantity,
                price
            FROM order_items
        `);

        await promisePool.query('DROP VIEW IF EXISTS categories');
        await promisePool.query(`
            CREATE VIEW categories AS
            SELECT
                ROW_NUMBER() OVER (ORDER BY category) AS id,
                category AS category_name
            FROM (
                SELECT DISTINCT category
                FROM products
                WHERE category IS NOT NULL AND category <> ''
            ) c
        `);

        await promisePool.query('DROP VIEW IF EXISTS admin_users');
        await promisePool.query(`
            CREATE VIEW admin_users AS
            SELECT
                id,
                fullName AS name,
                phone,
                place,
                createdAt AS created_at
            FROM users
            WHERE role = 'admin'
        `);

        console.log('✓ compatibility views ensured');
    } catch (err) {
        const msg = String(err && err.message ? err.message : err);
        console.log('! Could not ensure compatibility views:', msg);
    }
};

const runMigration = async () => {
    try {
        console.log('Running database schema verification and migration...');

        await createCoreTables();

        await addColumnBestEffort('products', "unit VARCHAR(50) DEFAULT 'pack'", 'unit');
        await addColumnBestEffort('products', "emoji VARCHAR(10) DEFAULT '📦'", 'emoji');

        await addColumnBestEffort('orders', 'isVerified BOOLEAN DEFAULT FALSE', 'isVerified');
        await addColumnBestEffort('orders', 'isPaid BOOLEAN DEFAULT FALSE', 'isPaid');
        await addColumnBestEffort('orders', 'isDelivered BOOLEAN DEFAULT FALSE', 'isDelivered');
        await addColumnBestEffort('orders', 'isArchived BOOLEAN DEFAULT FALSE', 'isArchived');
        await addColumnBestEffort('orders', 'createdAt DATETIME DEFAULT CURRENT_TIMESTAMP', 'createdAt');
        await addColumnBestEffort('orders', 'totalAmount DECIMAL(12,2) DEFAULT 0.00', 'totalAmount');
        await addColumnBestEffort('orders', 'advanceAmount DECIMAL(12,2) NOT NULL DEFAULT 0.00', 'advanceAmount');
        await addColumnBestEffort('orders', 'updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP', 'updatedAt');
        await addColumnBestEffort('orders', 'acceptedAt TIMESTAMP NULL', 'acceptedAt');
        await addColumnBestEffort('orders', 'verifiedAt TIMESTAMP NULL', 'verifiedAt');
        await addColumnBestEffort('orders', 'deliveredAt TIMESTAMP NULL', 'deliveredAt');

        await addColumnBestEffort('order_items', 'isSelected BOOLEAN DEFAULT TRUE', 'isSelected');
        await addColumnBestEffort('order_items', 'total DECIMAL(12,2)', 'total');
        await addColumnBestEffort('bill_items', 'total DECIMAL(12,2)', 'total');

        try {
            await promisePool.query(`ALTER TABLE orders MODIFY COLUMN status VARCHAR(50) DEFAULT 'Pending'`);
            await promisePool.query(`ALTER TABLE orders MODIFY COLUMN advanceAmount DECIMAL(12,2) NOT NULL DEFAULT 0.00`);
            await promisePool.query(`ALTER TABLE orders MODIFY COLUMN totalAmount DECIMAL(12,2) DEFAULT 0.00`);
            console.log('✓ key order column data types/defaults normalized');
        } catch (err) {
            const msg = String(err && err.message ? err.message : err);
            console.log('! Could not fully normalize order column types/defaults:', msg);
        }

        await ensureForeignKey({
            tableName: 'orders',
            columnName: 'customerId',
            referencedTable: 'users',
            referencedColumn: 'id',
            deleteRule: 'SET NULL',
            updateRule: 'RESTRICT'
        });
        await ensureForeignKey({
            tableName: 'order_items',
            columnName: 'orderId',
            referencedTable: 'orders',
            referencedColumn: 'id',
            deleteRule: 'CASCADE',
            updateRule: 'RESTRICT'
        });
        await ensureForeignKey({
            tableName: 'order_items',
            columnName: 'productId',
            referencedTable: 'products',
            referencedColumn: 'id',
            deleteRule: 'CASCADE',
            updateRule: 'RESTRICT'
        });
        await ensureForeignKey({
            tableName: 'bills',
            columnName: 'userId',
            referencedTable: 'users',
            referencedColumn: 'id',
            deleteRule: 'CASCADE',
            updateRule: 'RESTRICT'
        });
        await ensureForeignKey({
            tableName: 'bill_items',
            columnName: 'billId',
            referencedTable: 'bills',
            referencedColumn: 'id',
            deleteRule: 'CASCADE',
            updateRule: 'RESTRICT'
        });
        await ensureForeignKey({
            tableName: 'bill_items',
            columnName: 'productId',
            referencedTable: 'products',
            referencedColumn: 'id',
            deleteRule: 'CASCADE',
            updateRule: 'RESTRICT'
        });

        await ensureForeignKey({
            tableName: 'feedback',
            columnName: 'order_id',
            referencedTable: 'orders',
            referencedColumn: 'id',
            deleteRule: 'CASCADE',
            updateRule: 'RESTRICT'
        });
        await ensureForeignKey({
            tableName: 'feedback',
            columnName: 'customer_id',
            referencedTable: 'users',
            referencedColumn: 'id',
            deleteRule: 'CASCADE',
            updateRule: 'RESTRICT'
        });

        await ensureIndex('users', 'idx_users_phone', '`phone`');
        await ensureIndex('users', 'idx_users_role', '`role`');
        await ensureIndex('products', 'idx_products_category', '`category`');
        await ensureIndex('orders', 'idx_orders_customerId', '`customerId`');
        await ensureIndex('orders', 'idx_orders_status', '`status`');
        await ensureIndex('orders', 'idx_orders_orderType', '`orderType`');
        await ensureIndex('order_items', 'idx_order_items_orderId', '`orderId`');
        await ensureIndex('order_items', 'idx_order_items_productId', '`productId`');
        await ensureIndex('feedback', 'idx_feedback_order_id', '`order_id`');
        await ensureIndex('feedback', 'idx_feedback_customer_id', '`customer_id`');
        await ensureIndex('bills', 'idx_bills_userId', '`userId`');
        await ensureIndex('bills', 'idx_bills_createdAt', '`createdAt`');
        await ensureIndex('bill_items', 'idx_bill_items_billId', '`billId`');
        await ensureIndex('bill_items', 'idx_bill_items_productId', '`productId`');

        try {
            await promisePool.query(`
                UPDATE orders
                SET
                    isVerified = CASE WHEN status IN ('Verified','Paid','Delivered','Completed') THEN TRUE ELSE FALSE END,
                    isPaid = CASE WHEN paymentStatus = 'Paid' OR status IN ('Paid','Completed') THEN TRUE ELSE FALSE END,
                    isDelivered = CASE WHEN status IN ('Delivered','Completed') THEN TRUE ELSE FALSE END
            `);
            await promisePool.query(`
                UPDATE orders
                SET isArchived = CASE WHEN status IN ('Completed','Rejected') THEN TRUE ELSE FALSE END
            `);
            await promisePool.query(`
                UPDATE orders
                SET createdAt = COALESCE(createdAt, orderDate, updatedAt, NOW())
            `);
            await promisePool.query(`
                UPDATE orders o
                SET totalAmount = (
                    SELECT COALESCE(SUM(oi.quantity * oi.price), 0)
                    FROM order_items oi
                    WHERE oi.orderId = o.id
                )
                WHERE COALESCE(o.totalAmount, 0) = 0
            `);
            console.log('✓ existing orders backfilled/normalized');
        } catch (err) {
            const msg = String(err && err.message ? err.message : err);
            console.log('! Could not backfill/normalize some order data:', msg);
        }

        await ensureCompatibilityViews();

        console.log('Schema verification completed successfully!');
        process.exit(0);
    } catch (error) {
        console.error('Migration failed:', error.message);
        process.exit(1);
    }
};

runMigration();
