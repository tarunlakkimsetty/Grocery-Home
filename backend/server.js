const config = require('./config/config');
const app = require('./app');
const { testConnection, promisePool } = require('./config/db');

const ensureRejectedStatusEnum = async () => {
    try {
        await promisePool.query(`
            ALTER TABLE orders
            MODIFY COLUMN status ENUM('Pending','Verified','Paid','Delivered','Rejected')
            DEFAULT 'Pending'
        `);
        console.log("✓ orders.status ensured to include 'Rejected'");
    } catch (err) {
        const msg = String(err && err.message ? err.message : err);
        // Ignore cases where table doesn't exist yet or MySQL doesn't allow this operation
        if (msg.includes("doesn't exist") || msg.includes('Unknown column')) {
            return;
        }
        console.log("! Could not ensure orders.status includes 'Rejected':", msg);
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

    // Best-effort: keep schema compatible with status 'Rejected'
    await ensureRejectedStatusEnum();

    // Start Express server
    app.listen(config.port, () => {
        console.log(`Server running in ${config.env} mode on port ${config.port}`);
    });
};

startServer();
