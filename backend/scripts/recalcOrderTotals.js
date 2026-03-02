const { promisePool } = require('../config/db');

const run = async () => {
    try {
        console.log('Recalculating orders.totalAmount from order_items...');

        const [result] = await promisePool.query(`
            UPDATE orders o
            SET totalAmount = (
                SELECT COALESCE(SUM(oi.quantity * oi.price), 0)
                FROM order_items oi
                WHERE oi.orderId = o.id
            )
        `);

        // mysql2 returns OkPacket with affectedRows in most cases
        const affectedRows = result?.affectedRows;
        console.log(`Done. Updated rows: ${typeof affectedRows === 'number' ? affectedRows : 'unknown'}`);
        process.exit(0);
    } catch (err) {
        console.error('Failed to recalculate totals:', err?.message || err);
        process.exit(1);
    }
};

run();
