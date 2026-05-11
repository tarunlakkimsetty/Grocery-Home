const mysql = require('mysql2');
const config = require('./config');

// Use port 3306 unless explicitly set
const dbPort = parseInt(process.env.DB_PORT, 10) || 3306;

// Build pool options using environment-aware config
const poolOptions = {
    host: config.db.host,
    user: config.db.user,
    password: config.db.password,
    database: config.db.name,
    port: dbPort,
    waitForConnections: true,
    connectionLimit: config.db.connectionLimit,
    queueLimit: 0
};

// If running in production or connecting to a remote host, enable SSL (common for managed MySQL)
const isRemote = config.db.host && config.db.host !== 'localhost' && config.db.host !== '127.0.0.1';
if (config.env === 'production' || isRemote) {
    poolOptions.ssl = { rejectUnauthorized: false };
}

// Create MySQL connection pool
const pool = mysql.createPool(poolOptions);

// Get promise-based pool for async/await
const promisePool = pool.promise();

// Test database connection with detailed logs
const testConnection = async () => {
    try {
        console.log('Attempting DB connection with host:', config.db.host || '(not set)');
        const connection = await promisePool.getConnection();
        console.log('Database connected successfully');
        connection.release();
        return true;
    } catch (error) {
        console.error('Database connection failed:');
        console.error(error && error.stack ? error.stack : error);
        return false;
    }
};

module.exports = { pool, promisePool, testConnection };
