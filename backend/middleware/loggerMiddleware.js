const morgan = require('morgan');

/**
 * Request Logger Middleware
 * Uses morgan for HTTP request logging
 * Format changes based on environment
 */

// Custom token for response time in ms
morgan.token('response-time-ms', (req, res) => {
    const time = morgan['response-time'](req, res);
    return time ? `${time}ms` : '-';
});

// Development format - colorful and detailed
const devFormat = ':method :url :status :response-time ms - :res[content-length]';

// Production format - combined (Apache-like)
const prodFormat = ':remote-addr - :remote-user [:date[clf]] ":method :url HTTP/:http-version" :status :res[content-length] ":referrer" ":user-agent"';

/**
 * Get logger middleware based on environment
 * @param {string} env - Environment (development/production)
 * @returns {Function} Morgan middleware
 */
const getLogger = (env) => {
    if (env === 'production') {
        return morgan(prodFormat);
    }
    return morgan(devFormat);
};

module.exports = { getLogger };
