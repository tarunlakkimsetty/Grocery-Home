const { promisePool } = require('./config/db');

async function testConversionFlow() {
  try {
    console.log('Starting conversion flow test...\n');

    // Get a real product to use
    console.log('Step 0: Getting a real product...');
    const [products] = await promisePool.query('SELECT id, name FROM products LIMIT 1');
    if (!products.length) {
      throw new Error('No products found in database');
    }
    const product = products[0];
    console.log(`✓ Using product ID: ${product.id}, name: ${product.name}`);

    // Step 1: Create a test offline order (simulating API call)
    console.log('Step 1: Creating a test offline order...');
    const [orderResult] = await promisePool.query(`
      INSERT INTO orders 
      (customerId, customerName, phone, place, address, orderType, status, paymentStatus, totalAmount, paymentMethod, type, origin)
      VALUES (NULL, 'Test Conversion', '1234567890', 'Test Place', 'Test Address', 'Offline', 'Pending', 'Unpaid', 500, 'Cash', 'list_converted', 'list_orders')
    `);
    
    const orderId = orderResult.insertId;
    console.log(`✓ Created order with ID: ${orderId}`);

    // Step 2: Add items to the order
    console.log('\nStep 2: Adding items to the order...');
    await promisePool.query(`
      INSERT INTO order_items (orderId, productId, productName, price, quantity, isSelected, total)
      VALUES (?, ?, ?, 100, 5, TRUE, 500)
    `, [orderId, product.id, product.name]);
    console.log(`✓ Added items to order ${orderId}`);

    // Step 3: Link a list order to this offline order
    console.log('\nStep 3: Linking a list order to this offline order...');
    // Use list order ID 1 which should exist
    const [updateResult] = await promisePool.query(`
      UPDATE list_orders SET offlineOrderId = ? WHERE id = 1
    `, [orderId]);
    console.log(`✓ Linked list order ID 1 to offline order ${orderId}`);

    // Step 4: Verify the link
    console.log('\nStep 4: Verifying the link...');
    const [listOrder] = await promisePool.query(`
      SELECT id, offlineOrderId, status FROM list_orders WHERE id = 1
    `);
    console.log('✓ List order data:', listOrder[0]);

    // Step 5: Fetch the linked order (simulating frontend getOrderById)
    console.log('\nStep 5: Fetching the linked offline order...');
    const [order] = await promisePool.query(`
      SELECT * FROM orders WHERE id = ?
    `, [orderId]);
    
    const [items] = await promisePool.query(`
      SELECT * FROM order_items WHERE orderId = ?
    `, [orderId]);
    
    const orderData = {
      ...order[0],
      items: items
    };
    console.log('✓ Fetched order with items:', {
      id: orderData.id,
      customerName: orderData.customerName,
      status: orderData.status,
      itemCount: orderData.items.length
    });

    console.log('\n✅ Conversion flow test completed successfully!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
}

testConversionFlow();
