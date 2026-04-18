import Tesseract from 'tesseract.js';

// Telugu to English product mapping
const teluguProductMapping = {
    'బియ్యం': 'rice',
    'పాలు': 'milk',
    'నూనె': 'oil',
    'చాక్లెట్': 'chocolate',
    'బెల్లం': 'jaggery',
    'చక్కెర': 'sugar',
    'ఉప్పు': 'salt',
    'పిండి': 'flour',
    'రవ్వ': 'semolina',
    'గుండు': 'sesame',
    'నిమ్మ': 'lemon',
    'అరటి': 'banana',
    'గోధుమ': 'wheat',
    'మిర్చి': 'chilli',
    'మెంతులు': 'fenugreek',
    // Daal variants (multiple spellings)
    'దాలా': 'dal',
    'డాల': 'dal',
    'దాల': 'dal',
    'తూర్': 'toor',
    'తూర్ బీజ': 'toor',
    'అరహర్': 'arhar',
    'మసూర్': 'masoor',
    // Common transliteration variants
    'దీలా': 'dill',
    'freedom': 'freedom', // Brand name
};

/**
 * Preprocess image for better OCR recognition
 * Converts to grayscale, enhances contrast, increases brightness
 * @param {File|Blob} imageFile - Image file
 * @returns {Promise<Canvas>} Preprocessed canvas
 */
const preprocessImage = async (imageFile) => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                canvas.width = img.width;
                canvas.height = img.height;
                const ctx = canvas.getContext('2d');
                
                // Draw image
                ctx.drawImage(img, 0, 0);
                
                // Get image data
                const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                const data = imageData.data;
                
                // Apply advanced preprocessing
                for (let i = 0; i < data.length; i += 4) {
                    const r = data[i];
                    const g = data[i + 1];
                    const b = data[i + 2];
                    
                    // Convert to grayscale using standard luminosity formula
                    const gray = Math.round(0.299 * r + 0.587 * g + 0.114 * b);
                    
                    // Apply STRONGER contrast enhancement for text clarity
                    let enhanced;
                    if (gray < 100) {
                        enhanced = Math.max(0, gray - 40); // Make dark areas darker
                    } else if (gray > 150) {
                        enhanced = Math.min(255, gray + 40); // Make bright areas brighter
                    } else {
                        enhanced = gray;
                    }
                    
                    // Apply slight brightness increase to help with poor lighting
                    enhanced = Math.min(255, enhanced + 15);
                    
                    data[i] = enhanced;
                    data[i + 1] = enhanced;
                    data[i + 2] = enhanced;
                }
                
                ctx.putImageData(imageData, 0, 0);
                resolve(canvas);
            };
            img.onerror = reject;
            img.src = e.target.result;
        };
        reader.onerror = reject;
        reader.readAsDataURL(imageFile);
    });
};

/**
 * Extract text from image using Tesseract OCR with multi-language support
 * @param {File|Blob} imageFile - Image file to process
 * @returns {Promise<string>} Extracted text
 */
export const extractTextFromImage = async (imageFile) => {
    try {
        console.log('🔄 Preprocessing image for better recognition...');
        const preprocessedCanvas = await preprocessImage(imageFile);
        
        console.log('🔄 Extracting text with English + Telugu support...');
        // Use multiple languages for better recognition
        const { data: { text } } = await Tesseract.recognize(
            preprocessedCanvas,
            'eng+tel', // English and Telugu languages
            { 
                logger: (m) => {
                    console.log('OCR Progress:', m);
                },
            }
        );
        
        if (!text || text.trim().length === 0) {
            throw new Error('No text detected in image');
        }
        
        return text;
    } catch (error) {
        console.error('OCR Error:', error);
        throw new Error('Failed to extract text from image. Try a clearer image with better lighting.');
    }
};

/**
 * Extract phone number from text (10-digit Indian format)
 * @param {string} text - Text to search
 * @returns {string|null} Phone number if found
 */
const extractPhoneNumber = (text) => {
    const phoneRegex = /\b(?:\d{3}[-.\s]?)?\d{3}[-.\s]?\d{4}|\b\d{10}\b/g;
    const matches = text.match(phoneRegex);
    if (matches) {
        // Return the longest match (usually the full phone number)
        return matches[matches.length - 1].replace(/[-.\s]/g, '');
    }
    return null;
};

/**
 * Extract possible customer name from text
 * @param {string} text - Text to search
 * @returns {string|null} Customer name if found
 */
const extractCustomerName = (text) => {
    const lines = text.split('\n');
    for (let line of lines) {
        // Look for lines that might contain name (usually after "Name", "Customer", "బిల్")
        const nameMatch = line.match(/(?:name|customer|Name|Customer|నామ|Customer Name)[\s:]*([A-Za-z\s]+)/i);
        if (nameMatch && nameMatch[1]) {
            return nameMatch[1].trim().split(/[0-9,]/)[0].trim(); // Stop at numbers or commas
        }
    }
    return null;
};

/**
 * Extract place/city from text
 * @param {string} text - Text to search
 * @returns {string|null} Place if found
 */
const extractPlace = (text) => {
    const lines = text.split('\n');
    for (let line of lines) {
        const placeMatch = line.match(/(?:place|city|Place|City|స్థానం|గ్రామం)[\s:]*([A-Za-z\s]+)/i);
        if (placeMatch && placeMatch[1]) {
            return placeMatch[1].trim().split(/[0-9,]/)[0].trim();
        }
    }
    return null;
};

/**
 * Extract numbers and their positions in text
 * Useful for finding quantities near product names
 * @param {string} text - Text to search
 * @returns {Array} Array of {value, position}
 */
// eslint-disable-next-line no-unused-vars
const extractNumbers = (text) => {
    const numbers = [];
    const regex = /\b(\d+(?:\.\d{1,2})?)\b/g;
    let match;
    while ((match = regex.exec(text)) !== null) {
        numbers.push({
            value: parseFloat(match[1]),
            position: match.index,
        });
    }
    return numbers;
};

/**
 * Extract unit from text (kg, kgs, g, l, ml, etc.)
 * @param {string} text - Text to search
 * @returns {Object} {unit: "kg"|"g"|"l"|"ml"|"unit", raw: original text}
 */
const extractUnit = (text) => {
    if (!text) return { unit: 'unit', raw: '' };
    
    const unitPatterns = [
        { pattern: /kg|kgs|kilogram/i, unit: 'kg' },
        { pattern: /grams?|g\b/i, unit: 'g' },
        { pattern: /litre?|liter?|l\b/i, unit: 'l' },
        { pattern: /milli?litres?|ml/i, unit: 'ml' },
        { pattern: /packets?|pkt/i, unit: 'pkt' },
        { pattern: /bottles?|btl/i, unit: 'bottle' },
    ];
    
    for (let { pattern, unit } of unitPatterns) {
        const match = text.match(pattern);
        if (match) {
            console.log(`📏 Unit detected: ${match[0]} -> ${unit}`);
            return { unit, raw: match[0] };
        }
    }
    
    return { unit: 'unit', raw: '' };
};

/**
 * Parse quantity and unit from text line
 * Handles cases like "2kgs", "1 kg", "500g", etc.
 * @param {string} text - Text to parse
 * @returns {Object} {quantity: number, unit: string, quantityWithUnit: string}
 */
// eslint-disable-next-line no-unused-vars
const parseQuantityAndUnit = (text) => {
    if (!text) return { quantity: 1, unit: 'unit', quantityWithUnit: '' };
    
    // Match patterns like: "2kgs", "1 kg", "500 grams", "1.5L", etc.
    const quantityUnitRegex = /(\d+(?:\.\d+)?)\s*(kg|kgs|g|grams?|l|litre?|ml|liter?|packet|pkt|bottle|btl)?/i;
    const match = text.match(quantityUnitRegex);
    
    if (match && match[1]) {
        const quantity = parseFloat(match[1]);
        const unitText = match[2] || '';
        
        if (quantity > 0 && quantity < 10000) { // Sanity check
            const unitInfo = extractUnit(unitText);
            console.log(`📦 Quantity parsed: ${quantity} ${unitInfo.unit}`);
            return {
                quantity,
                unit: unitInfo.unit,
                quantityWithUnit: `${quantity}${unitInfo.unit}`
            };
        }
    }
    
    return { quantity: 1, unit: 'unit', quantityWithUnit: '' };
};

/**
 * Normalize text by converting Telugu to English
 * @param {string} text - Text to normalize
 * @returns {string} Normalized text
 */
// eslint-disable-next-line no-unused-vars
const normalizeTeluguToEnglish = (text) => {
    let normalized = text;
    
    for (let [telugu, english] of Object.entries(teluguProductMapping)) {
        // Replace Telugu text with English equivalent for matching
        if (text.includes(telugu)) {
            console.log(`🇮🇳 Converting: "${telugu}" -> "${english}"`);
            normalized = text.replace(telugu, english);
        }
    }
    
    return normalized;
};

/**
 * Match extracted text with product from database
 * Supports case-insensitive and partial matching
 * @param {string} extractedText - Text to match
 * @param {Array} products - Product list from database
 * @returns {Object|null} Matched product or null
 */
// eslint-disable-next-line no-unused-vars
const matchProductWithDatabase = (extractedText, products) => {
    if (!extractedText || extractedText.length === 0) return null;
    
    const textLower = extractedText.toLowerCase().trim();
    
    console.log(`🔍 Matching: "${extractedText}"`);
    
    // Step 1: Try exact match
    let product = products.find(p => 
        p.name.toLowerCase() === textLower || 
        (p.teluguName && p.teluguName === extractedText) ||
        (p.teluguName && p.teluguName.toLowerCase() === textLower)
    );
    if (product) {
        console.log(`✅ Exact match: "${product.name}"`);
        return product;
    }

    // Step 2: Try partial match (name contains text or vice versa)
    product = products.find(p => 
        p.name.toLowerCase().includes(textLower) || 
        textLower.includes(p.name.toLowerCase()) ||
        (p.teluguName && (p.teluguName.includes(extractedText) || 
         p.teluguName.toLowerCase().includes(textLower) || 
         textLower.includes(p.teluguName.toLowerCase())))
    );
    if (product) {
        console.log(`✅ Partial match: "${product.name}"`);
        return product;
    }

    // Step 3: Try matching against product keywords
    product = products.find(p => {
        if (!p.keywords) return false;
        try {
            const keywords = typeof p.keywords === 'string' ? JSON.parse(p.keywords) : p.keywords;
            return keywords.some(kw => 
                kw.toLowerCase().includes(textLower) || 
                textLower.includes(kw.toLowerCase())
            );
        } catch (e) {
            return false;
        }
    });
    if (product) {
        console.log(`✅ Keyword match: "${product.name}"`);
        return product;
    }

    // Step 4: Try Telugu mapping
    for (let [telugu, english] of Object.entries(teluguProductMapping)) {
        if (extractedText.includes(telugu)) {
            console.log(`🇮🇳 Telugu found: "${telugu}" → search for "${english}"`);
            product = products.find(p => p.name.toLowerCase().includes(english));
            if (product) {
                console.log(`✅ Telugu mapping match: "${product.name}"`);
                return product;
            }
        }
        if (textLower.includes(english)) {
            product = products.find(p => p.name.toLowerCase().includes(english));
            if (product) {
                console.log(`✅ English mapping match: "${product.name}"`);
                return product;
            }
        }
    }

    // Step 5: Fuzzy matching - check if any word in extracted text matches any product word
    const extractedWords = textLower.split(/\s+/);
    for (let word of extractedWords) {
        if (word.length < 3) continue; // Skip very short words
        
        product = products.find(p => {
            const productNameWords = p.name.toLowerCase().split(/\s+/);
            return productNameWords.some(pWord => 
                pWord.includes(word) || word.includes(pWord)
            );
        });
        
        if (product) {
            console.log(`✅ Fuzzy match on word "${word}": "${product.name}"`);
            return product;
        }
    }

    console.log(`❌ No match found`);
    return null;
};

/**
 * Parse OCR text to extract products with quantity and units
 * Handles product name, quantity, and unit detection
 * @param {string} text - OCR extracted text
 * @param {Array} products - Product list from database
 * @returns {Array} Array of detected products with {product, quantity, unit, price, total}
 */
const parseProductsFromText = (text, products) => {
    const detectedProducts = [];
    
    // Split by newlines and also by multiple spaces (product lines often have spaces between name and qty)
    const rawLines = text.split(/[\n\r]+/).filter(line => line.trim().length > 0);
    
    console.log(`📄 Processing ${rawLines.length} lines from OCR text`);
    
    for (let line of rawLines) {
        let trimmedLine = line.trim();
        
        // Skip empty lines and headers
        if (!trimmedLine || trimmedLine.length < 2) continue;
        if (/^(Date|Total|Bill|Invoice|Amount|Price|QTY|Qty|Quantity|Date|Time|కంపెనీ|బిల్|సంఖ్య|Name|Customer|నామ|గ్రాహక)/i.test(trimmedLine)) {
            console.log(`⏭️  Skipping header: "${trimmedLine}"`);
            continue;
        }

        console.log(`\n🔄 Processing: "${trimmedLine}"`);

        // Step 1: Parse quantity and unit from the entire line
        const quantityInfo = parseQuantityAndUnit(trimmedLine);
        console.log(`   Qty: ${quantityInfo.quantity}, Unit: ${quantityInfo.unit}`);

        // Step 2: Extract product name
        // Remove quantity+unit patterns, numbers at end, and extra spaces
        let productName = trimmedLine
            .replace(/(\d+(?:\.\d+)?)\s*(kg|kgs|g|grams?|l|litre?|ml|liter?|packet|pkt|bottle|btl)?/i, '') // Remove qty+unit
            .replace(/[\d\s-]+$/, '') // Remove trailing numbers and spaces
            .trim();

        // Clean up extra whitespace
        productName = productName.replace(/\s+/g, ' ').trim();

        if (!productName || productName.length < 2) {
            console.log(`   ⚠️  Product name too short after cleaning`);
            continue;
        }

        console.log(`   Product name extracted: "${productName}"`);

        // Step 3: Create NEW CUSTOM PRODUCT (NO database matching)
        const newProduct = {
            id: `ocr_${Date.now()}_${Math.random()}`, // Unique ID
            name: productName,
            quantity: quantityInfo.quantity,
            unit: quantityInfo.unit,
            price: 0, // Default price (user can edit)
            total: 0,
            isOCR: true,
            isCustom: true,
        };

        detectedProducts.push(newProduct);
        console.log(`   ✅ Created custom product: "${productName}" x${quantityInfo.quantity}${quantityInfo.unit}`)
    }

    console.log(`\n✅ TOTAL DETECTED: ${detectedProducts.length} products`);
    return detectedProducts;
};

/**
 * Main function to process bill image and extract all data
 * @param {File|Blob} imageFile - Bill image
 * @returns {Promise<Object>} Extracted data: {customerDetails, detectedProducts, rawText}
 */
export const processBillImage = async (imageFile) => {
    try {
        // Extract text using OCR
        const rawText = await extractTextFromImage(imageFile);
        console.log('📝 Extracted text:', rawText);

        // Parse customer details
        const customerDetails = {
            phone: extractPhoneNumber(rawText),
            name: extractCustomerName(rawText),
            place: extractPlace(rawText),
        };

        console.log('👤 Customer details:', customerDetails);

        // Parse products (NO database matching - create custom products)
        const detectedProducts = parseProductsFromText(rawText, null); // null since no DB matching
        console.log('🛒 Detected products:', detectedProducts);

        return {
            customerDetails,
            detectedProducts,
            rawText,
            success: true,
        };
    } catch (error) {
        console.error('Bill processing error:', error);
        return {
            success: false,
            error: error.message || 'Unable to extract text from image. Please try a clearer image.',
        };
    }
};

/**
 * Add unrecognized product as "Unknown Item"
 * @param {string} productName - Name of unrecognized product
 * @param {number} quantity - Quantity
 * @returns {Object} Product object
 */
export const createUnknownProduct = (productName, quantity = 1) => {
    return {
        id: 'unknown_' + Date.now(),
        name: productName,
        category: 'Unknown',
        price: 0, // User will need to enter price
        quantity: quantity,
        isUnknown: true,
    };
};

// ====== DUPLICATE FUNCTIONS REMOVED - All are defined earlier in file ====== */

