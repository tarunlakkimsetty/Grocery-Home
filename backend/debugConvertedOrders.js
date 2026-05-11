const { promisePool } = require('./config/db');

async function debugConvertedOrders() {
  try {
    console.log('=== Checking existing converted orders in DB ===\n');
    
    const [convertedOrders] = await promisePool.query(`
      SELECT id, customerName, status, paymentStatus, type, origin, isPaid, isVerified, isDelivered, isArchived
      FROM orders 
      WHERE type = 'list_converted' OR origin = 'list_orders'
      ORDER BY id DESC
      LIMIT 5
    `);
    
    console.log('Converted orders in DB:');
    console.table(convertedOrders);

    if (convertedOrders.length > 0) {
      const orderId = convertedOrders[0].id;
      console.log(`\n=== Fetching full details for order ${orderId} ===\n`);
      
      const [orderDetail] = await promisePool.query(`
        SELECT * FROM orders WHERE id = ?
      `, [orderId]);
      
      const [items] = await promisePool.query(`
        SELECT * FROM order_items WHERE orderId = ?
      `, [orderId]);
      
      console.log('Order detail:');
      console.log(JSON.stringify(orderDetail[0], null, 2));
      
      console.log('\nOrder items count:', items.length);
      if (items.length > 0) {
        console.log('First item:');
        console.log(JSON.stringify(items[0], null, 2));
      }
    }

    console.log('\n=== Checking what fields are considered "locked" ===');
    console.log('isLocked logic checks for:');
    console.log('- isPaid = true');
    console.log('- paymentStatus = "Paid"');
    console.log('- status = "Paid" or "Completed"');
    
    process.exit(0);
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
}

debugConvertedOrders();
