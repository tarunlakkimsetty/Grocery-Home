const Product = require('../models/productModel');
const { promisePool } = require('../config/db');
const { calculatePricing } = require('../utils/pricing');

const parseProductPricing = (body, existing = null) => {
    const originalPrice = body.originalPrice ?? existing?.originalPrice ?? existing?.price ?? body.price;
    const discountedPrice = body.discountedPrice ?? existing?.discountedPrice ?? body.price ?? existing?.price;
    const pricing = calculatePricing({ originalPrice, discountedPrice });
    if (!Number.isFinite(Number(originalPrice)) || Number(originalPrice) < 0) throw new Error('Original price must be a non-negative number');
    if (!Number.isFinite(Number(discountedPrice)) || Number(discountedPrice) < 0) throw new Error('Discounted price must be a non-negative number');
    if (Number(discountedPrice) > Number(originalPrice)) throw new Error('Discounted price cannot be greater than original price');
    return pricing;
};

/**
 * @desc    Create new product
 * @route   POST /api/products
 * @access  Admin only
 */
const createProduct = async (req, res, next) => {
    try {
        console.log('=== createProduct called ==');
        console.log('req.body:', JSON.stringify(req.body, null, 2));
        
        const { name, category, price, originalPrice, discountedPrice, stock, unit, emoji, freeItemName, freeItemQuantity, freeItemUnit, freeItemDescription, freeItemActive } = req.body;

        // Validate name: 2-100 characters
        if (!name || typeof name !== 'string' || name.trim().length < 2 || name.trim().length > 100) {
            return res.status(400).json({
                success: false,
                message: 'Name must be 2-100 characters'
            });
        }

        // Validate category
        if (!category || typeof category !== 'string' || category.trim().length < 2) {
            return res.status(400).json({
                success: false,
                message: 'Category is required'
            });
        }

        // Validate price: must be >= 1
        let pricing;
        try { pricing = parseProductPricing({ price, originalPrice, discountedPrice }); } catch (error) {
            return res.status(400).json({
                success: false,
                message: error.message
            });
        }

        // Validate stock: must be non-negative integer
        const stockNum = Number(stock);
        if (stock === undefined || isNaN(stockNum) || stockNum < 0 || !Number.isInteger(stockNum)) {
            return res.status(400).json({
                success: false,
                message: 'Stock must be a non-negative integer'
            });
        }

        // Create product
        const product = await Product.create({
            name: name.trim(),
            category: category.trim(),
            ...pricing,
            stock: stockNum,
            unit: unit || 'pack',
            emoji: emoji || '📦',
            freeItemName, freeItemQuantity, freeItemUnit, freeItemDescription, freeItemActive
        });

        console.log('Product created:', product);

        res.status(201).json({
            success: true,
            message: 'Product created successfully',
            product
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Get all products with pagination
 * @route   GET /api/products
 * @access  Public
 */
const getProducts = async (req, res, next) => {
    try {
        const { page = 1, limit = 50, category } = req.query;

        const result = await Product.findAll({
            page: parseInt(page),
            limit: parseInt(limit),
            category: category || null
        });

        res.status(200).json({
            success: true,
            ...result
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Get products by category
 * @route   GET /api/products/category/:category
 * @access  Public
 */
const getProductsByCategory = async (req, res, next) => {
    try {
        const { category } = req.params;

        const products = await Product.findByCategory(category);

        res.status(200).json({
            success: true,
            count: products.length,
            products
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Get single product
 * @route   GET /api/products/:id
 * @access  Public
 */
const getProduct = async (req, res, next) => {
    try {
        const { id } = req.params;

        const product = await Product.findById(id);

        if (!product) {
            return res.status(404).json({
                success: false,
                message: 'Product not found'
            });
        }

        res.status(200).json({
            success: true,
            product
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Update product
 * @route   PUT /api/products/:id
 * @access  Admin only
 */
const updateProduct = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { name, category, price, originalPrice, discountedPrice, stock, unit, freeItemName, freeItemQuantity, freeItemUnit, freeItemDescription, freeItemActive } = req.body;

        // Check if product exists
        const existingProduct = await Product.findById(id);
        if (!existingProduct) {
            return res.status(404).json({
                success: false,
                message: 'Product not found'
            });
        }

        // Validate price if provided
        let pricing;
        try { pricing = parseProductPricing({ price, originalPrice, discountedPrice }, existingProduct); } catch (error) {
            return res.status(400).json({ success: false, message: error.message });
        }

        // Validate stock if provided
        if (stock !== undefined) {
            const stockNum = Number(stock);
            if (!Number.isFinite(stockNum) || stockNum < 0 || !Number.isInteger(stockNum)) {
                return res.status(400).json({
                    success: false,
                    message: 'Stock must be a non-negative integer'
                });
            }
        }

        // Update product
        const updated = await Product.update(id, {
            name: name || existingProduct.name,
            category: category || existingProduct.category,
            ...pricing,
            stock: stock !== undefined ? parseInt(stock) : existingProduct.stock,
            unit: unit !== undefined ? String(unit).trim() || existingProduct.unit : existingProduct.unit,
            freeItemName: freeItemName !== undefined ? freeItemName : existingProduct.freeItemName,
            freeItemQuantity: freeItemQuantity !== undefined ? freeItemQuantity : existingProduct.freeItemQuantity,
            freeItemUnit: freeItemUnit !== undefined ? freeItemUnit : existingProduct.freeItemUnit,
            freeItemDescription: freeItemDescription !== undefined ? freeItemDescription : existingProduct.freeItemDescription,
            freeItemActive: freeItemActive !== undefined ? freeItemActive : existingProduct.freeItemActive,
        });

        if (!updated) {
            return res.status(500).json({
                success: false,
                message: 'Failed to update product'
            });
        }

        const updatedProduct = await Product.findById(id);

        res.status(200).json({
            success: true,
            message: 'Product updated successfully',
            product: updatedProduct
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Update product stock
 * @route   PATCH /api/products/:id/stock
 * @access  Admin only
 */
const updateStock = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { stock } = req.body;

        if (stock === undefined || isNaN(stock) || parseInt(stock) < 0) {
            return res.status(400).json({
                success: false,
                message: 'Please provide a valid stock quantity'
            });
        }

        // Check if product exists
        const existingProduct = await Product.findById(id);
        if (!existingProduct) {
            return res.status(404).json({
                success: false,
                message: 'Product not found'
            });
        }

        const updated = await Product.updateStock(id, parseInt(stock));

        if (!updated) {
            return res.status(500).json({
                success: false,
                message: 'Failed to update stock'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Stock updated successfully',
            stock: parseInt(stock)
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Delete product
 * @route   DELETE /api/products/:id
 * @access  Admin only
 */
const deleteProduct = (req, res) => {
    const productId = req.params.id;

    if (!productId) {
        return res.status(400).json({ message: 'Product ID required' });
    }

    const query = 'DELETE FROM products WHERE id = ?';

    promisePool
        .query(query, [productId])
        .then(([result]) => {
            if (result.affectedRows === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'Product not found'
                });
            }

            res.status(200).json({
                success: true,
                message: 'Product deleted successfully'
            });
        })
        .catch((err) => {
            // Common case: product is referenced by order_items / bill_items
            if (err.code === 'ER_ROW_IS_REFERENCED_2') {
                return res.status(409).json({
                    success: false,
                    message: 'Cannot delete product: it is referenced by existing orders/bills'
                });
            }

            console.error('Delete Error:', err);
            return res.status(500).json({
                success: false,
                message: 'Database delete failed'
            });
        });
};

/**
 * @desc    Get all categories
 * @route   GET /api/products/categories
 * @access  Public
 */
const getCategories = async (req, res, next) => {
    try {
        const categories = await Product.getCategories();

        res.status(200).json({
            success: true,
            count: categories.length,
            categories
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    createProduct,
    getProducts,
    getProductsByCategory,
    getProduct,
    updateProduct,
    updateStock,
    deleteProduct,
    getCategories
};
