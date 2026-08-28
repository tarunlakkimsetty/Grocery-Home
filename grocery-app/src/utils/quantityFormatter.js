import { supportsDecimal } from './quantityValidator';

/**
 * Format quantity value for display, removing unnecessary trailing zeros
 * while preserving meaningful decimal precision
 * 
 * @param {number|string} quantity - The quantity value to format
 * @param {string} [unit=''] - Product unit (kg, piece, pack, etc.)
 * @returns {string} Formatted quantity with unit (e.g., "1.5 KG", "2 PACK")
 * 
 * Examples:
 * - formatQuantity(1.000, 'kg') → "1 kg"
 * - formatQuantity(2.500, 'kg') → "2.5 kg"
 * - formatQuantity(0.500, 'kg') → "0.5 kg"
 * - formatQuantity(0.107, 'kg') → "0.107 kg"
 * - formatQuantity(1, 'pack') → "1 pack"
 * - formatQuantity(1.5, 'pack') → "1.5 pack" (may be invalid but formats anyway)
 */
const formatQuantity = (quantity, unit) => {
    const u = String(unit || '').trim().toLowerCase();
    const isDecimal = supportsDecimal(u);
    
    // Handle non-numeric values
    if (!Number.isFinite(Number(quantity))) {
        return u ? `0 ${u}` : '0';
    }
    
    const num = Number(quantity);
    
    if (isDecimal) {
        // For decimal units (kg, ml, l, g):
        // Round to 3 decimal places, then remove trailing zeros
        let formatted = num.toFixed(3).replace(/\.?0+$/, '');
        
        // If it becomes a whole number, ensure no decimal point
        if (!formatted.includes('.')) {
            formatted = String(Math.round(num));
        } else {
            // Remove trailing zeros after decimal, but keep at least one decimal if needed
            formatted = formatted.replace(/0+$/, '').replace(/\.$/, '');
        }
        
        return u ? `${formatted} ${u}` : `${formatted}`;
    }
    
    // For non-decimal units (pack, piece, piece, etc.):
    // Always show as integer, no decimals
    const intForm = Math.round(num).toString();
    return u ? `${intForm} ${u}` : `${intForm}`;
};

export default formatQuantity;
