const jwt = require('jsonwebtoken');
const User = require('../models/userModel');

/**
 * Generate JWT Token
 */
const generateToken = (user) => {
    return jwt.sign(
        {
            id: user.id,
            fullName: user.fullName,
            phone: user.phone,
            role: user.role
        },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );
};

/**
 * @desc    Register new user
 * @route   POST /api/auth/register
 * @access  Public
 */
const register = async (req, res, next) => {
    try {
        const { fullName, phone, place, password, favoriteFood, favoritePlace } = req.body;

        // Validate required fields
        if (!fullName || !phone || !password || !favoriteFood || !favoritePlace) {
            return res.status(400).json({
                success: false,
                message: 'Please provide fullName, phone, password, favoriteFood, and favoritePlace'
            });
        }

        // Validate phone format (10 digits)
        const cleanedPhone = String(phone).replace(/\D/g, '');
        if (!/^\d{10}$/.test(cleanedPhone)) {
            return res.status(400).json({
                success: false,
                message: 'Phone number must be exactly 10 digits'
            });
        }

        // Validate password length
        if (password.length < 6) {
            return res.status(400).json({
                success: false,
                message: 'Password must be at least 6 characters'
            });
        }

        // Validate security answers
        if (favoriteFood.trim().length < 2 || favoritePlace.trim().length < 2) {
            return res.status(400).json({
                success: false,
                message: 'Favorite Food and Favorite Place must be at least 2 characters'
            });
        }

        // Check if phone already exists
        const existingUser = await User.findByPhone(cleanedPhone);
        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: 'Phone number already registered'
            });
        }

        // Create user
        const newUser = await User.create({
            fullName,
            phone: cleanedPhone,
            place: place || null,
            password,
            favoriteFood,
            favoritePlace,
            role: 'customer'
        });

        // Generate token
        const token = generateToken(newUser);

        res.status(201).json({
            success: true,
            message: 'Registration successful',
            token,
            user: {
                id: newUser.id,
                fullName: newUser.fullName,
                phone: newUser.phone,
                place: newUser.place,
                role: newUser.role
            }
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Login user
 * @route   POST /api/auth/login
 * @access  Public
 */
const login = async (req, res, next) => {
    try {
        const { phone, password } = req.body;

        // Validate required fields
        if (!phone || !password) {
            return res.status(400).json({
                success: false,
                message: 'Please provide phone and password'
            });
        }

        // Clean phone number
        const cleanedPhone = String(phone).replace(/\D/g, '');

        // Find user by phone
        const user = await User.findByPhone(cleanedPhone);
        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Invalid phone or password'
            });
        }

        // Compare password
        const isMatch = await User.comparePassword(password, user.password);
        if (!isMatch) {
            return res.status(401).json({
                success: false,
                message: 'Invalid phone or password'
            });
        }

        // Generate token
        const token = generateToken(user);

        res.status(200).json({
            success: true,
            message: 'Login successful',
            token,
            user: {
                id: user.id,
                fullName: user.fullName,
                phone: user.phone,
                place: user.place,
                role: user.role
            }
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Get current user profile
 * @route   GET /api/auth/me
 * @access  Private
 */
const getMe = async (req, res, next) => {
    try {
        const user = await User.findById(req.user.id);
        
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        res.status(200).json({
            success: true,
            user
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Verify phone for password reset (Step 1)
 * @route   POST /api/auth/forgot-password/verify-phone
 * @access  Public
 */
const verifyPhoneForReset = async (req, res, next) => {
    try {
        const { phone } = req.body;

        if (!phone) {
            return res.status(400).json({
                success: false,
                message: 'Please provide phone number'
            });
        }

        const cleanedPhone = String(phone).replace(/\D/g, '');
        
        if (!/^\d{10}$/.test(cleanedPhone)) {
            return res.status(400).json({
                success: false,
                message: 'Phone number must be exactly 10 digits'
            });
        }

        const user = await User.findByPhone(cleanedPhone);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found with this phone number'
            });
        }

        // Check if too many reset attempts
        if (user.passwordResetAttempts >= 3) {
            const attemptedAt = new Date(user.passwordResetAttemptedAt);
            const now = new Date();
            const minutesPassed = (now - attemptedAt) / 60000;
            
            if (minutesPassed < 15) {
                return res.status(429).json({
                    success: false,
                    message: 'Too many reset attempts. Please try again later.'
                });
            }
        }

        // Security questions should exist
        if (!user.favoriteFood || !user.favoritePlace) {
            return res.status(400).json({
                success: false,
                message: 'Security questions not set. Please contact support.'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Phone verified. Please answer security questions.',
            data: {
                phone: cleanedPhone
            }
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Verify security answers for password reset (Step 2)
 * @route   POST /api/auth/forgot-password/verify-answers
 * @access  Public
 */
const verifySecurityAnswers = async (req, res, next) => {
    try {
        const { phone, favoriteFood, favoritePlace } = req.body;

        if (!phone || !favoriteFood || !favoritePlace) {
            return res.status(400).json({
                success: false,
                message: 'Please provide phone and security answers'
            });
        }

        const cleanedPhone = String(phone).replace(/\D/g, '');
        
        // Verify answers
        const user = await User.verifySecurityQuestions(cleanedPhone, favoriteFood, favoritePlace);
        
        if (!user) {
            await User.recordPasswordResetAttempt(cleanedPhone);
            return res.status(401).json({
                success: false,
                message: 'Incorrect security answers. Please try again.'
            });
        }

        // Reset attempts on success
        await User.resetPasswordAttempts(cleanedPhone);

        res.status(200).json({
            success: true,
            message: 'Security answers verified. You can now reset your password.',
            data: {
                phone: cleanedPhone,
                verified: true
            }
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Reset password for user
 * @route   POST /api/auth/forgot-password/reset
 * @access  Public
 */
const resetPassword = async (req, res, next) => {
    try {
        const { phone, newPassword, confirmPassword } = req.body;

        if (!phone || !newPassword || !confirmPassword) {
            return res.status(400).json({
                success: false,
                message: 'Please provide all required fields'
            });
        }

        if (newPassword.length < 6) {
            return res.status(400).json({
                success: false,
                message: 'Password must be at least 6 characters'
            });
        }

        if (newPassword !== confirmPassword) {
            return res.status(400).json({
                success: false,
                message: 'Passwords do not match'
            });
        }

        const cleanedPhone = String(phone).replace(/\D/g, '');
        
        const user = await User.findByPhone(cleanedPhone);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Update password
        const updated = await User.updatePassword(cleanedPhone, newPassword);
        
        if (!updated) {
            return res.status(500).json({
                success: false,
                message: 'Failed to reset password'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Password reset successful. You can now login with your new password.'
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    register,
    login,
    getMe,
    verifyPhoneForReset,
    verifySecurityAnswers,
    resetPassword
};
