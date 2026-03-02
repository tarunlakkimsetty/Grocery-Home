const express = require('express');
const router = express.Router();

const { protect, isAdmin } = require('../middleware');
const {
    getAdminCustomers,
    getAdminCustomerById,
} = require('../controllers/customerController');

// All routes require admin authentication
router.use(protect);
router.use(isAdmin);

// GET /api/admin/customers
router.get('/', getAdminCustomers);

// GET /api/admin/customers/:id
router.get('/:id', getAdminCustomerById);

module.exports = router;
