const { promisePool } = require('./config/db');

(async () => {
    try {
        // Get all products with their current stock
        const [products] = await promisePool.query(
            `SELECT id, name, category, price, stock, unit, emoji FROM products ORDER BY category, name`
        );

        // Get sales data per product
        const [sales] = await promisePool.query(`
            SELECT 
                oi.productId,
                COALESCE(SUM(oi.quantity), 0) as quantitySold,
                COALESCE(SUM(oi.total), 0) as totalRevenue
            FROM order_items oi
            INNER JOIN orders o ON o.id = oi.orderId
            WHERE (o.status = 'Completed' OR o.paymentStatus = 'Paid' OR o.isPaid = TRUE)
            GROUP BY oi.productId
        `);

        const salesMap = new Map(sales.map(s => [s.productId, { quantitySold: s.quantitySold, totalRevenue: s.totalRevenue }]));

        console.log('\n╔════════════════════════════════════════════════════════════════════════════════════════════════════════╗');
        console.log('║                    COMPREHENSIVE PRODUCT ANALYTICS WITH STOCK & SALES DATA                           ║');
        console.log('╚════════════════════════════════════════════════════════════════════════════════════════════════════════╝\n');

        let currentCategory = '';
        let totalAllStock = 0;
        let totalAllSales = 0;

        products.forEach(product => {
            if (currentCategory !== product.category) {
                if (currentCategory !== '') console.log('');
                currentCategory = product.category;
                console.log(`\n📦 ${currentCategory.toUpperCase()}`);
                console.log('─'.repeat(100));
            }

            const sales_data = salesMap.get(product.id) || { quantitySold: 0, totalRevenue: 0 };
            const stock = Number(product.stock || 0);
            const price = Number(product.price || 0);
            const quantitySold = Number(sales_data.quantitySold || 0);
            const totalRevenue = Number(sales_data.totalRevenue || 0);
            
            totalAllStock += stock;
            totalAllSales += totalRevenue;

            const emoji = product.emoji || '📦';
            console.log(`${emoji} ${product.name.padEnd(40)} │ Stock: ${String(stock).padStart(3)} ${product.unit.padEnd(8)} │ Sold: ${String(quantitySold).padStart(3)} │ Revenue: ₹${String(totalRevenue.toFixed(0)).padStart(7)} │ Price: ₹${price.toFixed(2)}`);
        });

        console.log('\n' + '═'.repeat(100));
        console.log(`TOTALS: ${products.length} Products │ Total Stock: ${totalAllStock} units │ Total Sales Revenue: ₹${totalAllSales.toFixed(2)}`);
        console.log('═'.repeat(100) + '\n');

        process.exit(0);
    } catch (error) {
        console.error('Error:', error.message);
        process.exit(1);
    }
})();
