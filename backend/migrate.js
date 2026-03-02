const { promisePool } = require('./config/db');

const ensureCascadeFk = async ({ tableName, columnName, referencedTable, referencedColumn }) => {
    // Best-effort: if FK exists but isn't CASCADE, replace it.
    try {
        const [tables] = await promisePool.query(
            `SELECT 1 FROM information_schema.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? LIMIT 1`,
            [tableName]
        );
        if (tables.length === 0) {
            return;
        }

        const [rows] = await promisePool.query(
            `
            SELECT rc.CONSTRAINT_NAME AS constraintName, rc.DELETE_RULE AS deleteRule
            FROM information_schema.REFERENTIAL_CONSTRAINTS rc
            JOIN information_schema.KEY_COLUMN_USAGE kcu
              ON rc.CONSTRAINT_SCHEMA = kcu.CONSTRAINT_SCHEMA
             AND rc.CONSTRAINT_NAME = kcu.CONSTRAINT_NAME
            WHERE kcu.TABLE_SCHEMA = DATABASE()
              AND kcu.TABLE_NAME = ?
              AND kcu.COLUMN_NAME = ?
              AND kcu.REFERENCED_TABLE_NAME = ?
            LIMIT 1
            `,
            [tableName, columnName, referencedTable]
        );

        if (rows.length === 0) {
            return;
        }

        const { constraintName, deleteRule } = rows[0];
        if (String(deleteRule).toUpperCase() === 'CASCADE') {
            return;
        }

        await promisePool.query(`ALTER TABLE \`${tableName}\` DROP FOREIGN KEY \`${constraintName}\``);

        const newConstraintName = `fk_${tableName}_${columnName}_cascade`;
        try {
            await promisePool.query(
                `ALTER TABLE \`${tableName}\` ADD CONSTRAINT \`${newConstraintName}\` FOREIGN KEY (\`${columnName}\`) REFERENCES \`${referencedTable}\`(\`${referencedColumn}\`) ON DELETE CASCADE`
            );
        } catch (e) {
            // If constraint name collides, retry with a different name.
            const fallbackName = `fk_${tableName}_${columnName}_cascade_2`;
            await promisePool.query(
                `ALTER TABLE \`${tableName}\` ADD CONSTRAINT \`${fallbackName}\` FOREIGN KEY (\`${columnName}\`) REFERENCES \`${referencedTable}\`(\`${referencedColumn}\`) ON DELETE CASCADE`
            );
        }

        console.log(`✓ ${tableName}.${columnName} foreign key updated to ON DELETE CASCADE`);
    } catch (err) {
        const msg = String(err && err.message ? err.message : err);
        console.log(`! Could not ensure CASCADE FK for ${tableName}.${columnName}:`, msg);
    }
};

const runMigration = async () => {
    try {
        console.log('Running database migrations...');

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
                    console.log(`✓ ${tableName} table missing (skipping ${columnNameForLogs})`);
                    return;
                }
                console.log(`! Could not add ${tableName}.${columnNameForLogs} column:`, msg);
            }
        };

        // Add unit and emoji columns to products table if they don't exist
        try {
            await promisePool.query(`
                ALTER TABLE products 
                ADD COLUMN IF NOT EXISTS unit VARCHAR(50) DEFAULT 'pack',
                ADD COLUMN IF NOT EXISTS emoji VARCHAR(10) DEFAULT '📦'
            `);
            console.log('✓ products table updated with unit and emoji columns');
        } catch (err) {
            // Columns might already exist or MySQL version doesn't support IF NOT EXISTS
            if (!err.message.includes('Duplicate column')) {
                // Try adding columns individually
                try {
                    await promisePool.query(`ALTER TABLE products ADD COLUMN unit VARCHAR(50) DEFAULT 'pack'`);
                    console.log('✓ unit column added to products');
                } catch (e) {
                    if (e.message.includes('Duplicate column')) {
                        console.log('✓ unit column already exists');
                    }
                }
                try {
                    await promisePool.query(`ALTER TABLE products ADD COLUMN emoji VARCHAR(10) DEFAULT '📦'`);
                    console.log('✓ emoji column added to products');
                } catch (e) {
                    if (e.message.includes('Duplicate column')) {
                        console.log('✓ emoji column already exists');
                    }
                }
            }
        }

        // Create bills table
        await promisePool.query(`
            CREATE TABLE IF NOT EXISTS bills (
                id INT AUTO_INCREMENT PRIMARY KEY,
                userId INT NOT NULL,
                grandTotal DECIMAL(12,2) NOT NULL,
                paymentMethod ENUM('Cash', 'Card', 'UPI', 'Other') DEFAULT 'Cash',
                createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `);
        console.log('✓ bills table created');

        // Create bill_items table
        await promisePool.query(`
            CREATE TABLE IF NOT EXISTS bill_items (
                id INT AUTO_INCREMENT PRIMARY KEY,
                billId INT NOT NULL,
                productId INT NOT NULL,
                productName VARCHAR(150),
                price DECIMAL(10,2),
                quantity INT,
                total DECIMAL(12,2),
                FOREIGN KEY (billId) REFERENCES bills(id) ON DELETE CASCADE,
                FOREIGN KEY (productId) REFERENCES products(id) ON DELETE CASCADE
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `);
        console.log('✓ bill_items table created');

        // Ensure product foreign keys cascade deletes (prevents 500 on DELETE /api/products/:id)
        await ensureCascadeFk({
            tableName: 'order_items',
            columnName: 'productId',
            referencedTable: 'products',
            referencedColumn: 'id'
        });
        await ensureCascadeFk({
            tableName: 'bill_items',
            columnName: 'productId',
            referencedTable: 'products',
            referencedColumn: 'id'
        });

        // Ensure orders.status is VARCHAR(50) (allows dynamic workflow values like 'Completed')
        try {
            await promisePool.query(`
                ALTER TABLE orders
                MODIFY COLUMN status VARCHAR(50) DEFAULT 'Pending'
            `);
            console.log("✓ orders.status set to VARCHAR(50)");
        } catch (err) {
            const msg = String(err && err.message ? err.message : err);
            if (msg.includes("doesn't exist") || msg.includes('Unknown column')) {
                console.log('✓ orders table missing (skipping status type update)');
            } else {
                console.log('! Could not update orders.status type:', msg);
            }
        }

        // Add verification workflow columns
        // Note: MySQL versions vary on ADD COLUMN IF NOT EXISTS, so do per-column best-effort.
        await addColumnBestEffort('orders', 'isVerified BOOLEAN DEFAULT FALSE', 'isVerified');
        await addColumnBestEffort('orders', 'isPaid BOOLEAN DEFAULT FALSE', 'isPaid');
        await addColumnBestEffort('orders', 'isDelivered BOOLEAN DEFAULT FALSE', 'isDelivered');
        await addColumnBestEffort('orders', 'isArchived BOOLEAN DEFAULT FALSE', 'isArchived');

        // Ensure orders.totalAmount exists (older DBs may be missing it)
        await addColumnBestEffort('orders', 'totalAmount DECIMAL(12,2) DEFAULT 0.00', 'totalAmount');

        // Backfill boolean flags for existing data (best-effort)
        try {
            await promisePool.query(`
                UPDATE orders
                SET
                    isVerified = CASE WHEN status IN ('Verified','Paid','Delivered','Completed') THEN TRUE ELSE FALSE END,
                    isPaid = CASE WHEN paymentStatus = 'Paid' OR status IN ('Paid','Completed') THEN TRUE ELSE FALSE END,
                    isDelivered = CASE WHEN status IN ('Delivered','Completed') THEN TRUE ELSE FALSE END
            `);
            // If both done, normalize status to Completed
            await promisePool.query(`
                UPDATE orders
                SET status = 'Completed'
                WHERE isPaid = TRUE AND isDelivered = TRUE AND status <> 'Rejected'
            `);
            console.log('✓ orders workflow flags backfilled');
        } catch (err) {
            const msg = String(err && err.message ? err.message : err);
            if (msg.includes("doesn't exist") || msg.includes('Unknown column')) {
                console.log('✓ orders table/columns missing (skipping backfill)');
            } else {
                console.log('! Could not backfill orders workflow flags:', msg);
            }
        }

        // Backfill totalAmount from order_items for existing rows (best-effort)
        // This fixes Orders/Bills UI showing ₹0.00 when items exist.
        try {
            await promisePool.query(`
                UPDATE orders o
                SET totalAmount = (
                    SELECT COALESCE(SUM(oi.quantity * oi.price), 0)
                    FROM order_items oi
                    WHERE oi.orderId = o.id
                )
            `);
            console.log('✓ orders.totalAmount backfilled from order_items');
        } catch (err) {
            const msg = String(err && err.message ? err.message : err);
            if (msg.includes("doesn't exist") || msg.includes('Unknown column')) {
                console.log('✓ orders/order_items missing (skipping totalAmount backfill)');
            } else {
                console.log('! Could not backfill orders.totalAmount:', msg);
            }
        }

        // Ensure orders.updatedAt exists (used for bills ordering)
        try {
            await promisePool.query(
                `ALTER TABLE orders ADD COLUMN updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP`
            );
            console.log('✓ orders.updatedAt column added');
        } catch (err) {
            const msg = String(err && err.message ? err.message : err);
            if (msg.includes('Duplicate column')) {
                console.log('✓ orders.updatedAt already exists');
            } else {
                console.log('! Could not add orders.updatedAt column:', msg);
            }
        }

        console.log('Migration completed successfully!');
        process.exit(0);
    } catch (error) {
        console.error('Migration failed:', error.message);
        process.exit(1);
    }
};

runMigration();
