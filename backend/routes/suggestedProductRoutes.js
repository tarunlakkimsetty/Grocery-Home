const express = require('express');
const authMiddleware = require('../middleware/authMiddleware');
const { isAdmin } = require('../middleware/roleMiddleware');
const {
    getSuggestedProducts,
    addSuggestedProduct,
    removeSuggestedProduct,
    checkSuggestedProduct
} = require('../controllers/suggestedProductController');

const createSuggestedProductRouter = ({ requireAdmin = false } = {}) => {
    const router = express.Router();

    router.use(authMiddleware);
    if (requireAdmin) {
        router.use(isAdmin);
    }

    router.get('/:productId/check', checkSuggestedProduct);
    router.get('/check/:productId', checkSuggestedProduct);
    router.get(['', '/'], getSuggestedProducts);

    router.post('/:productId', isAdmin, addSuggestedProduct);
    router.delete('/:productId', isAdmin, removeSuggestedProduct);

    return router;
};

module.exports = createSuggestedProductRouter;
module.exports.createSuggestedProductRouter = createSuggestedProductRouter;