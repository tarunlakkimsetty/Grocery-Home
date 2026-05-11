const { promisePool } = require('./config/db');

async function checkRemainingConverted() {
  try {
    const [converted] = await promisePool.query(`
      SELECT * FROM list_orders WHERE status = 'converted'
    `);

    console.log('Remaining converted list orders:');
    console.table(converted);

    if (converted[0] && converted[0].offlineOrderId) {
      const [linkedOrder] = await promisePool.query(`
        SELECT id, status, isPaid, isVerified, isDelivered FROM orders WHERE id = ?
      `, [converted[0].offlineOrderId]);

      console.log(`\nLinked offline order ${converted[0].offlineOrderId}:`);
      console.table(linkedOrder);
    }

    process.exit(0);
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
}

checkRemainingConverted();
