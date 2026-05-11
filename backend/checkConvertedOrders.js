const { promisePool } = require('./config/db');

async function checkOrders() {
  try {
    console.log('=== Real converted orders in database ===');
    const [realOrders] = await promisePool.query(`
      SELECT id, customerName, status, origin, type FROM orders WHERE type = 'list_converted' OR origin = 'list_orders' ORDER BY id DESC
    `);
    console.table(realOrders);

    console.log('\n=== List orders with broken/missing offlineOrderIds ===');
    const [listOrders] = await promisePool.query(`
      SELECT id, offlineOrderId, status FROM list_orders WHERE status = 'converted' ORDER BY id DESC
    `);
    console.table(listOrders);

    process.exit(0);
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
}

checkOrders();
