const SuggestedProduct = require('../models/suggestedProductModel');
const Product = require('../models/productModel');

const getSuggestedProducts = async (req, res, next) => {
    try {
        const suggestedProducts = await SuggestedProduct.getAll();
        res.status(200).json({
            success: true,
            suggestedProducts
        });
    } catch (error) {
        next(error);
    }
};

const addSuggestedProduct = async (req, res, next) => {
    try {
        const { productId } = req.params;
        const createdBy = req.user?.id;

        if (!createdBy) {
            return res.status(401).json({ success: false, message: 'Unauthorized. Please log in.' });
        }

        const productIdNum = parseInt(productId);
        if (!Number.isInteger(productIdNum) || productIdNum <= 0) {
            return res.status(400).json({ success: false, message: 'Invalid product ID' });
        }

        const product = await Product.findById(productIdNum);
        if (!product) {
            return res.status(404).json({ success: false, message: 'Product not found' });
        }

        const result = await SuggestedProduct.add(productIdNum, createdBy);
        res.status(result.alreadyExists ? 200 : 201).json({
            success: true,
            message: result.alreadyExists ? 'Product is already suggested' : 'Product marked as suggested',
            suggestion: result
        });
    } catch (error) {
        next(error);
    }
};

const removeSuggestedProduct = async (req, res, next) => {
    try {
        const { productId } = req.params;
        const createdBy = req.user?.id;

        if (!createdBy) {
            return res.status(401).json({ success: false, message: 'Unauthorized. Please log in.' });
        }

        const productIdNum = parseInt(productId);
        if (!Number.isInteger(productIdNum) || productIdNum <= 0) {
            return res.status(400).json({ success: false, message: 'Invalid product ID' });
        }

        const removed = await SuggestedProduct.remove(productIdNum);

        if (!removed) {
            return res.status(404).json({ success: false, message: 'Suggestion not found' });
        }

        res.status(200).json({
            success: true,
            message: 'Suggestion removed successfully'
        });
    } catch (error) {
        next(error);
    }
};

const checkSuggestedProduct = async (req, res, next) => {
    try {
        const { productId } = req.params;
        const productIdNum = parseInt(productId);

        if (!Number.isInteger(productIdNum) || productIdNum <= 0) {
            return res.status(400).json({ success: false, message: 'Invalid product ID' });
        }

        const isSuggested = await SuggestedProduct.isSuggested(productIdNum);
        res.status(200).json({ success: true, isSuggested });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getSuggestedProducts,
    addSuggestedProduct,
    removeSuggestedProduct,
    checkSuggestedProduct
};
