/**
 * Pricing Display Utilities
 * Formats pricing, discounts, and savings for consistent display across the application
 */

/**
 * Format price for display with 2 decimal places
 * @param {number|string} price - Price value
 * @returns {string} Formatted price (e.g., "₹420.00")
 */
export const formatPrice = (price) => {
  const num = Number(price);
  if (!Number.isFinite(num)) return '₹0.00';
  return `₹${num.toFixed(2)}`;
};

/**
 * Format price value without currency symbol
 * @param {number|string} price - Price value
 * @returns {string} Formatted price (e.g., "420.00")
 */
export const formatPriceValue = (price) => {
  const num = Number(price);
  if (!Number.isFinite(num)) return '0.00';
  return num.toFixed(2);
};

/**
 * Check if a product has a meaningful discount
 * @param {number|string} originalPrice - Original price
 * @param {number|string} discountedPrice - Discounted price
 * @returns {boolean} True if there's a meaningful discount
 */
export const hasDiscount = (originalPrice, discountedPrice) => {
  const orig = Number(originalPrice);
  const disc = Number(discountedPrice);
  return Number.isFinite(orig) && orig > 0 && Number.isFinite(disc) && disc >= 0 && orig > disc && (orig - disc) > 0.01;
};

/**
 * Calculate discount percentage
 * @param {number|string} originalPrice - Original price
 * @param {number|string} discountedPrice - Discounted price
 * @returns {number} Discount percentage (0-100)
 */
export const getDiscountPercentage = (originalPrice, discountedPrice) => {
  const orig = Number(originalPrice);
  const disc = Number(discountedPrice);
  
  if (!Number.isFinite(orig) || orig <= 0) return 0;
  if (!Number.isFinite(disc) || disc < 0) return 0;
  
  const discount = Math.max(0, orig - disc);
  return Math.min(100, Math.round((discount / orig) * 100));
};

/**
 * Calculate savings amount
 * @param {number|string} originalPrice - Original price
 * @param {number|string} discountedPrice - Discounted price
 * @returns {number} Savings amount
 */
export const getSavingsAmount = (originalPrice, discountedPrice) => {
  const orig = Number(originalPrice);
  const disc = Number(discountedPrice);
  
  if (!Number.isFinite(orig) || !Number.isFinite(disc)) return 0;
  
  const savings = orig - disc;
  return Math.round(savings * 100) / 100; // Round to 2 decimal places
};

/**
 * Format discount badge text
 * @param {number|string} originalPrice - Original price
 * @param {number|string} discountedPrice - Discounted price
 * @returns {string|null} Badge text or null if no discount
 */
export const getDiscountBadgeText = (originalPrice, discountedPrice) => {
  if (!hasDiscount(originalPrice, discountedPrice)) return null;
  
  const percentage = getDiscountPercentage(originalPrice, discountedPrice);
  return `${percentage}% OFF`;
};

/**
 * Format savings text for display
 * @param {number|string} originalPrice - Original price
 * @param {number|string} discountedPrice - Discounted price
 * @returns {string|null} Savings text or null if no discount
 */
export const getSavingsText = (originalPrice, discountedPrice) => {
  if (!hasDiscount(originalPrice, discountedPrice)) return null;
  
  const savings = getSavingsAmount(originalPrice, discountedPrice);
  return `Save ₹${savings.toFixed(2)}`;
};

const pricingFormatterUtils = {
  formatPrice,
  formatPriceValue,
  hasDiscount,
  getDiscountPercentage,
  getSavingsAmount,
  getDiscountBadgeText,
  getSavingsText,
};

export default pricingFormatterUtils;
