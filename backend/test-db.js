/**
 * Standalone DB connection tester
 * Usage: NODE_ENV=production DB_HOST=... DB_USER=... DB_PASSWORD=... node test-db.js
 */
const mysql = require('mysql2');

const host = process.env.DB_HOST;
const user = process.env.DB_USER;
const password = process.env.DB_PASSWORD;
const database = process.env.DB_NAME;
const port = parseInt(process.env.DB_PORT, 10) || 3306;

const mask = (v) => {
    if (!v) return '(not set)';
    const s = String(v);
    if (s.length <= 2) return '*'.repeat(s.length);
    return s[0] + '***' + s[s.length - 1];
};

console.log('Testing DB connection with the following (masked) settings:');
console.log(' DB_HOST:', mask(host));
console.log(' DB_USER:', mask(user));
console.log(' DB_NAME:', mask(database));
console.log(' DB_PORT:', port);
console.log(' DB_PASSWORD: length=', password ? password.length : '(not set)');
if (password) {
    console.log(' Password leading/trailing whitespace:', password.startsWith(' '), password.endsWith(' '));
}

const tryConnect = async (opts) => {
    const pool = mysql.createPool(opts).promise();
    try {
        const conn = await pool.getConnection();
        console.log(opts.ssl ? 'Connected with SSL' : 'Connected without SSL');
        conn.release();
        return true;
    } catch (err) {
        console.error('Connection failed:', err && err.message ? err.message : err);
        if (err && err.code) console.error('MySQL error code:', err.code);
        return false;
    }
};

const run = async () => {
    if (!host || !user || !database) {
        console.error('Missing required environment variables. Please set DB_HOST, DB_USER, DB_NAME, and DB_PASSWORD.');
        process.exit(1);
    }

    const base = { host, user, password, database, port, waitForConnections: true, connectionLimit: 1 };

    console.log('\n1) Trying without SSL...');
    const noSsl = await tryConnect(base);
    if (noSsl) process.exit(0);

    console.log('\n2) Trying with SSL (rejectUnauthorized=false)...');
    const sslOpts = { ...base, ssl: { rejectUnauthorized: false } };
    const yesSsl = await tryConnect(sslOpts);
    if (yesSsl) process.exit(0);

    console.error('\nBoth attempts failed. Please verify credentials and network access (IP allowlist).');
    process.exit(2);
};

run();
