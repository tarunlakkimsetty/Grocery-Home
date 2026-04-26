const { promisePool } = require('./config/db');

(async () => {
    try {
        console.log('Running database migration...');
        
        // Add favoriteFood column
        try {
            await promisePool.query('ALTER TABLE users ADD COLUMN favoriteFood VARCHAR(100) DEFAULT NULL');
            console.log('✓ favoriteFood column added');
        } catch(e) {
            if (e.code === 'ER_DUP_FIELDNAME') {
                console.log('✓ favoriteFood column already exists');
            } else {
                throw e;
            }
        }
        
        // Add favoritePlace column
        try {
            await promisePool.query('ALTER TABLE users ADD COLUMN favoritePlace VARCHAR(100) DEFAULT NULL');
            console.log('✓ favoritePlace column added');
        } catch(e) {
            if (e.code === 'ER_DUP_FIELDNAME') {
                console.log('✓ favoritePlace column already exists');
            } else {
                throw e;
            }
        }
        
        // Add passwordResetAttempts column
        try {
            await promisePool.query('ALTER TABLE users ADD COLUMN passwordResetAttempts INT DEFAULT 0');
            console.log('✓ passwordResetAttempts column added');
        } catch(e) {
            if (e.code === 'ER_DUP_FIELDNAME') {
                console.log('✓ passwordResetAttempts column already exists');
            } else {
                throw e;
            }
        }
        
        // Add passwordResetAttemptedAt column
        try {
            await promisePool.query('ALTER TABLE users ADD COLUMN passwordResetAttemptedAt TIMESTAMP NULL');
            console.log('✓ passwordResetAttemptedAt column added');
        } catch(e) {
            if (e.code === 'ER_DUP_FIELDNAME') {
                console.log('✓ passwordResetAttemptedAt column already exists');
            } else {
                throw e;
            }
        }
        
        console.log('\n✓ Migration complete!\n');
        process.exit(0);
    } catch(error) {
        console.error('✗ Migration failed:', error.message);
        process.exit(1);
    }
})();
