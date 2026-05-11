const { promisePool } = require('./config/db');

(async () => {
  try {
    // Check orders 83, 88, 91
    const [orders] = await promisePool.query(
      'SELECT id, customerId, customerName, phone, orderType, type, origin, status, createdAt, updatedAt FROM orders WHERE id IN (83, 88, 91) ORDER BY id'
    );
    
    console.log('=== ORDERS 83, 88, 91 ===');
    console.log(JSON.stringify(orders, null, 2));
    
    // Check if these are linked to list_orders
    const [listOrderLinks] = await promisePool.query(
      'SELECT id, status, offlineOrderId FROM list_orders WHERE offlineOrderId IN (83, 88, 91) ORDER BY offlineOrderId'
    );
    
    console.log('\n=== LIST_ORDERS LINKING TO THESE ORDERS ===');
    console.log(JSON.stringify(listOrderLinks, null, 2));
    
    process.exit(0);
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
})();
