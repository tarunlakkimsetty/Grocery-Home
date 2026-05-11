const { promisePool } = require('./config/db');

async function checkListOrder8() {
  try {
    console.log('=== Checking list order #8 ===\n');
    
    const [listOrder] = await promisePool.query(`
      SELECT * FROM list_orders WHERE id = 8
    `);
    
    console.log('List order #8:');
    console.log(JSON.stringify(listOrder[0] || {}, null, 2));

    if (listOrder[0] && listOrder[0].offlineOrderId) {
      const [order] = await promisePool.query(`
        SELECT * FROM orders WHERE id = ?
      `, [listOrder[0].offlineOrderId]);
      
      if (order[0]) {
        console.log(`\n=== Linked order ${listOrder[0].offlineOrderId} ===\n`);
        console.log(JSON.stringify(order[0], null, 2));
      } else {
        console.log(`\nLinked order ${listOrder[0].offlineOrderId} NOT FOUND in orders table`);
      }
    }

    process.exit(0);
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
}

checkListOrder8();
