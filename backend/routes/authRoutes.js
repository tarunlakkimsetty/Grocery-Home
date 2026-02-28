const express = require('express');
const router = express.Router();
const { register, login, getMe } = require('../controllers/authController');
const authMiddleware = require('../middleware/authMiddleware');
const { authValidators } = require('../middleware/validationMiddleware');

// Public routes
router.post('/register', authValidators.register, register);
router.post('/login', authValidators.login, login);

// Protected routes
router.get('/me', authMiddleware, getMe);

module.exports = router;
