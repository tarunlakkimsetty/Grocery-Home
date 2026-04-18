const { promisePool } = require('../config/db');

const addMissingCategories = async () => {
    try {
        console.log('Adding missing product categories...');

        // Get existing categories
        const [existingProducts] = await promisePool.query('SELECT DISTINCT category FROM products WHERE category IS NOT NULL');
        const existingCategories = existingProducts.map(p => p.category);
        console.log('Existing categories:', existingCategories);

        // All required categories with sample products
        const requiredProducts = [
            { name: 'Turmeric Powder (200g)', category: 'spices', price: 55, stock: 80, emoji: '🌶️' },
            { name: 'Tomato Ketchup (500g)', category: 'condiments', price: 105, stock: 85, emoji: '🍅' },
            { name: 'Dish Wash Liquid (500ml)', category: 'cleaning', price: 85, stock: 90, emoji: '🧼' },
            { name: 'Toothpaste (150g)', category: 'personal', price: 95, stock: 100, emoji: '🪥' },
        ];

        let addedCount = 0;

        for (const product of requiredProducts) {
            // Check if category already exists
            if (!existingCategories.includes(product.category)) {
                // Check if product name already exists
                const [existingProduct] = await promisePool.query(
                    'SELECT id FROM products WHERE name = ? LIMIT 1',
                    [product.name]
                );

                if (existingProduct.length === 0) {
                    await promisePool.query(
                        'INSERT INTO products (name, category, price, stock, emoji) VALUES (?, ?, ?, ?, ?)',
                        [product.name, product.category, product.price, product.stock, product.emoji]
                    );
                    console.log(`✅ Added: ${product.name} (${product.category})`);
                    addedCount++;
                    existingCategories.push(product.category);
                } else {
                    console.log(`⚠️  Product already exists: ${product.name}`);
                }
            } else {
                console.log(`ℹ️  Category already exists: ${product.category}`);
            }
        }

        console.log(`\nCompleted! Added ${addedCount} new products`);

        // Get final categories
        const [finalProducts] = await promisePool.query('SELECT DISTINCT category FROM products WHERE category IS NOT NULL ORDER BY category');
        console.log('\n📦 Final categories:', finalProducts.map(p => p.category).join(', '));

        process.exit(0);
    } catch (error) {
        console.error('Error adding categories:', error.message);
        process.exit(1);
    }
};

addMissingCategories();
