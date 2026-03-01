// Validation utilities for form inputs
export const validators = {
    // Name validation - only alphabets and spaces
    validateName: (value, getText) => {
        if (!value || !value.trim()) {
            return getText('nameRequired');
        }
        if (!/^[a-zA-Z\s]+$/.test(value)) {
            return getText('nameAlphabetOnly');
        }
        return '';
    },

    // Email validation
    validateEmail: (value, getText) => {
        if (!value || !value.trim()) {
            return getText('emailRequired');
        }
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
            return getText('emailInvalid');
        }
        return '';
    },

    // Password validation - minimum 6 characters
    validatePassword: (value, getText) => {
        if (!value) {
            return getText('passwordRequired');
        }
        if (value.length < 6) {
            return getText('passwordMinLength');
        }
        return '';
    },

    // Phone validation - exactly 10 digits
    validatePhone: (value, getText) => {
        if (!value || !value.trim()) {
            return getText('phoneRequired');
        }
        if (!/^\d{10}$/.test(value.replace(/\D/g, ''))) {
            return getText('phoneInvalid');
        }
        return '';
    },

    // Place/City validation - alphabets and spaces only
    validatePlace: (value, getText) => {
        if (!value || !value.trim()) {
            return getText('placeRequired');
        }
        if (!/^[a-zA-Z\s]+$/.test(value)) {
            return getText('placeAlphabetOnly');
        }
        return '';
    },

    // Price validation - positive number
    validatePrice: (value, getText) => {
        if (!value) {
            return getText('priceRequired');
        }
        const price = parseFloat(value);
        if (isNaN(price) || price <= 0) {
            return getText('priceInvalid');
        }
        return '';
    },

    // Quantity validation - positive integer
    validateQuantity: (value, getText) => {
        if (!value && value !== 0) {
            return getText('quantityRequired');
        }
        const qty = parseInt(value);
        if (isNaN(qty) || qty <= 0) {
            return getText('quantityInvalid');
        }
        return '';
    },

    // Stock validation - positive integer
    validateStock: (value, getText) => {
        if (!value && value !== 0) {
            return getText('stockRequired');
        }
        const stock = parseInt(value);
        if (isNaN(stock) || stock < 0) {
            return getText('stockInvalid');
        }
        return '';
    },

    // Category validation - not empty
    validateCategory: (value, getText) => {
        if (!value || value === '') {
            return getText('categoryRequired');
        }
        return '';
    },

    // Product selection validation
    validateProductSelection: (value, getText) => {
        if (!value) {
            return getText('productNotSelected');
        }
        return '';
    },
};

// Sanitize inputs to prevent XSS
export const sanitizeInput = (value) => {
    if (typeof value !== 'string') return value;
    return value
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#x27;')
        .replace(/\//g, '&#x2F;');
};

// Format phone number for display
export const formatPhoneNumber = (phone) => {
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length === 10) {
        return `${cleaned.slice(0, 5)} ${cleaned.slice(5)}`;
    }
    return phone;
};

// Validate and format input based on type
export const validateAndFormatInput = (type, value, getText) => {
    let error = '';
    let formattedValue = value;

    switch (type) {
        case 'name':
            error = validators.validateName(value, getText);
            formattedValue = value.trim();
            break;
        case 'email':
            error = validators.validateEmail(value, getText);
            formattedValue = value.trim().toLowerCase();
            break;
        case 'password':
            error = validators.validatePassword(value, getText);
            break;
        case 'phone':
            error = validators.validatePhone(value, getText);
            formattedValue = value.replace(/\D/g, '');
            break;
        case 'place':
            error = validators.validatePlace(value, getText);
            formattedValue = value.trim();
            break;
        case 'price':
            error = validators.validatePrice(value, getText);
            formattedValue = parseFloat(value || 0).toFixed(2);
            break;
        case 'quantity':
            error = validators.validateQuantity(value, getText);
            formattedValue = parseInt(value) || 0;
            break;
        case 'stock':
            error = validators.validateStock(value, getText);
            formattedValue = parseInt(value) || 0;
            break;
        default:
            formattedValue = value;
    }

    return {
        error,
        value: formattedValue,
    };
};
