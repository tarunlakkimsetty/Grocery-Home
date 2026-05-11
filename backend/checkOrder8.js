const { promisePool } = require('./config/db');

async function checkOrder8() {
  try {
    console.log('=== Checking offline order ID 8 ===\n');
    
    const [order] = await promisePool.query(`
      SELECT * FROM orders WHERE id = 8
    `);
    
    if (!order.length) {
      console.log('Order ID 8 not found');
    } else {
      console.log('Order #8:');
      console.log(JSON.stringify(order[0], null, 2));
      
      const [items] = await promisePool.query(`
        SELECT * FROM order_items WHERE orderId = 8
      `);
      console.log('\nItems for order 8:', items.length);
    }

    // Also check if there are any orders with empty items
    console.log('\n=== Checking for converted orders with no items ===\n');
    const [ordersWithNoItems] = await promisePool.query(`
      SELECT o.id, o.customerName, o.status, COUNT(oi.id) as itemCount
      FROM orders o
      LEFT JOIN order_items oi ON o.id = oi.orderId
      WHERE o.type = 'list_converted' OR o.origin = 'list_orders'
      GROUP BY o.id
      HAVING itemCount = 0
    `);
    
    console.log('Converted orders with NO items:');
    console.table(ordersWithNoItems);

    process.exit(0);
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
}

checkOrder8();
