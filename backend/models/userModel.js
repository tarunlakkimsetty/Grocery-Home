const { promisePool } = require('../config/db');
const bcrypt = require('bcrypt');

const SALT_ROUNDS = 10;

const User = {
    /**
     * Find user by phone number
     */
    findByPhone: async (phone) => {
        const [rows] = await promisePool.query(
            'SELECT * FROM users WHERE phone = ?',
            [phone]
        );
        return rows[0] || null;
    },

    /**
     * Find user by ID
     */
    findById: async (id) => {
        const [rows] = await promisePool.query(
            'SELECT id, fullName, phone, place, role, createdAt FROM users WHERE id = ?',
            [id]
        );
        return rows[0] || null;
    },

    /**
     * Create new user with hashed password
     */
    create: async (userData) => {
        const { fullName, phone, place, password, role = 'customer' } = userData;
        
        // Hash password
        const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);
        
        const [result] = await promisePool.query(
            'INSERT INTO users (fullName, phone, place, password, role) VALUES (?, ?, ?, ?, ?)',
            [fullName, phone, place, hashedPassword, role]
        );
        
        return {
            id: result.insertId,
            fullName,
            phone,
            place,
            role
        };
    },

    /**
     * Compare password with hash
     */
    comparePassword: async (plainPassword, hashedPassword) => {
        return bcrypt.compare(plainPassword, hashedPassword);
    },

    /**
     * Get all users (admin only)
     */
    findAll: async () => {
        const [rows] = await promisePool.query(
            'SELECT id, fullName, phone, place, role, createdAt FROM users ORDER BY createdAt DESC'
        );
        return rows;
    }
};

module.exports = User;
