const { promisePool } = require('./config/db');

(async () => {
  try {
    // Check all offline orders for this phone (including converted)
    const [allOrders] = await promisePool.query(
      `
      SELECT id, phone, type, origin, status
      FROM orders
      WHERE phone = '7095317735' AND orderType = 'Offline'
      ORDER BY id
      `
    );
    
    console.log('=== ALL OFFLINE ORDERS FOR PHONE 7095317735 ===');
    for (const order of allOrders) {
      const isConverted = order.type === 'list_converted';
      console.log(`ID: ${order.id}, Status: ${order.status}, Type: ${order.type}, Origin: ${order.origin}, IsConverted: ${isConverted}`);
    }
    
    const converted = allOrders.filter(o => o.type === 'list_converted');
    const notConverted = allOrders.filter(o => !o.type || o.type !== 'list_converted');
    
    console.log(`\nTotal: ${allOrders.length}`);
    console.log(`Converted (should be EXCLUDED): ${converted.length}`, converted.map(o => o.id));
    console.log(`Not Converted (should be INCLUDED): ${notConverted.length}`, notConverted.map(o => o.id));
    
    process.exit(0);
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
})();
