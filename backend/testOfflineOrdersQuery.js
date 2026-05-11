const { promisePool } = require('./config/db');

(async () => {
  try {
    // Simulate what findOfflineByPhone does
    const phone = '7095317735';
    const cleanedPhone = String(phone || '').replace(/\D/g, '');
    
    console.log('=== TESTING findOfflineByPhone QUERY ===');
    console.log('Phone:', phone);
    console.log('Cleaned Phone:', cleanedPhone);
    
    const [orders] = await promisePool.query(
      `
      SELECT *
      FROM orders
      WHERE orderType = 'Offline'
        AND phone IS NOT NULL
        AND phone <> ''
        AND phone = ?
        AND (type IS NULL OR type != 'list_converted')
      ORDER BY COALESCE(createdAt, orderDate, updatedAt) DESC
      `,
      [cleanedPhone]
    );
    
    console.log('\n=== ORDERS RETURNED BY findOfflineByPhone ===');
    console.log(JSON.stringify(orders, null, 2));
    console.log(`Total: ${orders.length} orders`);
    
    // Now test without the filter to see what's excluded
    const [allOffline] = await promisePool.query(
      `
      SELECT id, phone, type, origin, status
      FROM orders
      WHERE orderType = 'Offline'
        AND phone = ?
      ORDER BY id
      `,
      [cleanedPhone]
    );
    
    console.log('\n=== ALL OFFLINE ORDERS FOR THIS PHONE (BEFORE FILTER) ===');
    console.log(JSON.stringify(allOffline, null, 2));
    console.log(`Total: ${allOffline.length} orders`);
    
    process.exit(0);
  } catch (err) {
    console.error('Error:', err.message);
    console.error(err);
    process.exit(1);
  }
})();
