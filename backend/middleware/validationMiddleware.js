const { body, param, query, validationResult } = require('express-validator');

/**
 * Validation Result Handler
 * Checks for validation errors and returns 400 if any exist
 */
const validate = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        console.log('Validation errors:', errors.array());
        console.log('Request body was:', req.body);
        return res.status(400).json({
            success: false,
            message: 'Validation failed',
            errors: errors.array().map(err => ({
                field: err.path,
                message: err.msg
            }))
        });
    }
    next();
};

/**
 * Auth Validators
 */
const authValidators = {
    register: [
        body('fullName')
            .trim()
            .notEmpty().withMessage('Full name is required')
            .isLength({ min: 2, max: 100 }).withMessage('Full name must be 2-100 characters'),
        body('phone')
            .trim()
            .notEmpty().withMessage('Phone number is required')
            .matches(/^[0-9]{10}$/).withMessage('Phone must be a valid 10-digit number'),
        body('place')
            .trim()
            .notEmpty().withMessage('Place is required')
            .isLength({ min: 2, max: 100 }).withMessage('Place must be 2-100 characters'),
        body('password')
            .notEmpty().withMessage('Password is required')
            .isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
        validate
    ],
    login: [
        body('phone')
            .trim()
            .notEmpty().withMessage('Phone number is required')
            .matches(/^[0-9]{10}$/).withMessage('Phone must be a valid 10-digit number'),
        body('password')
            .notEmpty().withMessage('Password is required'),
        validate
    ]
};

/**
 * Product Validators
 */
const productValidators = {
    create: [
        body('name')
            .trim()
            .notEmpty().withMessage('Product name is required')
            .isLength({ min: 2, max: 100 }).withMessage('Name must be 2-100 characters'),
        body('description')
            .optional()
            .trim()
            .isLength({ max: 500 }).withMessage('Description cannot exceed 500 characters'),
        body('price')
            .notEmpty().withMessage('Price is required')
            .custom((value) => {
                const num = Number(value);
                if (isNaN(num) || num < 0) {
                    throw new Error('Price must be a positive number');
                }
                return true;
            }),
        body('stock')
            .notEmpty().withMessage('Stock is required')
            .custom((value) => {
                const num = Number(value);
                if (isNaN(num) || num < 0 || !Number.isInteger(num)) {
                    throw new Error('Stock must be a non-negative integer');
                }
                return true;
            }),
        body('category')
            .trim()
            .notEmpty().withMessage('Category is required')
            .isLength({ min: 2, max: 50 }).withMessage('Category must be 2-50 characters'),
        body('unit')
            .optional()
            .trim()
            .isLength({ max: 20 }).withMessage('Unit cannot exceed 20 characters'),
        body('emoji')
            .optional()
            .trim()
            .isLength({ max: 10 }).withMessage('Emoji cannot exceed 10 characters'),
        validate
    ],
    update: [
        param('id')
            .isInt({ min: 1 }).withMessage('Invalid product ID'),
        body('name')
            .optional()
            .trim()
            .isLength({ min: 2, max: 100 }).withMessage('Name must be 2-100 characters'),
        body('description')
            .optional()
            .trim()
            .isLength({ max: 500 }).withMessage('Description cannot exceed 500 characters'),
        body('price')
            .optional()
            .isFloat({ min: 0 }).withMessage('Price must be a positive number'),
        body('stock')
            .optional()
            .isInt({ min: 0 }).withMessage('Stock must be a non-negative integer'),
        body('category')
            .optional()
            .trim()
            .isLength({ min: 2, max: 50 }).withMessage('Category must be 2-50 characters'),
        validate
    ],
    updateStock: [
        param('id')
            .isInt({ min: 1 }).withMessage('Invalid product ID'),
        body('stock')
            .notEmpty().withMessage('Stock is required')
            .isInt({ min: 0 }).withMessage('Stock must be a non-negative integer'),
        validate
    ],
    getById: [
        param('id')
            .isInt({ min: 1 }).withMessage('Invalid product ID'),
        validate
    ]
};

/**
 * Order Validators
 */
const orderValidators = {
    createOnline: [
        body('items')
            .isArray({ min: 1 }).withMessage('At least one item is required'),
        body('items.*.productId')
            .isInt({ min: 1 }).withMessage('Invalid product ID'),
        body('items.*.quantity')
            .isInt({ min: 1 }).withMessage('Quantity must be at least 1'),
        validate
    ],
    createOffline: [
        body('customerName')
            .optional()
            .trim()
            .isLength({ max: 100 }).withMessage('Customer name cannot exceed 100 characters'),
        body('customerPhone')
            .optional()
            .trim()
            .matches(/^[0-9]{10}$/).withMessage('Phone must be a valid 10-digit number'),
        body('items')
            .isArray({ min: 1 }).withMessage('At least one item is required'),
        body('items.*.productId')
            .isInt({ min: 1 }).withMessage('Invalid product ID'),
        body('items.*.quantity')
            .isInt({ min: 1 }).withMessage('Quantity must be at least 1'),
        validate
    ],
    updateItems: [
        param('id')
            .isInt({ min: 1 }).withMessage('Invalid order ID'),
        body('items')
            .isArray({ min: 1 }).withMessage('At least one item is required'),
        body('items.*.productId')
            .isInt({ min: 1 }).withMessage('Invalid product ID'),
        body('items.*.quantity')
            .isInt({ min: 1 }).withMessage('Quantity must be at least 1'),
        validate
    ],
    addItem: [
        param('id')
            .isInt({ min: 1 }).withMessage('Invalid order ID'),
        body('productId')
            .isInt({ min: 1 }).withMessage('Invalid product ID'),
        body('quantity')
            .isInt({ min: 1 }).withMessage('Quantity must be at least 1'),
        validate
    ],
    getById: [
        param('id')
            .isInt({ min: 1 }).withMessage('Invalid order ID'),
        validate
    ]
};

/**
 * Analytics Validators
 */
const analyticsValidators = {
    daily: [
        query('date')
            .optional()
            .isDate().withMessage('Date must be in YYYY-MM-DD format'),
        validate
    ],
    monthly: [
        query('year')
            .optional()
            .isInt({ min: 2000, max: 2100 }).withMessage('Invalid year'),
        query('month')
            .optional()
            .isInt({ min: 1, max: 12 }).withMessage('Month must be between 1 and 12'),
        validate
    ]
};

module.exports = {
    validate,
    authValidators,
    productValidators,
    orderValidators,
    analyticsValidators
};
