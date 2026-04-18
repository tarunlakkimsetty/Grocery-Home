const { promisePool } = require('../config/db');

const addMissingColumns = async () => {
    try {
        console.log('Checking and adding missing columns to products table...');

        // Check if teluguName column exists
        const [teluguNameResult] = await promisePool.query(`
            SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_NAME = 'products' AND TABLE_SCHEMA = 'grocery_db' AND COLUMN_NAME = 'teluguName'
        `);

        if (teluguNameResult.length === 0) {
            console.log('Adding teluguName column...');
            await promisePool.query('ALTER TABLE products ADD COLUMN teluguName VARCHAR(150) DEFAULT NULL');
            console.log('✅ teluguName column added');
        } else {
            console.log('✅ teluguName column already exists');
        }

        // Check if keywords column exists
        const [keywordsResult] = await promisePool.query(`
            SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_NAME = 'products' AND TABLE_SCHEMA = 'grocery_db' AND COLUMN_NAME = 'keywords'
        `);

        if (keywordsResult.length === 0) {
            console.log('Adding keywords column...');
            await promisePool.query('ALTER TABLE products ADD COLUMN keywords JSON DEFAULT NULL');
            console.log('✅ keywords column added');
        } else {
            console.log('✅ keywords column already exists');
        }

        console.log('\n✅ All columns are ready!');
        process.exit(0);
    } catch (error) {
        console.error('Failed:', error.message);
        process.exit(1);
    }
};

addMissingColumns();
