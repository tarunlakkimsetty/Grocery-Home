const { promisePool } = require('../config/db');

const updateProductsWithTelugu = async () => {
    try {
        console.log('Updating products with Telugu names and keywords...');

        // Define products with their updates
        const productUpdates = [
            {
                name: 'Basmati Rice (5kg)',
                teluguName: 'బియ్యం',
                keywords: ['rice', 'biyyam', 'basmati', 'chawal']
            },
            {
                name: 'Toor Dal (1kg)',
                teluguName: 'తూర్ బీజ',
                keywords: ['toor', 'tur', 'dal', 'dhal', 'arhar', 'ahar']
            },
            {
                name: 'Full Cream Milk (1L)',
                teluguName: 'పాలు',
                keywords: ['milk', 'paal', 'dudh', 'ksheer']
            },
            {
                name: 'Paneer (200g)',
                teluguName: 'పనీర్',
                keywords: ['paneer', 'cheese', 'cottage cheese', 'chikni']
            },
            {
                name: 'Potato Chips Classic',
                teluguName: 'చిప్‌స్',
                keywords: ['chips', 'aloo chips', 'potato chips', 'crisps', 'popcorn', 'snacks']
            },
            {
                name: 'Turmeric Powder (200g)',
                teluguName: 'పసుపు',
                keywords: ['turmeric', 'haldi', 'pasuppu', 'manjal', 'spice']
            },
            {
                name: 'Sunflower Oil (1L)',
                teluguName: 'సూర్యకాంతి నూనె',
                keywords: ['oil', 'sunflower', 'tel', 'seed oil', 'cooking oil']
            },
            {
                name: 'Tomato Ketchup (500g)',
                teluguName: 'టమాటా సాస్',
                keywords: ['ketchup', 'sauce', 'tomato', 'tamato sauce', 'condiment']
            },
            {
                name: 'Dish Wash Liquid (500ml)',
                teluguName: 'పాత్ర శుభ్రక రసం',
                keywords: ['dish wash', 'dish soap', 'liquid soap', 'washing liquid', 'dishwash', 'utensil', 'cleaning']
            },
            {
                name: 'Toothpaste (150g)',
                teluguName: 'చెవ్వుకు పేస్ట్',
                keywords: ['toothpaste', 'tooth paste', 'paste', 'dental', 'oral care']
            }
        ];

        for (const update of productUpdates) {
            const keywordsJson = JSON.stringify(update.keywords);
            await promisePool.query(
                'UPDATE products SET teluguName = ?, keywords = ? WHERE name = ?',
                [update.teluguName, keywordsJson, update.name]
            );
            console.log(`✅ Updated: ${update.name}`);
        }

        console.log('\n✅ All products updated with Telugu names and keywords!');
        process.exit(0);
    } catch (error) {
        console.error('Update failed:', error.message);
        process.exit(1);
    }
};

updateProductsWithTelugu();
