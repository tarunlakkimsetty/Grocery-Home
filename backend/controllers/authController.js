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
        const { fullName, phone, place, password } = req.body;

        // Validate required fields
        if (!fullName || !phone || !password) {
            return res.status(400).json({
                success: false,
                message: 'Please provide fullName, phone, and password'
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

module.exports = {
    register,
    login,
    getMe
};
