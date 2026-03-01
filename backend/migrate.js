const { promisePool } = require('./config/db');

const runMigration = async () => {
    try {
        console.log('Running database migrations...');

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
                FOREIGN KEY (productId) REFERENCES products(id)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `);
        console.log('✓ bill_items table created');

        // Extend orders.status enum to include 'Rejected'
        // (safe to run multiple times; will fail if already extended depending on MySQL version)
        try {
            await promisePool.query(`
                ALTER TABLE orders
                MODIFY COLUMN status ENUM('Pending','Verified','Paid','Delivered','Rejected')
                DEFAULT 'Pending'
            `);
            console.log("✓ orders.status updated to include 'Rejected'");
        } catch (err) {
            // If enum already includes Rejected or table doesn't exist yet, ignore safely
            const msg = String(err && err.message ? err.message : err);
            if (
                msg.includes('Duplicate') ||
                msg.includes('doesn\'t exist') ||
                msg.includes('Unknown column')
            ) {
                console.log("✓ orders.status already compatible (or orders table missing)");
            } else {
                // Older MySQL versions provide generic errors; try best-effort detection
                console.log("! Could not update orders.status enum automatically:", msg);
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
