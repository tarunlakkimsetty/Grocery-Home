require('dotenv').config();

/**
 * Centralized Environment Configuration
 * Validates and exports all environment variables
 */

const config = {
    // Server
    env: process.env.NODE_ENV || 'development',
    port: parseInt(process.env.PORT, 10) || 5000,
    
    // Database
    db: {
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        name: process.env.DB_NAME || 'grocery_db',
        connectionLimit: parseInt(process.env.DB_CONNECTION_LIMIT, 10) || 10
    },
    
    // JWT
    jwt: {
        secret: process.env.JWT_SECRET,
        expiresIn: process.env.JWT_EXPIRES_IN || '7d'
    },
    
    // Rate Limiting
    rateLimit: {
        windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS, 10) || 15 * 60 * 1000, // 15 minutes
        maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS, 10) || 100 // 100 requests per window
    },
    
    // CORS
    cors: {
        origin: process.env.CORS_ORIGIN || '*'
    }
};

// Validate required environment variables (JWT_SECRET optional on startup, will be needed for auth)
const requiredVars = [];
const missingVars = requiredVars.filter(varName => !process.env[varName]);

if (missingVars.length > 0) {
    console.warn(`⚠️  Missing environment variables: ${missingVars.join(', ')}`);
}

// Check if JWT_SECRET is set
if (!process.env.JWT_SECRET) {
    console.warn('⚠️  JWT_SECRET not set - authentication routes will fail');
    console.warn('    Set JWT_SECRET in environment variables for production');
}

// Development warnings
if (config.env === 'development') {
    if (config.jwt.secret === 'grocery_billing_secret_key_2026') {
        console.warn('⚠️  Using default JWT secret. Change in production!');
    }
}

// Log configuration on startup
if (process.env.NODE_ENV === 'production' || process.env.DEBUG_CONFIG) {
    console.log('📋 Server Configuration:');
    console.log(`   NODE_ENV: ${config.env}`);
    console.log(`   PORT: ${config.port}`);
    console.log(`   DB_HOST: ${config.db.host}`);
    console.log(`   DB_NAME: ${config.db.name}`);
    console.log(`   JWT_SECRET: ${config.jwt.secret ? '✓ Set' : '✗ Not set'}`);
}

module.exports = config;
