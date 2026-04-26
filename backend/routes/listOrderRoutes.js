const express = require('express');
const multer = require('multer');
const ListOrderController = require('../controllers/listOrderController');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

// Configure multer for image uploads
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    const allowedMimes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only images are allowed.'));
    }
  }
});

// Multer error handler wrapper
const handleMulterUpload = (req, res, next) => {
  upload.array('images', 10)(req, res, (err) => {
    if (err) {
      console.error('Multer error:', err.message);
      return res.status(400).json({ error: err.message || 'File upload error' });
    }
    next();
  });
};

// Authenticated routes (logged-in customers only) - SPECIFIC ROUTES FIRST
router.post('/upload', authMiddleware, handleMulterUpload, ListOrderController.uploadImage);
router.post('/my-uploads', authMiddleware, ListOrderController.getCustomerUploads);

// Protected routes (admin only) - SPECIFIC ROUTES FIRST, THEN GENERIC /:id LAST
router.get('/pending-count', authMiddleware, ListOrderController.getPendingCount);
router.get('/recent', authMiddleware, ListOrderController.getRecentListOrders);
router.get('/', authMiddleware, ListOrderController.getAllListOrders);
router.get('/:id', authMiddleware, ListOrderController.getListOrderById);
router.patch('/:id/status', authMiddleware, ListOrderController.updateListOrderStatus);
router.delete('/:id', authMiddleware, ListOrderController.deleteListOrder);

module.exports = router;
