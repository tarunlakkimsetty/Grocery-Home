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
        const { fullName, phone, place, password, role = 'customer', favoriteFood, favoritePlace } = userData;
        
        // Hash password
        const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);
        
        const [result] = await promisePool.query(
            'INSERT INTO users (fullName, phone, place, password, role, favoriteFood, favoritePlace) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [fullName, phone, place, hashedPassword, role, favoriteFood?.trim().toLowerCase() || null, favoritePlace?.trim().toLowerCase() || null]
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
    },

    /**
     * Update password by phone
     */
    updatePassword: async (phone, newPassword) => {
        const hashedPassword = await bcrypt.hash(newPassword, SALT_ROUNDS);
        const [result] = await promisePool.query(
            'UPDATE users SET password = ?, passwordResetAttempts = 0 WHERE phone = ?',
            [hashedPassword, phone]
        );
        return result.affectedRows > 0;
    },

    /**
     * Verify security questions
     */
    verifySecurityQuestions: async (phone, favoriteFood, favoritePlace) => {
        const user = await User.findByPhone(phone);
        if (!user) return null;
        
        const inputFood = favoriteFood?.trim().toLowerCase() || '';
        const inputPlace = favoritePlace?.trim().toLowerCase() || '';
        
        if (inputFood === user.favoriteFood && inputPlace === user.favoritePlace) {
            return user;
        }
        return null;
    },

    /**
     * Update password reset attempts
     */
    recordPasswordResetAttempt: async (phone) => {
        await promisePool.query(
            'UPDATE users SET passwordResetAttempts = passwordResetAttempts + 1, passwordResetAttemptedAt = CURRENT_TIMESTAMP WHERE phone = ?',
            [phone]
        );
    },

    /**
     * Reset password attempts counter
     */
    resetPasswordAttempts: async (phone) => {
        await promisePool.query(
            'UPDATE users SET passwordResetAttempts = 0 WHERE phone = ?',
            [phone]
        );
    }
};

module.exports = User;
