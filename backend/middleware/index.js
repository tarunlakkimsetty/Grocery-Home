const authMiddleware = require('./authMiddleware');
const { isAdmin, isCustomer, hasRole } = require('./roleMiddleware');
const { notFound, errorHandler } = require('./errorMiddleware');
const checkOrderNotLocked = require('./orderLockMiddleware');
const { getLogger } = require('./loggerMiddleware');
const { 
    validate, 
    authValidators, 
    productValidators, 
    orderValidators, 
    analyticsValidators 
} = require('./validationMiddleware');

module.exports = {
    // Auth
    authMiddleware,
    protect: authMiddleware,
    
    // Roles
    isAdmin,
    isCustomer,
    hasRole,
    
    // Error handling
    notFound,
    errorHandler,
    
    // Order lock
    checkOrderNotLocked,
    
    // Logging
    getLogger,
    
    // Validation
    validate,
    authValidators,
    productValidators,
    orderValidators,
    analyticsValidators
};
