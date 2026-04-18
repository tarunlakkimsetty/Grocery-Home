const { promisePool } = require('../config/db');
const fs = require('fs');
const path = require('path');

const runMigration = async () => {
    try {
        console.log('Running migration: Add Telugu search to products...');

        // Read and execute the migration SQL
        const migrationPath = path.join(__dirname, '../migrations/003_add_telugu_search_to_products.sql');
        const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
        
        // Split by semicolon and execute each statement
        const statements = migrationSQL
            .split(';')
            .map(stmt => stmt.trim())
            .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));

        for (const statement of statements) {
            console.log(`Executing: ${statement.substring(0, 60)}...`);
            await promisePool.query(statement);
        }

        console.log('✅ Migration completed successfully!');
        process.exit(0);
    } catch (error) {
        console.error('Migration failed:', error.message);
        process.exit(1);
    }
};

runMigration();
