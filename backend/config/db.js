const mysql = require('mysql2');
const config = require('./config');

// Create MySQL connection pool
const pool = mysql.createPool({
    host: config.db.host,
    user: config.db.user,
    password: config.db.password,
    database: config.db.name,
    port: 3306,
    waitForConnections: true,
    connectionLimit: config.db.connectionLimit,
    queueLimit: 0
});

// Get promise-based pool for async/await
const promisePool = pool.promise();

// Test database connection
const testConnection = async () => {
    try {
        const connection = await promisePool.getConnection();
        console.log('Connected to MySQL');
        connection.release();
        return true;
    } catch (error) {
        console.error('Database connection failed:', error.message);
        return false;
    }
};

module.exports = { pool, promisePool, testConnection };
