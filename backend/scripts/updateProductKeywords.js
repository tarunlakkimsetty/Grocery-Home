const { promisePool } = require('../config/db');

const updateProductKeywords = async () => {
    try {
        console.log('Updating product keywords for better OCR matching...');

        // Update Potato Chips - add "popcorn" keyword
        const potatoChipsUpdate = JSON.stringify(['chips', 'aloo chips', 'potato chips', 'crisps', 'popcorn', 'snacks']);
        await promisePool.query(
            'UPDATE products SET keywords = ? WHERE name LIKE "%Potato Chips%"',
            [potatoChipsUpdate]
        );
        console.log('✅ Updated Potato Chips keywords (added: popcorn, snacks)');

        // Update Dish Wash Liquid - ensure comprehensive keywords
        const dishWashUpdate = JSON.stringify(['dish wash', 'dish soap', 'liquid soap', 'washing liquid', 'dishwash', 'utensil', 'cleaning']);
        await promisePool.query(
            'UPDATE products SET keywords = ? WHERE name LIKE "%Dish Wash%"',
            [dishWashUpdate]
        );
        console.log('✅ Updated Dish Wash Liquid keywords');

        console.log('All product keywords updated successfully!');
        process.exit(0);
    } catch (error) {
        console.error('Update failed:', error.message);
        process.exit(1);
    }
};

updateProductKeywords();
