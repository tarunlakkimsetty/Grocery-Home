const express = require('express');
const router = express.Router();
const {
    createProduct,
    getProducts,
    getProductsByCategory,
    getProduct,
    updateProduct,
    updateStock,
    deleteProduct,
    getCategories
} = require('../controllers/productController');
const authMiddleware = require('../middleware/authMiddleware');
const { isAdmin } = require('../middleware/roleMiddleware');
const { productValidators } = require('../middleware/validationMiddleware');

// Public routes
router.get('/', getProducts);
router.get('/categories', getCategories);
router.get('/category/:category', getProductsByCategory);
router.get('/:id', productValidators.getById, getProduct);

// Admin only routes
router.post('/', authMiddleware, isAdmin, productValidators.create, createProduct);
router.put('/:id', authMiddleware, isAdmin, productValidators.update, updateProduct);
router.patch('/:id/stock', authMiddleware, isAdmin, productValidators.updateStock, updateStock);
router.delete('/:id', authMiddleware, isAdmin, productValidators.getById, deleteProduct);

module.exports = router;
