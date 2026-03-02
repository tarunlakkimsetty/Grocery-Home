const bcrypt = require('bcrypt');
const { promisePool } = require('./config/db');

const seedDatabase = async () => {
    try {
        console.log('Starting database seeding...');

        // Ensure admin credentials (phone + hashed password)
        const ADMIN_PHONE = '9441754505';
        const ADMIN_PASSWORD = 'Sairam@143';
        const adminPasswordHash = await bcrypt.hash(ADMIN_PASSWORD, 10);

        const [admins] = await promisePool.query(
            'SELECT id, phone FROM users WHERE role = ? ORDER BY id ASC LIMIT 1',
            ['admin']
        );

        if (admins.length === 0) {
            // Ensure there is no phone conflict before inserting
            const [conflict] = await promisePool.query('SELECT id, role FROM users WHERE phone = ? LIMIT 1', [ADMIN_PHONE]);
            if (conflict.length > 0) {
                throw new Error(`Cannot create admin: phone ${ADMIN_PHONE} is already used by role=${conflict[0].role}`);
            }

            await promisePool.query(
                `INSERT INTO users (fullName, phone, place, password, role) 
                 VALUES (?, ?, ?, ?, ?)`,
                ['Admin User', ADMIN_PHONE, 'Palakollu', adminPasswordHash, 'admin']
            );
            console.log(`Admin user created: phone=${ADMIN_PHONE}`);
        } else {
            const adminId = admins[0].id;
            const [conflict] = await promisePool.query(
                'SELECT id, role FROM users WHERE phone = ? AND id <> ? LIMIT 1',
                [ADMIN_PHONE, adminId]
            );
            if (conflict.length > 0) {
                throw new Error(`Cannot update admin: phone ${ADMIN_PHONE} is already used by role=${conflict[0].role}`);
            }

            await promisePool.query(
                'UPDATE users SET phone = ?, password = ? WHERE id = ?',
                [ADMIN_PHONE, adminPasswordHash, adminId]
            );
            console.log(`Admin credentials updated: phone=${ADMIN_PHONE}`);
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
