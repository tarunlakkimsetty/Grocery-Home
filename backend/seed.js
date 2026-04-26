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
            // Insert all products with stock values matching frontend mock data
            const products = [
                // Grains, Rice & Pulses
                ['Basmati Rice (5kg)', 'grains', 420, 50, 'బియ్యం', JSON.stringify(['rice', 'biyyam', 'basmati', 'chawal'])],
                ['Toor Dal (1kg)', 'grains', 140, 80, 'తూర్ బీజ', JSON.stringify(['toor', 'tur', 'dal', 'dhal', 'arhar', 'ahar'])],
                ['Wheat Flour Atta (5kg)', 'grains', 260, 60, 'గోధుమ పిండి', JSON.stringify(['wheat', 'atta', 'flour', 'godhumapindi'])],
                ['Moong Dal (1kg)', 'grains', 160, 45, 'ముందు బీజ', JSON.stringify(['moong', 'mung', 'dal'])],
                ['Chana Dal (1kg)', 'grains', 100, 70, 'చణ బీజ', JSON.stringify(['chana', 'chickpea', 'dal'])],
                ['Brown Rice (2kg)', 'grains', 220, 30, 'ఆకుపచ్చ బియ్యం', JSON.stringify(['brown rice', 'rice', 'biyyam'])],
                // Milk Products
                ['Full Cream Milk (1L)', 'milk', 62, 100, 'పాలు', JSON.stringify(['milk', 'paal', 'dudh', 'ksheer'])],
                ['Toned Milk (500ml)', 'milk', 28, 120, 'టోన్డ్ పాలు', JSON.stringify(['milk', 'toned milk', 'paal'])],
                ['Curd (400g)', 'milk', 40, 60, 'పెరుగు', JSON.stringify(['curd', 'yogurt', 'perugu', 'dahi'])],
                ['Paneer (200g)', 'milk', 90, 40, 'పనీర్', JSON.stringify(['paneer', 'cheese', 'cottage cheese', 'chikni'])],
                ['Butter (100g)', 'milk', 52, 55, 'వెన్న', JSON.stringify(['butter', 'venna', 'makkhan'])],
                ['Ghee (500ml)', 'milk', 310, 35, 'నెయ్యి', JSON.stringify(['ghee', 'neyyI', 'ghrit', 'clarified butter'])],
                // Snacks
                ['Potato Chips Classic', 'snacks', 30, 200, 'చిప్‌స్', JSON.stringify(['chips', 'aloo chips', 'potato chips', 'crisps'])],
                ['Namkeen Mix (400g)', 'snacks', 120, 90, 'నమ్కీన్', JSON.stringify(['namkeen', 'snack mix', 'mixture'])],
                ['Biscuits Cream (150g)', 'snacks', 35, 150, 'బిస్కెట్', JSON.stringify(['biscuit', 'cookies', 'cream biscuit'])],
                ['Instant Noodles (4-pack)', 'snacks', 56, 110, 'నూడిల్స్', JSON.stringify(['noodles', 'instant noodles', 'maggi'])],
                ['Peanut Butter (350g)', 'snacks', 185, 40, 'వేరుకాయ వెన్న', JSON.stringify(['peanut butter', 'butter', 'spread'])],
                ['Muesli (500g)', 'snacks', 280, 25, 'మ్యూజ్‌లీ', JSON.stringify(['muesli', 'cereal', 'breakfast'])],
                // Spices
                ['Turmeric Powder (200g)', 'spices', 55, 80, 'పసుపు', JSON.stringify(['turmeric', 'haldi', 'pasuppu', 'manjal', 'spice'])],
                ['Red Chilli Powder (200g)', 'spices', 65, 75, 'కుళ్ళు పౌడర్', JSON.stringify(['chilli', 'red chilli', 'mirchi powder'])],
                ['Garam Masala (100g)', 'spices', 78, 60, 'గరమ మసాలా', JSON.stringify(['garam masala', 'masala', 'spice mix'])],
                ['Cumin Seeds (100g)', 'spices', 45, 90, 'జీరక చెడ్డ', JSON.stringify(['cumin', 'jeera', 'seeds'])],
                ['Coriander Powder (200g)', 'spices', 40, 85, 'ధనియాలు', JSON.stringify(['coriander', 'dhania', 'cilantro'])],
                ['Black Pepper (50g)', 'spices', 60, 50, 'కాలు మిరియాలు', JSON.stringify(['black pepper', 'pepper', 'kali mirch'])],
                // Oils
                ['Sunflower Oil (1L)', 'oils', 150, 70, 'సూర్యకాంతి నూనె', JSON.stringify(['oil', 'sunflower', 'tel', 'seed oil', 'cooking oil'])],
                ['Mustard Oil (1L)', 'oils', 180, 55, 'సరసము నూనె', JSON.stringify(['mustard oil', 'oil', 'sarson tel'])],
                ['Olive Oil Extra Virgin (500ml)', 'oils', 480, 20, 'ఆలివ్ నూనె', JSON.stringify(['olive oil', 'oil', 'virgin oil'])],
                ['Coconut Oil (500ml)', 'oils', 130, 65, 'తెల్లుక నూనె', JSON.stringify(['coconut oil', 'oil', 'nariyal tel'])],
                ['Groundnut Oil (1L)', 'oils', 200, 40, 'వేరుకాయ నూనె', JSON.stringify(['groundnut oil', 'peanut oil', 'tel'])],
                // Condiments
                ['Tomato Ketchup (500g)', 'condiments', 105, 85, 'టమాటా సాస్', JSON.stringify(['ketchup', 'sauce', 'tomato', 'tamato sauce', 'condiment'])],
                ['Soy Sauce (200ml)', 'condiments', 65, 50, 'సోయా సాస్', JSON.stringify(['soy sauce', 'sauce', 'soya'])],
                ['Vinegar (500ml)', 'condiments', 45, 60, 'సిరిక', JSON.stringify(['vinegar', 'sirika', 'acetic acid'])],
                ['Mayonnaise (250g)', 'condiments', 95, 40, 'మాయోనేజ్', JSON.stringify(['mayonnaise', 'mayo', 'spread'])],
                ['Green Chutney (200g)', 'condiments', 55, 30, 'ఆకుపచ్చ చట్నీ', JSON.stringify(['chutney', 'green chutney', 'mint chutney'])],
                // Cleaning Supplies
                ['Dish Wash Liquid (500ml)', 'cleaning', 85, 90, 'పాత్ర శుభ్రక రసం', JSON.stringify(['dish wash', 'dish soap', 'liquid soap', 'washing liquid'])],
                ['Floor Cleaner (1L)', 'cleaning', 120, 70, 'నేలపై క్లీనర్', JSON.stringify(['floor cleaner', 'cleaner', 'floor soap'])],
                ['Laundry Detergent (1kg)', 'cleaning', 195, 55, 'బట్టల పరిశుద్ధక', JSON.stringify(['detergent', 'laundry detergent', 'soap powder'])],
                ['Toilet Cleaner (500ml)', 'cleaning', 75, 80, 'టాయిలెట్ క్లీనర్', JSON.stringify(['toilet cleaner', 'cleaner', 'harpic'])],
                ['Glass Cleaner (500ml)', 'cleaning', 110, 45, 'గాజు క్లీనర్', JSON.stringify(['glass cleaner', 'cleaner', 'window cleaner'])],
                // Personal Care & Hygiene
                ['Toothpaste (150g)', 'personal', 95, 100, 'చెవ్వుకు పేస్ట్', JSON.stringify(['toothpaste', 'tooth paste', 'paste', 'dental', 'oral care'])],
                ['Shampoo (200ml)', 'personal', 160, 70, 'చిమ్ముపండె', JSON.stringify(['shampoo', 'hair shampoo', 'shampoo'])],
                ['Bath Soap (4-pack)', 'personal', 120, 80, 'స్నానం సబ్బు', JSON.stringify(['soap', 'bath soap', 'naha soap'])],
                ['Hand Wash (250ml)', 'personal', 75, 90, 'చేతి కడిగే సాధనం', JSON.stringify(['hand wash', 'sanitizer', 'hand soap'])],
                ['Face Wash (100ml)', 'personal', 135, 50, 'ముఖం కడిగే రసం', JSON.stringify(['face wash', 'cleanser', 'facial'])],
                ['Deodorant (150ml)', 'personal', 195, 40, 'సువాసన', JSON.stringify(['deodorant', 'perfume', 'anti-perspirant'])],
            ];

            for (const [name, category, price, stock, teluguName, keywords] of products) {
                await promisePool.query(
                    'INSERT INTO products (name, category, price, stock, teluguName, keywords) VALUES (?, ?, ?, ?, ?, ?)',
                    [name, category, price, stock, teluguName, keywords]
                );
            }
            console.log(`${products.length} complete product catalog created with stock values and Telugu names`);
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
