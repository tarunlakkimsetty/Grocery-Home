/**
 * Async Handler Wrapper
 * Wraps async functions to automatically catch errors and pass to next()
 * Eliminates the need for try-catch blocks in every controller
 */
const asyncHandler = (fn) => (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = asyncHandler;
