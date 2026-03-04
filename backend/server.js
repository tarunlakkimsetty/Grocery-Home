const config = require('./config/config');
const app = require('./app');
const { testConnection, promisePool } = require('./config/db');

const ensureOrdersStatusVarchar = async () => {
    try {
        await promisePool.query(`
            ALTER TABLE orders
            MODIFY COLUMN status VARCHAR(50) DEFAULT 'Pending'
        `);
        console.log("✓ orders.status ensured as VARCHAR(50)");
    } catch (err) {
        const msg = String(err && err.message ? err.message : err);
        // Ignore cases where table doesn't exist yet or MySQL doesn't allow this operation
        if (msg.includes("doesn't exist") || msg.includes('Unknown column')) {
            return;
        }
        console.log("! Could not ensure orders.status is VARCHAR:", msg);
    }
};

const ensureAdvanceAmountColumn = async () => {
    try {
        // MySQL versions vary: some don't support ADD COLUMN IF NOT EXISTS.
        // Best-effort add; ignore if already exists.
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
        // Don’t fail server start for this; log and continue.
        console.log('! Could not ensure orders.advanceAmount column:', msg);
    }
};

const ensurePaymentMethodColumn = async () => {
    try {
        // Best-effort add; ignore if already exists.
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

// Start server after testing database connection
const startServer = async () => {
    // Test database connection
    const isConnected = await testConnection();
    
    if (!isConnected) {
        console.error('Failed to connect to database. Server not started.');
        process.exit(1);
    }

    // Best-effort: keep schema compatible with workflow statuses like 'Completed'
    await ensureOrdersStatusVarchar();

    // Best-effort: advance payment support
    await ensureAdvanceAmountColumn();

    // Best-effort: store payment method for analytics
    await ensurePaymentMethodColumn();

    // Start Express server
    app.listen(config.port, () => {
        console.log(`Server running in ${config.env} mode on port ${config.port}`);
    });
};

startServer();
