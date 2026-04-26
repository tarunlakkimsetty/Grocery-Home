/**
 * Quantity Validation Utility
 * Enforces strict quantity rules across the application:
 * - Minimum: 1 for unit items, > 0 for kg items
 * - Decimals ONLY for kg products
 * - No zero quantity
 * - Cannot exceed stock
 */

/**
 * Check if product supports decimal quantities
 * @param {string} unit - Product unit (e.g., "kg", "piece", "packet")
 * @returns {boolean} True if decimals are allowed
 */
export const supportsDecimal = (unit) => {
  if (!unit) return false;
  const decimalUnits = ['kg', 'g', 'ml', 'l', 'litre', 'liter'];
  return decimalUnits.includes(unit.toLowerCase());
};

/**
 * Get minimum allowed quantity for a product
 * @param {string} unit - Product unit
 * @returns {number} Minimum quantity (1 for units, 0.1 for kg)
 */
export const getMinQuantity = (unit) => {
  return supportsDecimal(unit) ? 0.1 : 1;
};

/**
 * Get step value for number input
 * @param {string} unit - Product unit
 * @returns {string} Step value ("0.1" for kg, "1" for units)
 */
export const getInputStep = (unit) => {
  return supportsDecimal(unit) ? '0.1' : '1';
};

/**
 * Format quantity based on unit type
 * @param {number} quantity - The quantity to format
 * @param {string} unit - Product unit
 * @returns {number} Formatted quantity
 */
export const formatQuantity = (quantity, unit) => {
  const min = getMinQuantity(unit);
  
  // Convert to number if string
  let qty = Number(quantity) || 0;
  
  // Enforce minimum
  if (qty < min) {
    qty = min;
  }
  
  // If unit doesn't support decimals, round to integer
  if (!supportsDecimal(unit)) {
    qty = Math.round(qty);
  } else {
    // For kg items, round to 1 decimal place
    qty = Math.round(qty * 10) / 10;
  }
  
  return qty;
};

/**
 * Validate quantity value
 * @param {number|string} quantity - The quantity to validate
 * @param {Object} options - Validation options
 * @param {string} options.unit - Product unit
 * @param {number} options.stock - Available stock
 * @returns {Object} Validation result { isValid, message, correctedValue }
 */
export const validateQuantity = (quantity, options = {}) => {
  const { unit = 'piece', stock = 9999 } = options;
  const min = getMinQuantity(unit);
  const allowsDecimal = supportsDecimal(unit);
  
  // Convert to number
  let qty = Number(quantity);
  
  // Check for NaN or empty
  if (isNaN(qty) || quantity === '' || quantity === null || quantity === undefined) {
    return {
      isValid: false,
      message: 'Quantity required',
      correctedValue: min
    };
  }
  
  // Check for negative
  if (qty < 0) {
    return {
      isValid: false,
      message: 'Quantity cannot be negative',
      correctedValue: min
    };
  }
  
  // Check for zero
  if (qty === 0) {
    return {
      isValid: false,
      message: 'Quantity must be greater than 0',
      correctedValue: min
    };
  }
  
  // Check if decimal when not allowed
  if (!allowsDecimal && qty !== Math.round(qty)) {
    return {
      isValid: false,
      message: `Only integers allowed for ${unit}`,
      correctedValue: Math.round(qty)
    };
  }
  
  // Check minimum
  if (qty < min) {
    return {
      isValid: false,
      message: `Minimum quantity is ${min}`,
      correctedValue: min
    };
  }
  
  // Check stock limit
  if (qty > stock) {
    return {
      isValid: false,
      message: `Only ${stock} available`,
      correctedValue: stock
    };
  }
  
  // All valid
  return {
    isValid: true,
    message: '',
    correctedValue: qty
  };
};

/**
 * Calculate next quantity on increment
 * @param {number} current - Current quantity
 * @param {Object} options - Options
 * @param {string} options.unit - Product unit
 * @param {number} options.stock - Available stock
 * @returns {number} Next quantity
 */
export const getNextQuantity = (current, options = {}) => {
  const { unit = 'piece', stock = 9999 } = options;
  const step = supportsDecimal(unit) ? 0.1 : 1;
  
  let next = current + step;
  
  // Round to avoid floating point issues
  if (supportsDecimal(unit)) {
    next = Math.round(next * 10) / 10;
  }
  
  // Respect stock limit
  return Math.min(next, stock);
};

/**
 * Calculate previous quantity on decrement
 * @param {number} current - Current quantity
 * @param {Object} options - Options
 * @param {string} options.unit - Product unit
 * @returns {number} Previous quantity (never goes below minimum)
 */
export const getPreviousQuantity = (current, options = {}) => {
  const { unit = 'piece' } = options;
  const min = getMinQuantity(unit);
  const step = supportsDecimal(unit) ? 0.1 : 1;
  
  let prev = current - step;
  
  // Round to avoid floating point issues
  if (supportsDecimal(unit)) {
    prev = Math.round(prev * 10) / 10;
  }
  
  // Never go below minimum
  return Math.max(prev, min);
};

/**
 * Format quantity for display
 * @param {number} quantity - The quantity
 * @param {string} unit - Product unit
 * @returns {string} Formatted display string (e.g., "0.5 kg")
 */
export const formatForDisplay = (quantity, unit) => {
  if (!quantity) return '0';
  
  const formatted = supportsDecimal(unit) 
    ? Number(quantity).toFixed(1)
    : Math.round(quantity);
  
  return unit ? `${formatted} ${unit}` : formatted;
};

export default {
  supportsDecimal,
  getMinQuantity,
  getInputStep,
  formatQuantity,
  validateQuantity,
  getNextQuantity,
  getPreviousQuantity,
  formatForDisplay
};
