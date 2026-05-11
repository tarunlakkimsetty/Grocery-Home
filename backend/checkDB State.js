const { promisePool } = require('./config/db');

async function checkDBState() {
  try {
    const [orders] = await promisePool.query(`
      SELECT id, status, isPaid, isVerified, isDelivered, isArchived, type, origin
      FROM orders 
      WHERE id = 83
    `);
    
    console.log('Direct DB query for order 83:');
    console.table(orders);

    process.exit(0);
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
}

checkDBState();
