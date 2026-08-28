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
  return supportsDecimal(unit) ? '0.001' : '1';
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
    // For kg items, round to 3 decimal places
    qty = Math.round(qty * 1000) / 1000;
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
  const { unit = '', stock = 9999 } = options;
  const min = getMinQuantity(unit);
  const allowsDecimal = supportsDecimal(unit);
  const numericStock = Number(stock);
  const safeStock = Number.isFinite(numericStock) && numericStock >= 0 ? numericStock : 9999;
  
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

  const normalizedQty = allowsDecimal
    ? Math.round(qty * 1000) / 1000
    : Math.round(qty);
  
  // Check if decimal when not allowed
  if (!allowsDecimal && qty !== Math.round(qty)) {
    return {
      isValid: false,
      message: `Only integers allowed for ${unit}`,
      correctedValue: normalizedQty
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
  if (qty > safeStock) {
    return {
      isValid: false,
      message: safeStock > 0 ? `Only ${safeStock} items available` : 'Out of stock',
      correctedValue: safeStock
    };
  }
  
  // All valid
  return {
    isValid: true,
    message: '',
    correctedValue: normalizedQty
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
  const { unit = '', stock = 9999 } = options;
  const step = supportsDecimal(unit) ? 0.001 : 1;
  
  let next = current + step;
  
  // Round to avoid floating point issues
  if (supportsDecimal(unit)) {
    next = Math.round(next * 1000) / 1000;
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
  const { unit = '' } = options;
  const min = getMinQuantity(unit);
  const step = supportsDecimal(unit) ? 0.001 : 1;
  
  let prev = current - step;
  
  // Round to avoid floating point issues
  if (supportsDecimal(unit)) {
    prev = Math.round(prev * 1000) / 1000;
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
  if (!quantity && quantity !== 0) return '0';

  const numericValue = Number(quantity);
  if (!Number.isFinite(numericValue)) return '0';

  const formatted = supportsDecimal(unit)
    ? numericValue.toFixed(3).replace(/\.0+$/, '').replace(/(\.\d*?)0+$/, '$1')
    : Math.round(numericValue);

  return unit ? `${formatted} ${unit}` : formatted;
};

const quantityValidator = {
  supportsDecimal,
  getMinQuantity,
  getInputStep,
  formatQuantity,
  validateQuantity,
  getNextQuantity,
  getPreviousQuantity,
  formatForDisplay
};

export default quantityValidator;
