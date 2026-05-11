const { promisePool } = require('../config/db');
const bcrypt = require('bcrypt');

const SALT_ROUNDS = 10;

const getUsersColumnSet = async () => {
    const [columns] = await promisePool.query(
        `SELECT COLUMN_NAME
         FROM information_schema.COLUMNS
         WHERE TABLE_SCHEMA = DATABASE()
           AND TABLE_NAME = 'users'`
    );

    return new Set((columns || []).map((c) => c.COLUMN_NAME));
};

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
        const {
            fullName,
            phone,
            place,
            password,
            role = 'customer',
            favoriteFood,
            favoritePlace,
            agreedToPolicies,
            agreedToTerms,
            agreedToPrivacy,
        } = userData;

        try {
            // Hash password
            const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

            const usersColumns = await getUsersColumnSet();
            const nameColumn = usersColumns.has('fullName') ? 'fullName' : (usersColumns.has('name') ? 'name' : null);

            if (!nameColumn) {
                throw new Error('users table is missing both fullName and name columns');
            }

            const insertColumns = [nameColumn, 'phone', 'password'];
            const insertValues = [fullName, phone, hashedPassword];

            if (usersColumns.has('place')) {
                insertColumns.push('place');
                insertValues.push(place || null);
            }

            if (usersColumns.has('role')) {
                insertColumns.push('role');
                insertValues.push(role);
            }

            if (usersColumns.has('favoriteFood')) {
                insertColumns.push('favoriteFood');
                insertValues.push(favoriteFood?.trim().toLowerCase() || null);
            }

            if (usersColumns.has('favoritePlace')) {
                insertColumns.push('favoritePlace');
                insertValues.push(favoritePlace?.trim().toLowerCase() || null);
            }

            if (usersColumns.has('agreedToPolicies')) {
                insertColumns.push('agreedToPolicies');
                insertValues.push(Boolean(agreedToPolicies));
            }

            if (usersColumns.has('agreedToTerms')) {
                insertColumns.push('agreedToTerms');
                insertValues.push(Boolean(agreedToTerms ?? agreedToPolicies));
            }

            if (usersColumns.has('agreedToPrivacy')) {
                insertColumns.push('agreedToPrivacy');
                insertValues.push(Boolean(agreedToPrivacy ?? agreedToPolicies));
            }

            if (usersColumns.has('legalAcceptedAt')) {
                insertColumns.push('legalAcceptedAt');
                insertValues.push(Boolean(agreedToPolicies) ? new Date() : null);
            }

            const placeholders = insertColumns.map(() => '?').join(', ');
            const sql = `INSERT INTO users (${insertColumns.join(', ')}) VALUES (${placeholders})`;

            const [result] = await promisePool.query(sql, insertValues);

            return {
                id: result.insertId,
                fullName,
                phone,
                place,
                role
            };
        } catch (error) {
            console.error('User.create failed:', {
                message: error?.message,
                code: error?.code,
                sqlMessage: error?.sqlMessage,
                sqlState: error?.sqlState,
            });
            throw error;
        }
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
