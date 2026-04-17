/**
 * ENHANCED TELUGU SEARCH UTILITY
 * 
 * Features:
 * - Searches both name_en and name_te (all product fields)
 * - Dynamic ITRANS transliteration (no hardcoded words)
 * - Partial matching support (bi, biy, biyyam)
 * - Priority-based sorting (exact > startsWith > includes > transliteration)
 * - Bidirectional English ↔ Telugu matching
 */

// ============================================================================
// ITRANS TRANSLITERATION MAPS - Character Level
// ============================================================================

const CONSONANTS_MAP = {
    'kh': 'ఖ',   'gh': 'ఘ',   'ng': 'ఙ',   'ch': 'చ',   'chh': 'ఛ',
    'j': 'జ',    'jh': 'ఝ',   'ny': 'ఞ',   'tt': 'ట',   'th': 'థ',
    'dh': 'ఢ',   'nn': 'ణ',   'sh': 'శ',   'ss': 'ష',
    'k': 'క',    'g': 'గ',    'c': 'చ',    'd': 'డ',    't': 'త',
    'n': 'న',    'p': 'ప',    'ph': 'ఫ',   'b': 'బ',    'bh': 'భ',
    'm': 'మ',    'y': 'య',    'r': 'ర',    'l': 'ల',    'v': 'వ',
    'w': 'వ',    's': 'స',    'h': 'హ',    'z': 'జ',    'f': 'ఫ',
};

const VOWEL_MATRAS = {
    'aa': 'ా',   'ii': 'ీ',   'uu': 'ూ',   'ai': 'ై',   'au': 'ౌ',
    'i': 'ి',    'u': 'ు',    'e': 'ే',    'o': 'ో',    'a': '',
};

const VOWELS_START = {
    'aa': 'ఆ',   'ii': 'ఈ',   'uu': 'ఊ',   'ai': 'ఐ',   'au': 'ఔ',
    'a': 'అ',    'i': 'ఇ',    'u': 'ఉ',    'e': 'ఏ',    'o': 'ఓ',
};

const TELUGU_REVERSE = {
    // Vowels
    'అ': 'a',    'ఆ': 'aa',   'ఇ': 'i',    'ఈ': 'ii',   'ఉ': 'u',
    'ఊ': 'uu',   'ఋ': 'ri',   'ఏ': 'e',    'ఐ': 'ai',   'ఓ': 'o',
    'ఔ': 'au',
    // Matras
    'ా': 'aa',   'ి': 'i',    'ీ': 'ii',   'ు': 'u',    'ూ': 'uu',
    'ె': 'e',    'ే': 'e',    'ై': 'ai',   'ో': 'o',    'ౌ': 'au',
    // Consonants
    'క': 'k',    'ఖ': 'kh',   'గ': 'g',    'ఘ': 'gh',   'ఙ': 'ng',
    'చ': 'ch',   'ఛ': 'chh',  'జ': 'j',    'ఝ': 'jh',   'ఞ': 'ny',
    'ట': 'tt',   'ఠ': 'th',   'డ': 'dd',   'ఢ': 'dh',   'ణ': 'nn',
    'త': 'th',   'థ': 'th',   'ద': 'd',    'ధ': 'dh',   'న': 'n',
    'ప': 'p',    'ఫ': 'ph',   'బ': 'b',    'భ': 'bh',   'మ': 'm',
    'య': 'y',    'ర': 'r',    'ల': 'l',    'ళ': 'l',    'వ': 'v',
    'శ': 'sh',   'ష': 'sh',   'స': 's',    'హ': 'h',
    'ం': 'm',    'ః': 'h',    '్': '',
};

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Check if text contains Telugu characters
 */
export const hasTeluguChars = (text) => {
    if (!text) return false;
    return /[\u0C00-\u0C7F]/.test(text);
};

/**
 * Normalize English text (lowercase, trim)
 */
export const normalizeEnglish = (text) => {
    if (!text) return '';
    return text.toLowerCase().trim();
};

/**
 * Convert English to Telugu using ITRANS rules
 * Handles: consonants, vowels, transliteration
 */
export const englishToTelugu = (text) => {
    if (!text) return '';
    
    let input = normalizeEnglish(text);
    let result = '';
    let i = 0;
    let prevWasConsonant = false;

    while (i < input.length) {
        let matched = false;

        // Try longest match first (prevents 'm' matching when 'mm' is available)
        for (let len = 3; len >= 1 && !matched; len--) {
            const chunk = input.substring(i, i + len);
            
            // Try consonant
            if (CONSONANTS_MAP[chunk]) {
                result += CONSONANTS_MAP[chunk];
                prevWasConsonant = true;
                i += len;
                matched = true;
            }
            // Try vowel (after consonant)
            else if (prevWasConsonant && VOWEL_MATRAS[chunk]) {
                const matra = VOWEL_MATRAS[chunk];
                if (matra) result += matra;  // Add matra if not empty
                prevWasConsonant = false;
                i += len;
                matched = true;
            }
            // Try vowel (at start)
            else if (!prevWasConsonant && VOWELS_START[chunk]) {
                result += VOWELS_START[chunk];
                prevWasConsonant = false;
                i += len;
                matched = true;
            }
        }

        if (!matched) {
            const char = input[i];
            // Skip spaces/punctuation
            if (!/[a-z0-9]/.test(char)) {
                result += char;
                prevWasConsonant = false;
            }
            i++;
        }
    }

    return result;
};

/**
 * Convert Telugu to English (reverse transliteration)
 */
export const teluguToEnglish = (text) => {
    if (!text) return '';
    
    let result = '';
    for (let char of text) {
        result += TELUGU_REVERSE[char] || char;
    }
    return result;
};

// ============================================================================
// MATCHING FUNCTIONS
// ============================================================================

/**
 * Calculate match priority score
 * Higher score = better match
 */
const calculateMatchScore = (productText, queryEnglish, queryTelugu) => {
    if (!productText) return 0;
    
    const textLower = normalizeEnglish(productText);
    const textAsTeluguTranslit = hasTeluguChars(productText) ? 
        teluguToEnglish(productText) : '';
    
    let score = 0;
    
    // ENGLISH MATCHING
    if (textLower === queryEnglish) {
        score += 1000; // Exact match
    } else if (textLower.startsWith(queryEnglish)) {
        score += 500; // Starts with
    } else if (textLower.includes(queryEnglish)) {
        score += 100; // Contains
    }
    
    // TRANSLITERATION MATCHING
    if (textLower === queryTelugu) {
        score += 900; // Exact match in Telugu transliteration
    } else if (textLower.startsWith(queryTelugu.toLowerCase())) {
        score += 400; // Starts with Telugu
    } else if (textLower.includes(queryTelugu.toLowerCase())) {
        score += 80; // Contains Telugu transliteration
    }
    
    // TELUGU NATIVE MATCHING
    if (hasTeluguChars(productText)) {
        const productTeluguNorm = productText; // Already in Telugu
        if (queryTelugu && productTeluguNorm.includes(queryTelugu)) {
            score += 600; // Direct Telugu match
        }
        if (queryEnglish && textAsTeluguTranslit && textAsTeluguTranslit.includes(queryEnglish)) {
            score += 200; // Match English against Telugu transliterated
        }
    }
    
    return score;
};

/**
 * Check if product matches query
 * Returns score (0 = no match, >0 = match with priority)
 */
const getMatchScore = (product, queryEnglish, queryTelugu) => {
    let maxScore = 0;
    
    // Check name_en
    if (product.name_en) {
        maxScore = Math.max(maxScore, calculateMatchScore(product.name_en, queryEnglish, queryTelugu));
    }
    
    // Check name (fallback)
    if (!product.name_en && product.name) {
        maxScore = Math.max(maxScore, calculateMatchScore(product.name, queryEnglish, queryTelugu));
    }
    
    // Check name_te (Telugu name)
    if (product.name_te) {
        const teScore = calculateMatchScore(product.name_te, queryEnglish, queryTelugu);
        maxScore = Math.max(maxScore, teScore + 50); // Slight bonus for Telugu field
    }
    
    // Check category
    if (product.category) {
        maxScore = Math.max(maxScore, calculateMatchScore(product.category, queryEnglish, queryTelugu));
    }
    
    return maxScore;
};

// ============================================================================
// MAIN SEARCH FUNCTIONS
// ============================================================================

/**
 * Search products with full support for:
 * - English names (name_en)
 * - Telugu names (name_te)
 * - English transliteration to Telugu
 * - Bidirectional matching
 * - Priority sorting
 */
export const searchProducts = (products, query) => {
    if (!products || !Array.isArray(products)) return [];
    if (!query || !query.trim()) return products;
    
    const queryNorm = normalizeEnglish(query);
    
    // Generate search forms
    const queryEnglish = queryNorm;
    const queryTelugu = hasTeluguChars(queryNorm) ? 
        queryNorm : // Already Telugu
        englishToTelugu(queryNorm); // Convert English to Telugu
    
    // Score and filter
    const results = products
        .map(product => ({
            product,
            score: getMatchScore(product, queryEnglish, queryTelugu)
        }))
        .filter(item => item.score > 0)
        .sort((a, b) => b.score - a.score) // Sort by score (descending)
        .map(item => item.product);
    
    return results;
};

/**
 * Search orders with customer name, phone, items
 */
export const searchOrders = (orders, query) => {
    if (!orders || !Array.isArray(orders)) return [];
    if (!query || !query.trim()) return orders;
    
    const queryNorm = normalizeEnglish(query);
    
    return orders.filter(order => {
        // Check customer name
        if (order.customerName && 
            normalizeEnglish(order.customerName).includes(queryNorm)) {
            return true;
        }
        
        // Check phone
        if (order.phoneNumber && 
            order.phoneNumber.toString().includes(queryNorm)) {
            return true;
        }
        
        // Check items
        if (Array.isArray(order.items)) {
            return order.items.some(item => 
                item.name && 
                normalizeEnglish(item.name).includes(queryNorm)
            );
        }
        
        return false;
    });
};

/**
 * Search customers by name, phone, email
 */
export const searchCustomers = (customers, query) => {
    if (!customers || !Array.isArray(customers)) return [];
    if (!query || !query.trim()) return customers;
    
    const queryNorm = normalizeEnglish(query);
    
    return customers.filter(customer => {
        if (customer.name && normalizeEnglish(customer.name).includes(queryNorm)) {
            return true;
        }
        if (customer.phone && customer.phone.includes(queryNorm)) {
            return true;
        }
        if (customer.email && normalizeEnglish(customer.email).includes(queryNorm)) {
            return true;
        }
        return false;
    });
};

// ============================================================================
// EXPORTS
// ============================================================================

const searchUtilities = {
    englishToTelugu,
    teluguToEnglish,
    hasTeluguChars,
    normalizeEnglish,
    searchProducts,
    searchOrders,
    searchCustomers,
};

export default searchUtilities;
