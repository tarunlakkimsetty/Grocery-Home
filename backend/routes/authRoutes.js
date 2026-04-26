const express = require('express');
const router = express.Router();
const { register, login, getMe, verifyPhoneForReset, verifySecurityAnswers, resetPassword } = require('../controllers/authController');
const authMiddleware = require('../middleware/authMiddleware');
const { authValidators } = require('../middleware/validationMiddleware');

// Public routes
router.post('/register', authValidators.register, register);
router.post('/login', authValidators.login, login);

// Password reset routes (public - no auth required)
router.post('/forgot-password/verify-phone', verifyPhoneForReset);
router.post('/forgot-password/verify-answers', verifySecurityAnswers);
router.post('/forgot-password/reset', resetPassword);

// Protected routes
router.get('/me', authMiddleware, getMe);

module.exports = router;
