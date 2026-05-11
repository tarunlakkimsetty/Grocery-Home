const { promisePool } = require('./config/db');

async function fixBrokenListOrders() {
  try {
    console.log('=== Fixing Broken List Orders (converted but no offlineOrderId) ===\n');

    // Find all list orders with status='converted' but offlineOrderId IS NULL
    const [brokenOrders] = await promisePool.query(`
      SELECT id, customerName FROM list_orders 
      WHERE status = 'converted' AND (offlineOrderId IS NULL OR offlineOrderId = 0)
    `);

    console.log(`Found ${brokenOrders.length} broken converted list orders with no offlineOrderId\n`);
    console.log('Broken orders:');
    console.table(brokenOrders);

    if (brokenOrders.length > 0) {
      console.log('\n=== Option 1: Reset to "pending" status ===');
      const [resetResult] = await promisePool.query(`
        UPDATE list_orders 
        SET status = 'pending'
        WHERE status = 'converted' AND (offlineOrderId IS NULL OR offlineOrderId = 0)
      `);
      console.log(`✓ Reset ${resetResult.affectedRows} list orders back to "pending"`);

      // Verify
      const [afterReset] = await promisePool.query(`
        SELECT id, status, offlineOrderId FROM list_orders 
        WHERE id IN (${brokenOrders.map(o => o.id).join(',')})
      `);
      console.log('\nAfter reset:');
      console.table(afterReset);
    }

    console.log('\n=== Summary ===');
    const [summary] = await promisePool.query(`
      SELECT 
        status,
        COUNT(*) as count
      FROM list_orders
      WHERE status IN ('pending', 'converted')
      GROUP BY status
    `);
    console.log('List orders by status:');
    console.table(summary);

    process.exit(0);
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
}

fixBrokenListOrders();
