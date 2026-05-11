// Test script to check if API returns converted list orders with items
const axios = require('axios');

const API_BASE_URL = 'http://localhost:5000/api';

async function test() {
  try {
    // Note: This will fail without auth token, but shows the API structure
    console.log('Testing List Order Bills API...\n');
    
    // 1. Check converted orders with view=bills
    console.log('1. Fetching converted orders with view=bills and type=list_converted:');
    try {
      const res1 = await axios.get(`${API_BASE_URL}/orders/admin`, {
        params: {
          type: 'list_converted',
          view: 'bills'
        }
      });
      console.log(`   Found ${res1.data.orders?.length || 0} orders`);
      if (res1.data.orders?.length > 0) {
        const sample = res1.data.orders[0];
        console.log(`   Sample: ID=${sample.id}, Customer=${sample.customerName}, Status=${sample.status}`);
        console.log(`   Items count: ${sample.items?.length || 0}`);
        if (sample.items?.length > 0) {
          console.log(`   First item: ${sample.items[0].productName || 'N/A'}, Qty=${sample.items[0].quantity}`);
        }
      }
    } catch(e) {
      console.log(`   Error: ${e.response?.status || e.message}`);
    }

    // 2. Check origin=list_orders with view=bills
    console.log('\n2. Fetching with origin=list_orders, view=bills:');
    try {
      const res2 = await axios.get(`${API_BASE_URL}/orders/admin`, {
        params: {
          origin: 'list_orders',
          view: 'bills'
        }
      });
      console.log(`   Found ${res2.data.orders?.length || 0} orders`);
    } catch(e) {
      console.log(`   Error: ${e.response?.status || e.message}`);
    }

    // 3. Test fetching individual order with items
    console.log('\n3. Testing single order fetch (using mock ID 1):');
    try {
      const res3 = await axios.get(`${API_BASE_URL}/orders/1`);
      const order = res3.data.order;
      console.log(`   Order ID: ${order.id}`);
      console.log(`   Items: ${order.items?.length || 0}`);
      if (order.items?.length > 0) {
        console.log(`   Sample item:`, {
          productName: order.items[0].productName,
          quantity: order.items[0].quantity,
          price: order.items[0].price
        });
      }
    } catch(e) {
      console.log(`   Error: ${e.response?.status || e.message}`);
    }

    console.log('\nNote: Test requires auth token. Check browser console for actual calls.');
    
  } catch(e) {
    console.error('Test error:', e.message);
  }
}

test();
