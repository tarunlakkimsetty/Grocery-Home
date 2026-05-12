const fs = require('fs');
const path = require('path');
const config = require('./config/config');
const app = require('./app');
const { testConnection, promisePool } = require('./config/db');

const tableExists = async (tableName) => {
        const [rows] = await promisePool.query(
                `SELECT 1
                 FROM information_schema.TABLES
                 WHERE TABLE_SCHEMA = DATABASE()
                     AND TABLE_NAME = ?
                 LIMIT 1`,
                [tableName]
        );
        return rows.length > 0;
};

/**
 * Execute SQL migration files from migrations folder
 * Reads all .sql files, sorts them by filename, and executes them
 */
const executeSqlMigrations = async () => {
    try {
        const migrationsDir = path.join(__dirname, 'migrations');
        
        if (!fs.existsSync(migrationsDir)) {
            console.log('! Migrations folder does not exist, skipping SQL migrations');
            return;
        }

        // Read all SQL files from migrations folder
        const files = fs.readdirSync(migrationsDir)
            .filter(file => file.endsWith('.sql'))
            .sort(); // Sort by filename to ensure proper execution order

        console.log(`Found ${files.length} SQL migration files`);

        for (const file of files) {
            const filePath = path.join(migrationsDir, file);
            const sql = fs.readFileSync(filePath, 'utf8');

            try {
                console.log(`Executing SQL migration: ${file}`);
                
                // Split by semicolon and execute each statement
                const statements = sql
                    .split(';')
                    .map(s => s.trim())
                    .filter(s => s.length > 0 && !s.startsWith('--'));

                for (const statement of statements) {
                    await promisePool.query(statement);
                }

                console.log(`✓ SQL migration completed: ${file}`);
            } catch (err) {
                const msg = String(err && err.message ? err.message : err);
                // Don't fail on "table already exists" or similar warnings
                if (msg.includes('already exists') || msg.includes('ER_TABLE_EXISTS_ERROR')) {
                    console.log(`✓ SQL migration skipped (table exists): ${file}`);
                } else {
                    console.error(`✗ SQL migration failed: ${file}`);
                    console.error(`Error: ${msg}`);
                }
            }
        }

        console.log('✓ All SQL migrations completed');
    } catch (err) {
        console.error('Error executing SQL migrations:', err);
    }
};

const runMigrationStep = async (label, fn) => {
    try {
        console.log(`Migration started: ${label}`);
        await fn();
        console.log(`Migration completed: ${label}`);
    } catch (err) {
        console.error(`Migration failed: ${label}`);
        console.error(err && err.stack ? err.stack : err);
    }
};

const addUsersColumnBestEffort = async (columnSql, columnNameForLogs) => {
    try {
        await promisePool.query(`ALTER TABLE users ADD COLUMN ${columnSql}`);
        console.log(`✓ users.${columnNameForLogs} column ensured`);
    } catch (err) {
        const msg = String(err && err.message ? err.message : err);
        if (msg.includes('Duplicate column')) return;
        if (msg.includes("doesn't exist") || msg.includes('Unknown table')) return;
        console.log(`! Could not ensure users.${columnNameForLogs} column:`, msg);
    }
};

const ensureUsersRegistrationColumns = async () => {
    if (!(await tableExists('users'))) {
        console.log('! Skipping users registration columns migration because users table is missing');
        return;
    }

    console.log('Running users registration column migrations...');

    await addUsersColumnBestEffort('favoriteFood VARCHAR(100) DEFAULT NULL', 'favoriteFood');
    await addUsersColumnBestEffort('favoritePlace VARCHAR(100) DEFAULT NULL', 'favoritePlace');
    await addUsersColumnBestEffort('passwordResetAttempts INT DEFAULT 0', 'passwordResetAttempts');
    await addUsersColumnBestEffort('passwordResetAttemptedAt TIMESTAMP NULL', 'passwordResetAttemptedAt');

    // Legal agreement fields for compliance/audit tracking
    await addUsersColumnBestEffort('agreedToPolicies BOOLEAN DEFAULT FALSE', 'agreedToPolicies');
    await addUsersColumnBestEffort('agreedToTerms BOOLEAN DEFAULT FALSE', 'agreedToTerms');
    await addUsersColumnBestEffort('agreedToPrivacy BOOLEAN DEFAULT FALSE', 'agreedToPrivacy');
    await addUsersColumnBestEffort('legalAcceptedAt TIMESTAMP NULL', 'legalAcceptedAt');
};

const ensureUsersTable = async () => {
    if (await tableExists('users')) {
        return;
    }

    console.log('Creating users table...');
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
};

const ensureOrdersTable = async () => {
    if (await tableExists('orders')) {
        return;
    }

    console.log('Creating orders table...');
    const usersExist = await tableExists('users');

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
            INDEX idx_orders_customerId (customerId)
            ${usersExist ? ', CONSTRAINT fk_orders_customerId_users FOREIGN KEY (customerId) REFERENCES users(id) ON DELETE SET NULL ON UPDATE RESTRICT' : ''}
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
};

const ensureTableExistsIfPossible = async (tableName, createFn) => {
    if (await tableExists(tableName)) return true;
    try {
        await createFn();
        return await tableExists(tableName);
    } catch (err) {
        console.log(`! Could not create ${tableName}:`, String(err && err.message ? err.message : err));
        return false;
    }
};

const ensureOrdersStatusVarchar = async () => {
    if (!(await tableExists('orders'))) {
        console.log('! Skipping orders.status migration because orders table is missing');
        return;
    }
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
    if (!(await tableExists('orders'))) {
        console.log('! Skipping orders.advanceAmount migration because orders table is missing');
        return;
    }
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
    if (!(await tableExists('orders'))) {
        console.log('! Skipping orders.paymentMethod migration because orders table is missing');
        return;
    }
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
    if (!(await tableExists('orders')) || !(await tableExists('users'))) {
        console.log('! Skipping order_payment_history table because orders/users table is missing');
        return;
    }
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
                        console.error(`✗ SQL migration failed: ${file}`);
                        console.error(`Error: ${msg}`);
                    }
    }
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
    if (!(await tableExists('orders'))) {
        console.log('! Skipping orders.type/origin migrations because orders table is missing');
        return;
    }
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
        console.log('Migration started');

        // FIRST: Execute SQL migration files from migrations folder
        // This creates tables like feedback, list_orders, order_images, etc.
        console.log('Executing SQL migrations from /migrations folder...');
        await executeSqlMigrations();

        // SECOND: Run inline migrations for specific columns and features
        await runMigrationStep('ensureUsersTable', ensureUsersTable);
        await runMigrationStep('ensureUsersRegistrationColumns', ensureUsersRegistrationColumns);
        await runMigrationStep('ensureOrdersTable', ensureOrdersTable);

        console.log('Running column migrations...');

        await runMigrationStep('ensureOrdersStatusVarchar', ensureOrdersStatusVarchar);
        await runMigrationStep('ensureAdvanceAmountColumn', ensureAdvanceAmountColumn);
        await runMigrationStep('ensurePaymentMethodColumn', ensurePaymentMethodColumn);
        await runMigrationStep('ensureTypeOriginColumns', ensureTypeOriginColumns);

        console.log('Creating dependent tables...');
        await runMigrationStep('ensureOrderPaymentHistoryTable', ensureOrderPaymentHistoryTable);
        await runMigrationStep('ensureOrderImagesTable', ensureOrderImagesTable);

        await runMigrationStep('backfillConvertedOrigins', async () => {
            const [columns] = await promisePool.query(
                "SELECT COLUMN_NAME FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'orders' AND COLUMN_NAME = 'type'"
            );

            if (columns && columns.length > 0) {
                await promisePool.query("UPDATE orders SET origin = 'list_orders' WHERE `type` = 'list_converted' AND (origin IS NULL OR origin = '')");
                console.log('✓ backfilled origin for list_converted orders');
            }
        });

        console.log('Migration completed');
    }

    try {
        app.listen(config.port, () => {
            console.log(`✅ Server running in ${config.env} mode on port ${config.port}`);
            console.log(`📝 API available at http://localhost:${config.port}/`);
            if (isConnected) {
                console.log('✓ Database: Connected');
            } else {
                console.log('⚠️  Database: Not connected');
            }
        });
    } catch (err) {
        console.error('Server startup failed:', err && err.stack ? err.stack : err);
    }
};

module.exports = { startServer };
