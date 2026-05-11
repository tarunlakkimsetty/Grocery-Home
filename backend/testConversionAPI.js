const http = require('http');
const { promisePool } = require('./config/db');

// Test converting a list order through the actual API
async function testConversion() {
  try {
    console.log('=== Testing Full Conversion Flow ===\n');

    // Step 1: Get a real product
    console.log('Step 1: Getting a real product...');
    const [products] = await promisePool.query('SELECT id, name, price FROM products LIMIT 1');
    const product = products[0];
    console.log(`✓ Using product: ID ${product.id}, name "${product.name}", price ${product.price}`);

    // Step 2: Prepare conversion payload
    const payload = {
      customerName: 'Test Conversion Flow',
      phone: '9876543210',
      place: 'Test Location',
      address: 'Test Address',
      items: [{
        productId: product.id,
        quantity: 2,
        price: parseFloat(product.price)
      }],
      totalAmount: parseFloat(product.price) * 2,
      status: 'converted',
      paymentStatus: 'pending',
      orderType: 'Offline',
      type: 'list_converted',
      origin: 'list_orders'
    };

    console.log('\nStep 2: Conversion payload:');
    console.log(JSON.stringify(payload, null, 2));

    // Step 3: Make API call to create offline order
    console.log('\nStep 3: Calling POST /api/orders/offline...');
    
    const postData = JSON.stringify(payload);
    
    const options = {
      hostname: 'localhost',
      port: 5000,
      path: '/api/orders/offline',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const result = await new Promise((resolve, reject) => {
      const req = http.request(options, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          try {
            resolve({
              status: res.statusCode,
              data: JSON.parse(data)
            });
          } catch (e) {
            resolve({
              status: res.statusCode,
              data: data
            });
          }
        });
      });
      
      req.on('error', reject);
      req.write(postData);
      req.end();
    });

    console.log(`\nAPI Response (status ${result.status}):`);
    console.log(JSON.stringify(result.data, null, 2));

    if (result.data.order) {
      const orderId = result.data.order.id;
      console.log(`\n✓ Created order ID: ${orderId}`);

      // Step 4: Verify in DB
      console.log('\nStep 4: Verifying order in database...');
      const [dbOrder] = await promisePool.query('SELECT * FROM orders WHERE id = ?', [orderId]);
      const [dbItems] = await promisePool.query('SELECT * FROM order_items WHERE orderId = ?', [orderId]);

      console.log(`✓ DB Order status: "${dbOrder[0].status}"`);
      console.log(`✓ DB Order isPaid: ${dbOrder[0].isPaid}`);
      console.log(`✓ DB Order isVerified: ${dbOrder[0].isVerified}`);
      console.log(`✓ DB Items count: ${dbItems.length}`);
      
      if (dbItems.length > 0) {
        console.log(`✓ First item: product=${dbItems[0].productName}, qty=${dbItems[0].quantity}`);
      }

      // Step 5: Simulate what frontend does
      console.log('\nStep 5: What frontend extracts:');
      const extractedId = result.data?.order?.id || result.data?.data?.order?.id || result.data?.id;
      console.log(`✓ Extracted order ID: ${extractedId}`);

      // Step 6: Update list order
      if (extractedId) {
        console.log('\nStep 6: Updating list order with offlineOrderId...');
        const [updateResult] = await promisePool.query(
          'UPDATE list_orders SET offlineOrderId = ? WHERE id = 1',
          [extractedId]
        );
        console.log(`✓ Updated list_orders rows: ${updateResult.affectedRows}`);
      }
    }

    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
}

testConversion();
