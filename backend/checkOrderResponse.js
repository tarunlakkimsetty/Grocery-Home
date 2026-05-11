const { promisePool } = require('./config/db');
const Order = require('./models/orderModel');

async function checkOrderResponse() {
  try {
    console.log('=== Checking what order model returns for order 83 ===\n');
    
    const order = await Order.findById(83);
    
    console.log('Order returned by Order.findById(83):');
    console.log(JSON.stringify(order, null, 2));

    console.log('\n=== Checking isEditableOrder logic ===');
    const getNormalizedStatus = (status) => String(status || '').trim().toLowerCase();
    const status = getNormalizedStatus(order?.status);
    const type = getNormalizedStatus(order?.type);
    
    console.log(`- status normalized: "${status}"`);
    console.log(`- type normalized: "${type}"`);
    console.log(`- status === 'pending': ${status === 'pending'}`);
    console.log(`- status === 'converted': ${status === 'converted'}`);
    console.log(`- type === 'list_converted': ${type === 'list_converted'}`);
    
    const isEditable = status === 'pending' || status === 'converted' || type === 'list_converted';
    console.log(`- isEditableOrder result: ${isEditable}`);
    
    console.log('\n=== Checking what makes it show as locked/completed ===');
    console.log(`- order.isPaid: ${order?.isPaid}`);
    console.log(`- order.status: "${order?.status}"`);
    const statusLower = getNormalizedStatus(order?.status);
    console.log(`- status includes "completed": ${statusLower.includes('completed')}`);

    process.exit(0);
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
}

checkOrderResponse();
