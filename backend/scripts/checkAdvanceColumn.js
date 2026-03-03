const { promisePool } = require('../config/db');

const main = async () => {
    const [rows] = await promisePool.query("SHOW COLUMNS FROM orders LIKE 'advanceAmount'");
    if (!rows || rows.length === 0) {
        console.log('MISSING: orders.advanceAmount');
        process.exit(2);
    }
    console.log('OK: orders.advanceAmount exists:', rows[0]);
    process.exit(0);
};

main().catch((err) => {
    console.error('ERROR:', err && err.message ? err.message : err);
    process.exit(1);
});
