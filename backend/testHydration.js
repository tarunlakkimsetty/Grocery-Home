const { promisePool } = require('./config/db');
const Product = require('./models/productModel');

const hydrateOrderItems = async (items) => {
    const safeItems = Array.isArray(items) ? items : [];
    const productIds = Array.from(new Set(
        safeItems
            .map((item) => Number(item?.productId ?? item?.product_id ?? item?.id ?? 0))
            .filter((id) => Number.isInteger(id) && id > 0)
    ));

    const productNameMap = new Map();
    await Promise.all(
        productIds.map(async (productId) => {
            try {
                const product = await Product.findById(productId);
                if (product?.name) {
                    productNameMap.set(productId, product.name);
                }
            } catch {
                // Best-effort name hydration only.
            }
        })
    );

    return safeItems.map((item) => {
        const productId = Number(item?.productId ?? item?.product_id ?? item?.id ?? 0) || null;
        const productName = item?.productName || item?.name || (productId ? productNameMap.get(productId) : null) || '';

        return {
            ...item,
            productId,
            productName,
            name: item?.name || item?.productName || productName,
        };
    });
};

async function testOrderFetchWithHydration() {
  try {
    console.log('Testing order fetch with product name hydration...\n');

    // Fetch an order that was just created (order ID 82)
    console.log('Step 1: Fetching order 82 with items...');
    const [order] = await promisePool.query('SELECT * FROM orders WHERE id = 82');
    if (!order.length) {
      throw new Error('Order 82 not found');
    }
    
    const [items] = await promisePool.query('SELECT * FROM order_items WHERE orderId = 82');
    console.log(`✓ Found order with ${items.length} items`);
    console.log('Items before hydration:', items.map(i => ({ 
      productId: i.productId, 
      productName: i.productName, 
      name: i.name 
    })));

    // Apply hydration
    console.log('\nStep 2: Hydrating items with product names...');
    const hydratedItems = await hydrateOrderItems(items);
    console.log(`✓ Items after hydration:`, hydratedItems.map(i => ({ 
      productId: i.productId, 
      productName: i.productName, 
      name: i.name 
    })));

    const allNamesFilled = hydratedItems.every(item => item.name && item.name.trim());
    if (allNamesFilled) {
      console.log('\n✅ SUCCESS: All items have product names!');
    } else {
      console.log('\n❌ ISSUE: Some items still missing names');
    }

    process.exit(allNamesFilled ? 0 : 1);
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
}

testOrderFetchWithHydration();
