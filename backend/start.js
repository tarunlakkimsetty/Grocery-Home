const fs = require('fs');
const path = require('path');
const config = require('./config/config');
const app = require('./app');
const { testConnection, promisePool } = require('./config/db');
const { ensureOrderAvailabilityTable } = require('./models/orderAvailabilitySettingsModel');

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

                const isBenignMigrationError = (msg) => (
                    msg.includes('Duplicate column') ||
                    msg.includes('Duplicate key name') ||
                    msg.includes('already exists') ||
                    msg.includes('ER_TABLE_EXISTS_ERROR') ||
                    msg.includes('ER_DUP_FIELDNAME') ||
                    msg.includes('ER_DUP_KEYNAME') ||
                    msg.includes('CHECK constraint')
                );

                for (const statement of statements) {
                    try {
                        await promisePool.query(statement);
                    } catch (err) {
                        const msg = String(err && err.message ? err.message : err);
                        if (!isBenignMigrationError(msg)) {
                            throw err;
                        }
                    }
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

const ensureProductsTable = async () => {
    if (await tableExists('products')) {
        return;
    }

    console.log('Creating products table...');
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
};

const ensureSuggestedProductsTable = async () => {
    if (!(await tableExists('suggested_products'))) {
        console.log('Creating suggested_products table...');
        await promisePool.query(`
            CREATE TABLE IF NOT EXISTS suggested_products (
                id INT AUTO_INCREMENT PRIMARY KEY,
                product_id INT NOT NULL,
                created_by INT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE KEY uq_suggested_products_product (product_id),
                CONSTRAINT fk_suggested_products_product FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
                CONSTRAINT fk_suggested_products_created_by FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `);
        return;
    }

    console.log('Ensuring suggested_products table schema...');
    const [columns] = await promisePool.query('SHOW COLUMNS FROM suggested_products');
    const columnNames = new Set(columns.map((column) => column.Field));

    if (!columnNames.has('product_id')) {
        await promisePool.query('ALTER TABLE suggested_products ADD COLUMN product_id INT NOT NULL');
    }
    if (!columnNames.has('created_by')) {
        await promisePool.query('ALTER TABLE suggested_products ADD COLUMN created_by INT NOT NULL');
    }
    if (!columnNames.has('created_at')) {
        await promisePool.query('ALTER TABLE suggested_products ADD COLUMN created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP');
    }

    const [indexes] = await promisePool.query('SHOW INDEX FROM suggested_products');
    const hasUniqueProductIndex = indexes.some((index) => index.Key_name === 'uq_suggested_products_product' && index.Non_unique === 0);

    if (!hasUniqueProductIndex) {
        try {
            await promisePool.query('ALTER TABLE suggested_products ADD UNIQUE KEY uq_suggested_products_product (product_id)');
        } catch (err) {
            const msg = String(err && err.message ? err.message : err);
            if (!msg.includes('Duplicate entry')) {
                throw err;
            }
        }
    }
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

const ensureListOrdersTable = async () => {
    if (!(await tableExists('list_orders'))) {
        console.log('Creating list_orders table...');
        await promisePool.query(`
            CREATE TABLE IF NOT EXISTS list_orders (
                id INT AUTO_INCREMENT PRIMARY KEY,
                global_order_id INT UNIQUE NULL,
                customerName VARCHAR(100) NOT NULL,
                phone VARCHAR(15) NOT NULL,
                place VARCHAR(100) DEFAULT NULL,
                imagePath TEXT NOT NULL,
                imageFileName VARCHAR(255) NOT NULL,
                status ENUM('pending', 'converted') DEFAULT 'pending',
                offlineOrderId INT NULL,
                notes TEXT,
                createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                INDEX idx_phone (phone),
                INDEX idx_status (status),
                INDEX idx_createdAt (createdAt),
                INDEX idx_place (place)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `);
    }

    if (!(await tableExists('list_orders'))) {
        return;
    }

    try {
        await promisePool.query('ALTER TABLE list_orders MODIFY COLUMN id INT NOT NULL AUTO_INCREMENT');
        console.log('✓ list_orders.id ensured as AUTO_INCREMENT');
    } catch (err) {
        const msg = String(err && err.message ? err.message : err);
        if (!msg.toLowerCase().includes('duplicate') && !msg.toLowerCase().includes('auto_increment')) {
            console.log('! Could not enforce list_orders.id AUTO_INCREMENT:', msg);
        }
    }
};

const ensureListOrdersPlaceColumn = async () => {
    if (!(await tableExists('list_orders'))) {
        return;
    }

    try {
        await promisePool.query('ALTER TABLE list_orders ADD COLUMN place VARCHAR(100) DEFAULT NULL AFTER phone');
        console.log('✓ list_orders.place column ensured');
    } catch (err) {
        const msg = String(err && err.message ? err.message : err);
        if (!msg.includes('Duplicate column')) {
            console.log('! Could not ensure list_orders.place column:', msg);
        }
    }
};

const ensureListOrdersGlobalOrderIdColumn = async () => {
    if (!(await tableExists('list_orders'))) {
        return;
    }

    try {
        await promisePool.query('ALTER TABLE list_orders ADD COLUMN global_order_id INT UNIQUE NULL AFTER id');
        console.log('✓ list_orders.global_order_id column ensured');
    } catch (err) {
        const msg = String(err && err.message ? err.message : err);
        if (!msg.includes('Duplicate column')) {
            console.log('! Could not ensure list_orders.global_order_id column:', msg);
        }
    }

    try {
        await promisePool.query('UPDATE list_orders SET global_order_id = id WHERE global_order_id IS NULL');
        console.log('✓ list_orders.global_order_id backfilled from id');
    } catch (err) {
        console.warn('Could not backfill list_orders.global_order_id:', err.message || err);
    }
};

const ensureGlobalOrderAutoIncrement = async () => {
    if (!(await tableExists('orders')) || !(await tableExists('list_orders'))) {
        return;
    }

    try {
        const [rows] = await promisePool.query(
            `SELECT GREATEST(
                COALESCE((SELECT MAX(id) FROM orders), 0),
                COALESCE((SELECT MAX(global_order_id) FROM list_orders), 0)
            ) AS maxId`
        );
        const maxId = Number(rows?.[0]?.maxId || 0);
        if (maxId > 0) {
            await promisePool.query('ALTER TABLE orders AUTO_INCREMENT = ?', [maxId + 1]);
            console.log('✓ orders.auto_increment advanced to', maxId + 1);
        }
    } catch (err) {
        console.warn('Could not ensure global orders AUTO_INCREMENT:', err.message || err);
    }
};

const ensureOrderItemsTable = async () => {
    if (!(await tableExists('orders')) || !(await tableExists('products'))) {
        console.log('! Skipping order_items table because orders/products table is missing');
        return;
    }

    if (await tableExists('order_items')) {
        return;
    }

    console.log('Creating order_items table...');
    await promisePool.query(`
        CREATE TABLE IF NOT EXISTS order_items (
            id INT AUTO_INCREMENT PRIMARY KEY,
            orderId INT NOT NULL,
            productId INT NOT NULL,
            productName VARCHAR(150),
            price DECIMAL(10,2),
            quantity DECIMAL(10,3),
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
};

const ensureOrderItemsUnitColumn = async () => {
    if (!(await tableExists('order_items'))) {
        console.log('! Skipping order_items unit migration because order_items table is missing');
        return;
    }

    try {
        await promisePool.query(`
            ALTER TABLE order_items
            ADD COLUMN unit VARCHAR(50) NULL
        `);
        console.log('✓ order_items.unit ensured');
    } catch (err) {
        const msg = String(err && err.message ? err.message : err);
        if (!msg.includes('Duplicate column')) {
            console.log('! Could not ensure order_items.unit column:', msg);
        }
    }
};

const ensureOrderItemsQuantityDecimal = async () => {
    if (!(await tableExists('order_items'))) {
        console.log('! Skipping order_items quantity migration because order_items table is missing');
        return;
    }

    try {
        // Convert INT quantity column to DECIMAL(10,3) to support decimal quantities (0.1, 0.5, 1.5, etc.)
        await promisePool.query(`
            ALTER TABLE order_items 
            MODIFY COLUMN quantity DECIMAL(10,3)
        `);
        console.log('✓ order_items.quantity ensured as DECIMAL(10,3) for decimal quantity support');
    } catch (err) {
        const msg = String(err && err.message ? err.message : err);
        if (msg.includes("doesn't exist") || msg.includes('Unknown column')) {
            return;
        }
        console.log('! Could not ensure order_items.quantity is DECIMAL:', msg);
    }
};

const ensureBillItemsUnitColumn = async () => {
    if (!(await tableExists('bill_items'))) {
        console.log('! Skipping bill_items unit migration because bill_items table is missing');
        return;
    }

    try {
        await promisePool.query(`
            ALTER TABLE bill_items
            ADD COLUMN unit VARCHAR(50) NULL
        `);
        console.log('✓ bill_items.unit ensured');
    } catch (err) {
        const msg = String(err && err.message ? err.message : err);
        if (!msg.includes('Duplicate column')) {
            console.log('! Could not ensure bill_items.unit column:', msg);
        }
    }
};

const ensureBillItemsQuantityDecimal = async () => {
    if (!(await tableExists('bill_items'))) {
        console.log('! Skipping bill_items quantity migration because bill_items table is missing');
        return;
    }

    try {
        // Convert INT quantity column to DECIMAL(10,3) to support decimal quantities
        await promisePool.query(`
            ALTER TABLE bill_items 
            MODIFY COLUMN quantity DECIMAL(10,3)
        `);
        console.log('✓ bill_items.quantity ensured as DECIMAL(10,3) for decimal quantity support');
    } catch (err) {
        const msg = String(err && err.message ? err.message : err);
        if (msg.includes("doesn't exist") || msg.includes('Unknown column')) {
            return;
        }
        console.log('! Could not ensure bill_items.quantity is DECIMAL:', msg);
    }
};

const addColumnIfMissing = async (tableName, columnSql) => {
    try {
        await promisePool.query(`ALTER TABLE ${tableName} ADD COLUMN ${columnSql}`);
    } catch (err) {
        const msg = String(err && err.message ? err.message : err);
        if (!msg.includes('Duplicate column')) throw err;
    }
};

const ensureOfferColumns = async () => {
    if (await tableExists('products')) {
        await addColumnIfMissing('products', 'originalPrice DECIMAL(10,2) NULL');
        await addColumnIfMissing('products', 'discountedPrice DECIMAL(10,2) NULL');
        await addColumnIfMissing('products', 'freeItemName VARCHAR(150) NULL');
        await addColumnIfMissing('products', 'freeItemQuantity DECIMAL(10,3) NULL');
        await addColumnIfMissing('products', 'freeItemUnit VARCHAR(50) NULL');
        await addColumnIfMissing('products', 'freeItemDescription VARCHAR(255) NULL');
        await addColumnIfMissing('products', 'freeItemActive BOOLEAN NOT NULL DEFAULT FALSE');
        await promisePool.query('UPDATE products SET originalPrice = price, discountedPrice = price WHERE originalPrice IS NULL OR discountedPrice IS NULL');
    }

    if (await tableExists('order_items')) {
        for (const column of [
            'originalPrice DECIMAL(10,2) NULL',
            'discountAmount DECIMAL(10,2) NULL',
            'discountPercentage DECIMAL(6,2) NULL',
            'freeItemName VARCHAR(150) NULL',
            'freeItemQuantity DECIMAL(10,3) NULL',
            'freeItemUnit VARCHAR(50) NULL',
        ]) await addColumnIfMissing('order_items', column);
    }

    if (await tableExists('bill_items')) {
        for (const column of [
            'originalPrice DECIMAL(10,2) NULL',
            'discountAmount DECIMAL(10,2) NULL',
            'discountPercentage DECIMAL(6,2) NULL',
            'freeItemName VARCHAR(150) NULL',
            'freeItemQuantity DECIMAL(10,3) NULL',
            'freeItemUnit VARCHAR(50) NULL',
        ]) await addColumnIfMissing('bill_items', column);
    }
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
        console.log('! Could not ensure order_payment_history table:', msg);
    }
};

const ensureOrderImagesTable = async () => {
    if (!(await tableExists('users'))) {
        console.log('! Skipping order_images table because users table is missing');
        return;
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

const ensureAnnouncementsTable = async () => {
    try {
        await promisePool.query(`
            CREATE TABLE IF NOT EXISTS announcements (
                id INT AUTO_INCREMENT PRIMARY KEY,
                title VARCHAR(160) NOT NULL,
                message TEXT NOT NULL,
                image VARCHAR(255) NULL,
                startDate DATETIME NOT NULL,
                expiryDate DATETIME NOT NULL,
                status ENUM('Active', 'Inactive') NOT NULL DEFAULT 'Inactive',
                actionText VARCHAR(80) NULL,
                actionLink VARCHAR(255) NULL,
                createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                INDEX idx_announcements_status (status),
                INDEX idx_announcements_dates (startDate, expiryDate)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `);
        console.log('✓ announcements table ensured');
    } catch (err) {
        const msg = String(err && err.message ? err.message : err);
        console.log('! Could not ensure announcements table:', msg);
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
        await runMigrationStep('ensureUsersTable', ensureUsersTable);
        await runMigrationStep('ensureProductsTable', ensureProductsTable);
        await runMigrationStep('ensureSuggestedProductsTable', ensureSuggestedProductsTable);
        await runMigrationStep('ensureOrdersTable', ensureOrdersTable);
        await runMigrationStep('ensureOrderItemsTable', ensureOrderItemsTable);
        await runMigrationStep('ensureListOrdersTable', ensureListOrdersTable);
        await runMigrationStep('ensureListOrdersPlaceColumn', ensureListOrdersPlaceColumn);
        await runMigrationStep('ensureListOrdersGlobalOrderIdColumn', ensureListOrdersGlobalOrderIdColumn);
        await runMigrationStep('ensureGlobalOrderAutoIncrement', ensureGlobalOrderAutoIncrement);
        await executeSqlMigrations();

        // SECOND: Run inline migrations for specific columns and features
        await runMigrationStep('ensureUsersRegistrationColumns', ensureUsersRegistrationColumns);

        console.log('Running column migrations...');

        await runMigrationStep('ensureOrdersStatusVarchar', ensureOrdersStatusVarchar);
        await runMigrationStep('ensureAdvanceAmountColumn', ensureAdvanceAmountColumn);
        await runMigrationStep('ensurePaymentMethodColumn', ensurePaymentMethodColumn);
        await runMigrationStep('ensureTypeOriginColumns', ensureTypeOriginColumns);
        await runMigrationStep('ensureOrderItemsUnitColumn', ensureOrderItemsUnitColumn);
        await runMigrationStep('ensureOrderItemsQuantityDecimal', ensureOrderItemsQuantityDecimal);
        await runMigrationStep('ensureBillItemsUnitColumn', ensureBillItemsUnitColumn);
        await runMigrationStep('ensureBillItemsQuantityDecimal', ensureBillItemsQuantityDecimal);
        await runMigrationStep('ensureOfferColumns', ensureOfferColumns);

        console.log('Creating dependent tables...');
        await runMigrationStep('ensureOrderPaymentHistoryTable', ensureOrderPaymentHistoryTable);
        await runMigrationStep('ensureOrderImagesTable', ensureOrderImagesTable);
        await runMigrationStep('ensureAnnouncementsTable', ensureAnnouncementsTable);
        await runMigrationStep('ensureOrderAvailabilityTable', ensureOrderAvailabilityTable);

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

if (require.main === module) {
    startServer();
}
