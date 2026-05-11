const express = require('express');
const multer = require('multer');
const authMiddleware = require('../middleware/authMiddleware');
const { isAdmin } = require('../middleware/roleMiddleware');
const OrderImageController = require('../controllers/orderImageController');

const router = express.Router();

const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 10 * 1024 * 1024,
        files: 20,
    },
    fileFilter: (req, file, cb) => {
        const allowedMimes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/heic', 'image/heif'];
        if (allowedMimes.includes(file.mimetype)) {
            cb(null, true);
            return;
        }

        cb(new Error('Invalid file type. Only images are allowed.'));
    },
});

const handleUpload = (req, res, next) => {
    upload.array('images', 20)(req, res, (err) => {
        if (err) {
            return res.status(400).json({
                success: false,
                message: err.message || 'File upload failed',
            });
        }

        next();
    });
};

router.get('/', authMiddleware, OrderImageController.getOrderImages);
router.post('/', authMiddleware, isAdmin, handleUpload, OrderImageController.uploadOrderImages);
router.delete('/:id', authMiddleware, isAdmin, OrderImageController.deleteOrderImage);

module.exports = router;