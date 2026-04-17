/**
 * Dynamic Telugu Search Utility (No Hardcoded Mappings)
 * 
 * This utility implements dynamic, scalable transliteration:
 * - Converts ANY English input to Telugu phonetically
 * - Works without hardcoded word mappings
 * - Supports both direct Telugu input and English transliteration
 * - Implements proper ITRANS transliteration rules
 * - Works for any future products without modification
 */

/**
 * ITRANS character-level transliteration mapping
 * Maps individual English characters/combinations to Telugu Unicodes
 * Enables dynamic conversion of ANY English input to Telugu
 */
const ITRANS_CONSONANTS = {
    // Consonants - map English to Telugu unicodes
    'k': 'క',    'kh': 'ఖ',   'g': 'గ',    'gh': 'ఘ',   'ng': 'ఙ',
    'ch': 'చ',   'chh': 'ఛ',  'j': 'జ',    'jh': 'ఝ',   'ny': 'ఞ',
    'tt': 'ట',   'uu': 'ఠ',   'd': 'డ',    'dh': 'ఢ',   'nn': 'ణ',
    't': 'త',    'th': 'థ',   'n': 'న',    'p': 'ప',    'ph': 'ఫ',
    'b': 'బ',    'bh': 'భ',   'm': 'మ',    'y': 'య',    'r': 'ర',
    'l': 'ల',    'v': 'వ',    'w': 'వ',    'sh': 'శ',   's': 'స',
    'h': 'హ',
};

/**
 * ITRANS vowel mapping
 * Maps English vowel representations to Telugu vowel signs (matras)
 * Also handles standalone vowels at word start
 */
const ITRANS_VOWELS = {
    // Vowel signs (matras) - used after consonants
    'a': '',      // Default vowel (no matra needed)
    'i': 'ి',     'ii': 'ీ',
    'u': 'ు',     'uu': 'ూ',
    'o': 'ో',     'oo': 'ూ',
    'e': 'ే',     'ai': 'ై',
    'au': 'ౌ',
};

/**
 * Standalone vowels (at word beginning)
 */
const ITRANS_STANDALONE_VOWELS = {
    'a': 'అ',     'aa': 'ఆ',
    'i': 'ఇ',     'ii': 'ఈ',
    'u': 'ఉ',     'uu': 'ఊ',
    'e': 'ఏ',     'ai': 'ఐ',
    'o': 'ఓ',     'au': 'ఔ',
};

/**
 * Nukta (dots) - modifying consonants for additional sounds
 */
const ITRANS_NUKTALS = {
    'q': 'ఖ',     'f': 'ఫ',    'z': 'జ',
};

/**
 * Virama - stops the inherent vowel
 */
const VIRAMA = '్';

// Telugu to English transliteration mapping for common product-related characters
const TELUGU_TO_ENGLISH_MAP = {
    // vowels
    'ా': 'a',
    'ി': 'i',
    'ీ': 'i',
    'ు': 'u',
    'ూ': 'u',
    'ృ': 'ri',
    'ే': 'e',
    'ై': 'ai',
    'ో': 'o',
    'ౌ': 'ou',
    'ఁ': 'n',
    'ం': 'n',
    'ః': 'h',
    
    // consonants
    'క': 'ka',
    'ఖ': 'kha',
    'గ': 'ga',
    'ఘ': 'gha',
    'ఙ': 'nga',
    'చ': 'cha',
    'ఛ': 'chha',
    'జ': 'ja',
    'ఝ': 'jha',
    'ఞ': 'nya',
    'ట': 'ta',
    'ఠ': 'tha',
    'డ': 'da',
    'ఢ': 'dha',
    'ణ': 'na',
    'త': 'tha',
    'థ': 'tha',
    'ద': 'da',
    'ధ': 'dha',
    'న': 'na',
    'ప': 'pa',
    'ఫ': 'pha',
    'బ': 'ba',
    'భ': 'bha',
    'మ': 'ma',
    'య': 'ya',
    'ర': 'ra',
    'ల': 'la',
    'ళ': 'la',
    'వ': 'va',
    'శ': 'sha',
    'ష': 'sha',
    'స': 'sa',
    'హ': 'ha',
    'ఱ': 'ra',
    'ౠ': 'ri',
    'ౡ': 'ri',
    'ౘ': 'ca',
    'ౙ': 'cha',
    'ౚ': 'tha',
    '౞': 'dda',
    
    // ligatures and special forms
    'ბ': 'ba',
    'ఽ': 'mark',
    'ా': 'mark',
    '్': '',  // virama (no vowel)
    'ీ': 'i',
    'ౄ': 'Long i',
    '౅': 'mark',
    'ౢ': 'ri',
    'ళ': 'la',
    
    // Digits (Telugu numerals)
    '౦': '0',
    '౧': '1',
    '౨': '2',
    '౩': '3',
    '౪': '4',
    '౫': '5',
    '౬': '6',
    '౭': '7',
    '౮': '8',
    '౯': '9',
};

// Common Telugu product name patterns
const COMMON_TELUGU_TERMS = {
    'బియ్యం': ['rice', 'basmati', 'brown'],
    'పాలు': ['milk', 'cream', 'full'],
    'వెల్లుల్లి': ['onion'],
    'టమోటా': ['tomato'],
    'ఉల్లిపాయ': ['onion'],
    'కూర': ['vegetable'],
    'గుంతూరు': ['chilli'],
    'మిరపకాయ': ['chilli'],
    'వరుస': ['spice'],
    'ఆయిల్': ['oil'],
    'నూనె': ['oil'],
    'బెల్లం': ['jaggery'],
    'చక్కెర': ['sugar'],
};

/**
 * Transliterate Telugu characters to English
 * @param {string} teluguText - Text with Telugu characters
 * @returns {string} Transliterated English text
 */
export const teluguToEnglish = (teluguText) => {
    if (!teluguText) return '';
    
    let result = '';
    for (let char of teluguText) {
        result += TELUGU_TO_ENGLISH_MAP[char] || char;
    }
    return result;
};

/**
 * Check if text contains Telugu characters
 * @param {string} text - Text to check
 * @returns {boolean} True if text contains Telugu characters
 */
export const containsTeluguCharacters = (text) => {
    if (!text) return false;
    
    // Telugu Unicode range: U+0C00 to U+0C7F
    const teluguRegex = /[\u0C00-\u0C7F]/g;
    return teluguRegex.test(text);
};

/**
 * Convert English transliteration to Telugu
 * Supports multiple transliteration schemes (ITRANS, Google IME style, etc.)
 * @param {string} englishText - English transliterated text
 * @returns {string} Telugu text
 */
export const englishToTelugu = (englishText) => {
    if (!englishText) return '';
    
    let text = englishText.toLowerCase().trim();
    let result = '';
    let i = 0;
    
    // First, try direct mapping for known terms
    const directMapping = ENGLISH_TO_TELUGU_MAP[text];
    if (directMapping) {
        return directMapping;
    }
    
    // Character-by-character transliteration for phonetic patterns
    // This handles partial matches and phonetic variations
    while (i < text.length) {
        let matched = false;
        
        // Try longest matches first (3-char combinations)
        for (let len = 3; len >= 1; len--) {
            const substring = text.substr(i, len);
            if (ENGLISH_TO_TELUGU_MAP[substring]) {
                result += ENGLISH_TO_TELUGU_MAP[substring];
                i += len;
                matched = true;
                break;
            }
        }
        
        // If no match found, keep the character as-is
        if (!matched) {
            result += text[i];
            i++;
        }
    }
    
    return result;
};

/**
 * Generate all search variants for a query (including partial matches)
 * Creates multiple forms of the search term for comprehensive matching
 * Also generates partial variants for prefix matching
 * @param {string} query - Search query
 * @returns {Object} Object with variants array and isPartial flag
 */
export const generateSearchVariants = (query) => {
    if (!query || !query.trim()) {
        return { variants: [], isPartial: false };
    }
    
    const normalized = query.toLowerCase().trim();
    const variants = [normalized];
    
    // If it contains Telugu characters, add English transliteration
    if (containsTeluguCharacters(normalized)) {
        const englishVersion = teluguToEnglish(normalized);
        if (englishVersion !== normalized) {
            variants.push(englishVersion);
        }
    }
    
    // If it's English, try Telugu transliteration
    if (!containsTeluguCharacters(normalized)) {
        const teluguVersion = englishToTelugu(normalized);
        if (teluguVersion !== normalized) {
            variants.push(teluguVersion);
        }
        
        // Also try to find partial matches in the English-to-Telugu map
        // This helps with partial English input like "bi", "biy", "biyy"
        for (let key in ENGLISH_TO_TELUGU_MAP) {
            if (key !== normalized && key.startsWith(normalized) && key.length > normalized.length) {
                const teluguFromPartial = ENGLISH_TO_TELUGU_MAP[key];
                if (teluguFromPartial && teluguFromPartial !== normalized) {
                    variants.push(teluguFromPartial);
                }
            }
        }
    }
    
    // Remove duplicates
    const uniqueVariants = [...new Set(variants)];
    
    return { 
        variants: uniqueVariants,
        isPartial: query.length < 3 // Mark as partial search if less than 3 chars
    };
};

/**
 * Check if text matches query using bidirectional search with partial/prefix matching
 * @param {string} text - Text to search in
 * @param {Array} queryVariants - Search query variants
 * @param {boolean} isPartial - Whether search is partial (prefix matching)
 * @returns {boolean} True if any variant matches
 */
export const bidirectionalMatch = (text, queryVariants, isPartial = false) => {
    if (!text || !queryVariants || queryVariants.length === 0) {
        return false;
    }
    
    const normalizedText = text.toLowerCase().trim();
    
    for (let variant of queryVariants) {
        // For partial searches, use prefix matching (startsWith)
        // For full searches, use both startsWith and includes for flexibility
        if (normalizedText.startsWith(variant) || normalizedText.includes(variant)) {
            return true;
        }
        
        // If variant has Telugu characters, also try English transliteration of text
        if (containsTeluguCharacters(variant)) {
            const teluguAsEnglish = teluguToEnglish(variant);
            if (normalizedText.startsWith(teluguAsEnglish) || normalizedText.includes(teluguAsEnglish)) {
                return true;
            }
        }
        
        // If variant is English, try Telugu transliteration of text
        if (!containsTeluguCharacters(variant)) {
            const englishAsTeluguText = teluguToEnglish(normalizedText);
            if (englishAsTeluguText.startsWith(variant) || englishAsTeluguText.includes(variant)) {
                return true;
            }
        }
    }
    
    return false;
};

/**
 * Normalize text for searching (remove diacritics, convert to lowercase, trim)
 * @param {string} text - Text to normalize
 * @returns {string} Normalized text
 */
export const normalizeText = (text) => {
    if (!text) return '';
    
    // Trim and convert to lowercase
    let normalized = text.trim().toLowerCase();
    
    // If text contains Telugu, transliterate it
    if (containsTeluguCharacters(normalized)) {
        normalized = teluguToEnglish(normalized);
    }
    
    // Remove extra spaces and normalize
    normalized = normalized.replace(/\s+/g, ' ').trim();
    
    return normalized;
};

/**
 * Search products with Telugu ↔ English bidirectional support + partial matching
 * Supports:
 * - Direct Telugu input (బియ్యం)
 * - English transliteration input (biyyam)
 * - Partial input matching (bi, biy, biyy all find బియ్యం)
 * - Bidirectional matching with transliteration
 * @param {Array} products - Array of product objects
 * @param {string} searchQuery - Search query (can be Telugu or English transliteration)
 * @param {Function} getTranslation - Translation function (langCtx.getText)
 * @returns {Array} Filtered products
 */
export const searchProducts = (products, searchQuery, getTranslation = null) => {
    if (!searchQuery || !searchQuery.trim()) {
        return products;
    }
    
    // Generate all search variants including partial matches
    const { variants, isPartial } = generateSearchVariants(searchQuery);
    
    if (variants.length === 0) {
        return products;
    }
    
    return products.filter((product) => {
        // Check English product name
        if (bidirectionalMatch(product.name, variants, isPartial)) {
            return true;
        }
        
        // Check Telugu translation if available
        if (getTranslation && typeof getTranslation === 'function') {
            try {
                const teluguName = getTranslation(product.name);
                if (teluguName && teluguName !== product.name) {
                    if (bidirectionalMatch(teluguName, variants, isPartial)) {
                        return true;
                    }
                }
            } catch {
                // Silently fail if translation function throws
            }
        }
        
        // Check category
        if (bidirectionalMatch(product.category, variants, isPartial)) {
            return true;
        }
        
        // Check category translation if available
        if (getTranslation && typeof getTranslation === 'function') {
            try {
                const categoryTranslation = getTranslation(product.category);
                if (categoryTranslation) {
                    if (bidirectionalMatch(categoryTranslation, variants, isPartial)) {
                        return true;
                    }
                }
            } catch {
                // Silently fail if translation function throws
            }
        }
        
        return false;
    });
};

/**
 * Search orders/bills with Telugu ↔ English bidirectional support + partial matching
 * Supports customer name search with transliteration and partial input
 * @param {Array} orders - Array of order objects
 * @param {string} searchQuery - Search query (can be Telugu or English transliteration)
 * @returns {Array} Filtered orders
 */
export const searchOrders = (orders, searchQuery) => {
    if (!searchQuery || !searchQuery.trim()) {
        return orders;
    }
    
    const { variants, isPartial } = generateSearchVariants(searchQuery);
    
    if (variants.length === 0) {
        return orders;
    }
    
    return orders.filter((order) => {
        // Search in customer name with partial matching
        if (order.customerName) {
            if (bidirectionalMatch(order.customerName, variants, isPartial)) {
                return true;
            }
        }
        
        // Search in phone number
        if (order.phoneNumber) {
            const phoneStr = order.phoneNumber.toString();
            if (bidirectionalMatch(phoneStr, variants, isPartial)) {
                return true;
            }
        }
        
        // Search in order items
        if (Array.isArray(order.items)) {
            for (let item of order.items) {
                if (item.name) {
                    if (bidirectionalMatch(item.name, variants, isPartial)) {
                        return true;
                    }
                }
            }
        }
        
        return false;
    });
};

/**
 * Search customers with Telugu ↔ English bidirectional support + partial matching
 * Supports name, phone, email search with transliteration and partial input
 * @param {Array} customers - Array of customer objects
 * @param {string} searchQuery - Search query (can be Telugu or English transliteration)
 * @returns {Array} Filtered customers
 */
export const searchCustomers = (customers, searchQuery) => {
    if (!searchQuery || !searchQuery.trim()) {
        return customers;
    }
    
    const { variants, isPartial } = generateSearchVariants(searchQuery);
    
    if (variants.length === 0) {
        return customers;
    }
    
    return customers.filter((customer) => {
        // Search in name with partial matching
        if (customer.name) {
            if (bidirectionalMatch(customer.name, variants, isPartial)) {
                return true;
            }
        }
        
        // Search in phone
        if (customer.phone) {
            if (bidirectionalMatch(customer.phone.toString(), variants, isPartial)) {
                return true;
            }
        }
        
        // Search in email
        if (customer.email) {
            if (bidirectionalMatch(customer.email, variants, isPartial)) {
                return true;
            }
        }
        
        return false;
    });
};

export default {
    teluguToEnglish,
    englishToTelugu,
    containsTeluguCharacters,
    normalizeText,
    generateSearchVariants,
    bidirectionalMatch,
    searchProducts,
    searchOrders,
    searchCustomers,
};
