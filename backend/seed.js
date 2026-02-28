const bcrypt = require('bcrypt');
const { promisePool } = require('./config/db');

const seedDatabase = async () => {
    try {
        console.log('Starting database seeding...');

        // Generate bcrypt hash for admin password
        const adminPassword = await bcrypt.hash('admin123', 10);

        // Check if admin exists
        const [existingAdmin] = await promisePool.query(
            'SELECT id FROM users WHERE phone = ?',
            ['9876543210']
        );

        if (existingAdmin.length === 0) {
            // Insert admin user
            await promisePool.query(
                `INSERT INTO users (fullName, phone, place, password, role) 
                 VALUES (?, ?, ?, ?, ?)`,
                ['Admin User', '9876543210', 'Palakollu', adminPassword, 'admin']
            );
            console.log('Admin user created: phone=9876543210, password=admin123');
        } else {
            // Update admin password
            await promisePool.query(
                'UPDATE users SET password = ? WHERE phone = ?',
                [adminPassword, '9876543210']
            );
            console.log('Admin password updated: phone=9876543210, password=admin123');
        }

        // Check if products exist
        const [existingProducts] = await promisePool.query('SELECT COUNT(*) as count FROM products');
        
        if (existingProducts[0].count === 0) {
            // Insert sample products
            const products = [
                ['Basmati Rice (5kg)', 'grains', 420, 50],
                ['Toor Dal (1kg)', 'grains', 140, 80],
                ['Full Cream Milk (1L)', 'milk', 62, 100],
                ['Paneer (200g)', 'milk', 90, 40],
                ['Potato Chips Classic', 'snacks', 30, 200],
                ['Turmeric Powder (200g)', 'spices', 55, 80],
                ['Sunflower Oil (1L)', 'oils', 150, 70],
                ['Tomato Ketchup (500g)', 'condiments', 105, 85],
                ['Dish Wash Liquid (500ml)', 'cleaning', 85, 90],
                ['Toothpaste (150g)', 'personal', 95, 100],
            ];

            for (const [name, category, price, stock] of products) {
                await promisePool.query(
                    'INSERT INTO products (name, category, price, stock) VALUES (?, ?, ?, ?)',
                    [name, category, price, stock]
                );
            }
            console.log(`${products.length} sample products created`);
        } else {
            console.log(`Products already exist (${existingProducts[0].count} found)`);
        }

        console.log('Database seeding completed successfully!');
        process.exit(0);
    } catch (error) {
        console.error('Seeding failed:', error.message);
        process.exit(1);
    }
};

seedDatabase();
