const { promisePool } = require('./config/db');

(async () => {
    try {
        const [rows] = await promisePool.query('SELECT id, name, stock FROM products ORDER BY id');
        console.log('Database products (' + rows.length + ' total):');
        rows.forEach(r => console.log(`${r.id}: ${r.name} (stock: ${r.stock})`));
        process.exit(0);
    } catch (err) {
        console.error('Error:', err.message);
        process.exit(1);
    }
})();
