const { promisePool } = require('./config/db');

(async () => {
    try {
        console.log('Updating existing users with default security questions...\n');
        
        // Update users that don't have security questions
        const [result] = await promisePool.query(
            `UPDATE users SET 
                favoriteFood = COALESCE(favoriteFood, 'Pizza'),
                favoritePlace = COALESCE(favoritePlace, 'Home')
             WHERE favoriteFood IS NULL OR favoritePlace IS NULL`
        );
        
        console.log(`✓ Updated ${result.changedRows} users`);
        console.log('Default Security Answers:');
        console.log('  Food: Pizza');
        console.log('  Place: Home');
        console.log('\n✓ All users can now use password reset!\n');
        
        process.exit(0);
    } catch(error) {
        console.error('✗ Update failed:', error.message);
        process.exit(1);
    }
})();
