/**
 * Product filter utilities
 * Centralized logic for price and discount filtering across the application
 */

import { getDiscountPercentage } from './pricingFormatter';

/**
 * Get the effective (actual selling) price of a product
 * This is the price customers actually pay
 * 
 * Priority:
 * 1. discountedPrice (if available)
 * 2. price (fallback)
 * 3. originalPrice (fallback if no price)
 * 
 * @param {object} product - Product object
 * @returns {number} Effective price (0 if invalid)
 */
export const getEffectivePrice = (product) => {
  if (!product) return 0;
  
  // Try discountedPrice first (most accurate for sale price)
  if (Number.isFinite(Number(product.discountedPrice))) {
    const price = Number(product.discountedPrice);
    if (price >= 0) return price;
  }
  
  // Fallback to price field
  if (Number.isFinite(Number(product.price))) {
    const price = Number(product.price);
    if (price >= 0) return price;
  }
  
  // Last resort: originalPrice
  if (Number.isFinite(Number(product.originalPrice))) {
    const price = Number(product.originalPrice);
    if (price >= 0) return price;
  }
  
  return 0;
};

/**
 * Get the original/marked price of a product
 * Used for comparison and discount calculation
 * 
 * Priority:
 * 1. originalPrice (if available)
 * 2. price (fallback)
 * 
 * @param {object} product - Product object
 * @returns {number} Original price (0 if invalid)
 */
export const getOriginalPrice = (product) => {
  if (!product) return 0;
  
  if (Number.isFinite(Number(product.originalPrice))) {
    const price = Number(product.originalPrice);
    if (price >= 0) return price;
  }
  
  if (Number.isFinite(Number(product.price))) {
    const price = Number(product.price);
    if (price >= 0) return price;
  }
  
  return 0;
};

/**
 * Get a safe, rounded discount percentage for a product.
 * Missing price fields fall back to the product's regular price.
 */
export const getDiscountPercent = (product) => {
  if (!product) return 0;

  const originalPrice = product.originalPrice ?? product.price;
  const discountedPrice = product.discountedPrice ?? product.price;
  const original = Number(originalPrice);
  const discounted = Number(discountedPrice);

  if (!Number.isFinite(original) || original <= 0 || !Number.isFinite(discounted) || discounted < 0) {
    return 0;
  }

  return getDiscountPercentage(original, Math.min(original, discounted));
};

/**
 * Calculate min and max price range from a list of products
 * Returns the actual selling prices (effective prices)
 * 
 * @param {array} products - Array of product objects
 * @returns {object} { min: number, max: number, count: number }
 */
export const getPriceRange = (products) => {
  // Safety check
  const safeProducts = Array.isArray(products) ? products.filter(p => p) : [];
  
  if (safeProducts.length === 0) {
    return { min: 0, max: 1000, count: 0 };
  }
  
  // Get effective prices from all products
  const prices = safeProducts
    .map(product => getEffectivePrice(product))
    .filter(price => Number.isFinite(price) && price >= 0);
  
  // If no valid prices found, return default range
  if (prices.length === 0) {
    return { min: 0, max: 1000, count: safeProducts.length };
  }
  
  // Calculate min and max
  const min = Math.min(...prices);
  const max = Math.max(...prices);
  
  // Handle edge case where all products have same price
  if (min === max) {
    return {
      min: Math.max(0, min - 100),
      max: max + 100,
      count: safeProducts.length,
    };
  }
  
  return { min, max, count: safeProducts.length };
};

/**
 * Filter products by price range
 * Uses effective (selling) price for filtering
 * 
 * @param {array} products - Array of products to filter
 * @param {number} minPrice - Minimum price (inclusive)
 * @param {number} maxPrice - Maximum price (inclusive)
 * @returns {array} Filtered products
 */
export const filterByPrice = (products, minPrice, maxPrice) => {
  // Input validation
  const safeProducts = Array.isArray(products) ? products : [];
  const min = Number.isFinite(Number(minPrice)) ? Number(minPrice) : 0;
  const max = Number.isFinite(Number(maxPrice)) ? Number(maxPrice) : 999999;
  
  // Ensure min <= max
  const normalizedMin = Math.min(min, max);
  const normalizedMax = Math.max(min, max);
  
  return safeProducts.filter(product => {
    const effectivePrice = getEffectivePrice(product);
    return effectivePrice >= normalizedMin && effectivePrice <= normalizedMax;
  });
};

/**
 * Get the available discount percentage range for a product list.
 * The minimum remains 0 so full-price products can be included.
 */
export const getDiscountRange = (products) => {
  const safeProducts = Array.isArray(products) ? products : [];
  const discounts = safeProducts
    .map(getDiscountPercent)
    .filter((discount) => Number.isFinite(discount) && discount >= 0 && discount <= 100);

  return {
    min: 0,
    max: discounts.length > 0 ? Math.max(...discounts) : 0,
    count: safeProducts.length,
    hasDiscount: discounts.some((discount) => discount > 0),
  };
};

/**
 * Filter products by calculated discount percentage, inclusive.
 */
export const filterByDiscount = (products, minDiscount, maxDiscount) => {
  const safeProducts = Array.isArray(products) ? products : [];
  const min = Number.isFinite(Number(minDiscount)) ? Math.max(0, Number(minDiscount)) : 0;
  const max = Number.isFinite(Number(maxDiscount)) ? Math.min(100, Number(maxDiscount)) : 100;
  const normalizedMin = Math.min(min, max);
  const normalizedMax = Math.max(min, max);

  return safeProducts.filter((product) => {
    const discount = getDiscountPercent(product);
    return discount >= normalizedMin && discount <= normalizedMax;
  });
};

/**
 * Apply combined filters: category, search, and price
 * Complete filtering pipeline
 * 
 * @param {array} products - All products
 * @param {string} category - Category name (or empty for all)
 * @param {string} searchQuery - Search query (or empty for none)
 * @param {number} minPrice - Minimum price
 * @param {number} maxPrice - Maximum price
 * @param {function} searchFunction - Function to perform search (takes products, query, returns filtered)
 * @returns {array} Filtered products
 */
export const applyAllFilters = (products, category, searchQuery, minPrice, maxPrice, searchFunction) => {
  let filtered = Array.isArray(products) ? [...products] : [];
  
  // Step 1: Category filter
  if (category && category !== 'ALL' && category !== '') {
    filtered = filtered.filter(p => p.category === category);
  }
  
  // Step 2: Search filter
  if (searchQuery && searchQuery.trim() && searchFunction) {
    filtered = searchFunction(filtered, searchQuery);
  }
  
  // Step 3: Price filter
  if (Number.isFinite(minPrice) && Number.isFinite(maxPrice)) {
    filtered = filterByPrice(filtered, minPrice, maxPrice);
  }
  
  return filtered;
};

/**
 * Format price range display
 * Converts numbers to readable format with currency
 * 
 * @param {number} min - Minimum price
 * @param {number} max - Maximum price
 * @returns {object} { minText: string, maxText: string, rangeText: string }
 */
export const formatPriceRange = (min, max) => {
  const minNum = Number.isFinite(Number(min)) ? Number(min) : 0;
  const maxNum = Number.isFinite(Number(max)) ? Number(max) : 0;
  
  return {
    minText: `₹${Math.round(minNum)}`,
    maxText: `₹${Math.round(maxNum)}`,
    rangeText: `₹${Math.round(minNum)} — ₹${Math.round(maxNum)}`,
  };
};

/**
 * Validate price range values
 * Ensures min and max are valid and min <= max
 * 
 * @param {number} min - Minimum price
 * @param {number} max - Maximum price
 * @returns {boolean} True if valid
 */
export const isValidPriceRange = (min, max) => {
  if (!Number.isFinite(min) || !Number.isFinite(max)) return false;
  if (min < 0 || max < 0) return false;
  if (min > max) return false;
  return true;
};

/**
 * Get default/full price range for a set of products
 * Useful for reset button
 * 
 * @param {array} products - Products to analyze
 * @returns {object} { min: number, max: number }
 */
export const getFullPriceRange = (products) => {
  const { min, max } = getPriceRange(products);
  return { min, max };
};

const priceFilterUtils = {
  getEffectivePrice,
  getOriginalPrice,
  getDiscountPercent,
  getPriceRange,
  filterByPrice,
  getDiscountRange,
  filterByDiscount,
  applyAllFilters,
  formatPriceRange,
  isValidPriceRange,
  getFullPriceRange,
};

export default priceFilterUtils;
