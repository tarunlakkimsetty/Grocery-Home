const mysql = require('mysql2');
const config = require('./config');

// Use port 3306 unless explicitly set
const dbPort = parseInt(process.env.DB_PORT, 10) || 3306;

// Build base pool options using environment-aware config (do not trim password)
const baseOptions = {
    host: config.db.host,
    user: config.db.user,
    password: config.db.password,
    database: config.db.name,
    port: dbPort,
    waitForConnections: true,
    connectionLimit: config.db.connectionLimit,
    queueLimit: 0
};

// Helper to create pool and promisePool. Keep stable wrapper objects so destructured
// imports stay usable even if we swap the underlying pool at runtime.
let poolOptions = { ...baseOptions };
let activePool = mysql.createPool(poolOptions);
let activePromisePool = activePool.promise();

const createPromisePoolWrapper = () => ({
    query: (...args) => activePromisePool.query(...args),
    execute: (...args) => activePromisePool.execute(...args),
    getConnection: (...args) => activePromisePool.getConnection(...args),
});

const pool = createPromisePoolWrapper();
const promisePool = createPromisePoolWrapper();

const replacePool = (newOptions) => {
    poolOptions = { ...newOptions };
    activePool = mysql.createPool(poolOptions);
    activePromisePool = activePool.promise();
};

// Masked debug helper
const mask = (value) => {
    if (!value) return '(not set)';
    const s = String(value);
    if (s.length <= 2) return '*'.repeat(s.length);
    return s[0] + '***' + s[s.length - 1];
};

// Test database connection with fallback: try current pool, if SSL fails try without SSL
const testConnection = async () => {
    try {
        console.log('DB connection debug:');
        console.log('  DB_HOST:', mask(poolOptions.host));
        console.log('  DB_USER:', mask(poolOptions.user));
        console.log('  DB_NAME:', mask(poolOptions.database));
        console.log('  DB_PORT:', poolOptions.port || 3306);
        const pwd = poolOptions.password;
        const pwdInfo = pwd == null ? '(not set)' : `length=${String(pwd).length}, leadingSpace=${String(pwd).startsWith(' ')}, trailingSpace=${String(pwd).endsWith(' ')}`;
        console.log('  DB_PASSWORD:', pwdInfo);

        const connection = await promisePool.getConnection();
        console.log('Database connected successfully');
        connection.release();
        return true;
    } catch (err) {
        console.error('Initial DB connection attempt failed:');
        console.error(err && err.stack ? err.stack : err);

        // If ssl was set, try fallback without ssl
        if (poolOptions.ssl) {
            console.log('Attempting fallback connection without SSL...');
            const fallback = { ...poolOptions };
            delete fallback.ssl;
            try {
                const tempPool = mysql.createPool(fallback).promise();
                const conn = await tempPool.getConnection();
                console.log('Fallback (no-SSL) Database connected successfully — switching pool to no-SSL');
                conn.release();
                replacePool(fallback);
                return true;
            } catch (err2) {
                console.error('Fallback (no-SSL) attempt also failed:');
                console.error(err2 && err2.stack ? err2.stack : err2);
                return false;
            }
        }

        // If no SSL was configured, try with SSL as a second attempt
        console.log('Attempting alternate connection with SSL (rejectUnauthorized=false)...');
        const alt = { ...poolOptions, ssl: { rejectUnauthorized: false } };
        try {
            const tempPool2 = mysql.createPool(alt).promise();
            const conn2 = await tempPool2.getConnection();
            console.log('Alternate (SSL) Database connected successfully — switching pool to SSL');
            conn2.release();
            replacePool(alt);
            return true;
        } catch (err3) {
            console.error('Alternate (SSL) attempt failed:');
            console.error(err3 && err3.stack ? err3.stack : err3);
            return false;
        }
    }
};

module.exports = { pool, promisePool, getPool: () => pool, getPromisePool: () => promisePool, testConnection };
