const { promisePool } = require('./config/db');

async function fixBrokenReferences() {
  try {
    console.log('Clearing broken offlineOrderId references (mock IDs 9001, 9002)...');
    const [result] = await promisePool.query(`
      UPDATE list_orders 
      SET offlineOrderId = NULL
      WHERE offlineOrderId IN (9001, 9002)
    `);
    
    console.log(`✓ Cleared ${result.affectedRows} broken references`);
    console.log('\nVerifying list orders now:');
    const [listOrders] = await promisePool.query(`
      SELECT id, offlineOrderId, status FROM list_orders WHERE status = 'converted' 
    `);
    console.log(`✓ All converted list orders now have offlineOrderId = NULL`);
    
    process.exit(0);
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
}

fixBrokenReferences();
