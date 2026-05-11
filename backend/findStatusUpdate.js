const { promisePool } = require('./config/db');

async function findStatusUpdate() {
  try {
    console.log('=== Checking what marked order 83 as paid ===\n');
    
    const [paymentHistory] = await promisePool.query(`
      SELECT * FROM order_payment_history WHERE orderId = 83
    `);
    
    console.log('Payment history for order 83:');
    console.table(paymentHistory);

    console.log('\n=== Checking for any trigger or auto-action logic ===');
    const [tables] = await promisePool.query(`
      SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES 
      WHERE TABLE_SCHEMA = 'grocery_db' AND TABLE_NAME LIKE '%trigger%'
    `);
    console.log('Triggers found:', tables);

    console.log('\n=== Checking when order 83 was marked as paid ===');
    const [updateLog] = await promisePool.query(`
      SELECT * FROM orders WHERE id = 83
    `);
    const order = updateLog[0];
    console.log(`Order created at: ${order.createdAt}`);
    console.log(`Order updated at: ${order.updatedAt}`);
    console.log(`Order verified at: ${order.verifiedAt}`);
    console.log(`Order delivered at: ${order.deliveredAt}`);

    process.exit(0);
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
}

findStatusUpdate();
