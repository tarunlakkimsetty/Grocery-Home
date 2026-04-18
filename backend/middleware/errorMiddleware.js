/**
 * Global Error Handling Middleware
 */

// 404 Not Found Handler
const notFound = (req, res, next) => {
    const error = new Error(`Not Found - ${req.originalUrl}`);
    res.status(404);
    next(error);
};

// Global Error Handler
const errorHandler = (err, req, res, next) => {
    // Set status code
    const statusCode = res.statusCode >= 400 ? res.statusCode : 500;
    
    // Log error for debugging (in development)
    if (process.env.NODE_ENV !== 'production') {
        console.error('Error:', err.message);
        console.error('Stack:', err.stack);
    }

    res.status(statusCode).json({
        success: false,
        message: err.message,
        stack: process.env.NODE_ENV === 'production' ? null : err.stack
    });
};

module.exports = {
    notFound,
    errorHandler
};
