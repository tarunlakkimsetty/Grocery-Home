const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const config = require('./config/config');
const { notFound, errorHandler } = require('./middleware/errorMiddleware');
const { getLogger } = require('./middleware/loggerMiddleware');

// Import routes
const authRoutes = require('./routes/authRoutes');
const productRoutes = require('./routes/productRoutes');
const orderRoutes = require('./routes/orderRoutes');
const analyticsRoutes = require('./routes/analyticsRoutes');
const billRoutes = require('./routes/billRoutes');
const customerRoutes = require('./routes/customerRoutes');
const userRoutes = require('./routes/userRoutes');
const feedbackRoutes = require('./routes/feedbackRoutes');

const app = express();

// ============================================
// CORS - MUST BE FIRST (before any other middleware)
// ============================================
const corsOptions = {
    origin: function (origin, callback) {
        // Allow requests with no origin (mobile apps, curl, Postman)
        const allowedOrigins = ['http://localhost:3000', 'http://127.0.0.1:3000'];
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else if (config.env === 'development') {
            // Allow all origins in development
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
    exposedHeaders: ['Content-Length', 'X-Request-Id'],
    maxAge: 86400 // 24 hours - cache preflight response
};
app.use(cors(corsOptions));

// ============================================
// Security middleware (after CORS)
// ============================================
app.use(helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// ============================================
// Rate limiting - relaxed for development
// ============================================
const limiter = rateLimit({
    windowMs: config.env === 'development' ? 1 * 60 * 1000 : config.rateLimit.windowMs, // 1 min in dev
    max: config.env === 'development' ? 1000 : config.rateLimit.maxRequests, // 1000 in dev
    message: {
        success: false,
        message: 'Too many requests, please try again later.'
    },
    standardHeaders: true,
    legacyHeaders: false,
    skip: (req) => config.env === 'development' && req.path === '/api/products' // Skip for products in dev
});
app.use('/api', limiter);

// Request logging
app.use(getLogger(config.env));

// Body parsers
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// Health check route
app.get('/', (req, res) => {
    res.json({ message: 'Grocery Billing System API is running' });
});

// ============================================
// API Routes
// ============================================
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/user', userRoutes);
app.use('/api/admin/analytics', analyticsRoutes);
app.use('/api/admin/customers', customerRoutes);
app.use('/api/bills', billRoutes);
app.use('/api/feedback', feedbackRoutes);

// Error handling middleware (must be last)
app.use(notFound);
app.use(errorHandler);

module.exports = app;
