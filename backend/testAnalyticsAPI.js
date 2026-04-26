const { promisePool } = require('./config/db');
const Analytics = require('./models/analyticsModel');

(async () => {
    try {
        console.log('Testing Analytics API with all products...\n');
        
        const analytics = await Analytics.getDashboardAnalytics();
        
        console.log('✓ Analytics data retrieved');
        console.log('\nTotals:', analytics.totals);
        console.log('\nTop Selling Products:', analytics.topSellingProducts.length, 'products');
        console.log('\nCategory Analytics:', analytics.categoryAnalytics.length, 'categories');
        console.log('\nPayment Methods:', analytics.paymentMethods.length, 'methods');
        console.log('\nLow Stock Products:', analytics.lowStockProducts.length, 'products');
        console.log('\n✓ All Products:', analytics.allProducts.length, 'products\n');
        
        if (analytics.allProducts.length > 0) {
            console.log('Sample All Products Data:');
            console.log('═'.repeat(100));
            analytics.allProducts.slice(0, 5).forEach(p => {
                console.log(`${p.emoji} ${p.name.padEnd(35)} | Stock: ${String(p.stock).padStart(3)} | Sold: ${String(p.quantitySold).padStart(3)} | Revenue: ₹${String(p.totalRevenue.toFixed(0)).padStart(7)}`);
            });
            console.log('═'.repeat(100));
            console.log(`\nTotal: ${analytics.allProducts.length} products with complete inventory data\n`);
        }
        
        process.exit(0);
    } catch (error) {
        console.error('Error:', error.message);
        process.exit(1);
    }
})();
