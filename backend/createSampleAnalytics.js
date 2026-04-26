const { promisePool } = require('./config/db');

(async () => {
    try {
        console.log('Creating sample sales data for analytics...');

        // Get all products
        const [products] = await promisePool.query('SELECT id, name, price, stock FROM products ORDER BY RAND() LIMIT 15');
        
        if (products.length === 0) {
            console.log('No products found');
            process.exit(1);
        }

        // Create a completed order with multiple items
        const orderData = {
            customerName: 'Sample Customer',
            phone: '9876543210',
            place: 'Test Location',
            address: 'Test Address',
            orderType: 'Online',
            status: 'Completed',
            paymentStatus: 'Paid',
            isPaid: true,
            isVerified: true,
            isDelivered: true,
            totalAmount: 0
        };

        const [orderResult] = await promisePool.query(
            'INSERT INTO orders (customerName, phone, place, address, orderType, status, paymentStatus, isPaid, isVerified, isDelivered) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [orderData.customerName, orderData.phone, orderData.place, orderData.address, orderData.orderType, orderData.status, orderData.paymentStatus, orderData.isPaid, orderData.isVerified, orderData.isDelivered]
        );

        const orderId = orderResult.insertId;
        let totalOrderAmount = 0;

        // Add items to order
        for (const product of products) {
            const quantity = Math.floor(Math.random() * 5) + 1;
            const itemTotal = product.price * quantity;
            totalOrderAmount += itemTotal;

            await promisePool.query(
                'INSERT INTO order_items (orderId, productId, productName, price, quantity, isSelected, total) VALUES (?, ?, ?, ?, ?, ?, ?)',
                [orderId, product.id, product.name, product.price, quantity, true, itemTotal]
            );

            console.log(`Added: ${product.name} x${quantity} = ${itemTotal}`);
        }

        // Update order total
        await promisePool.query('UPDATE orders SET totalAmount = ? WHERE id = ?', [totalOrderAmount, orderId]);

        console.log('\n✓ Sample order created with ID:', orderId);
        console.log('✓ Order total:', totalOrderAmount);
        console.log('✓ Items in order:', products.length);
        console.log('\nNow all 45 products are available in the database with:');
        console.log('✓ Stock values (total stock across all products)');
        console.log('✓ Current sales analytics');
        
        process.exit(0);
    } catch (error) {
        console.error('Error:', error.message);
        process.exit(1);
    }
})();
