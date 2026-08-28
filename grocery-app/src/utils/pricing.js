const roundCurrency = (value) => Math.round((Number(value) + Number.EPSILON) * 100) / 100;

const calculatePricing = ({ originalPrice, discountedPrice, price } = {}) => {
    const fallback = Number(price);
    const original = Number(originalPrice ?? price);
    const safeOriginal = Number.isFinite(original) && original >= 0 ? roundCurrency(original) : (Number.isFinite(fallback) && fallback >= 0 ? roundCurrency(fallback) : 0);
    const requestedDiscounted = Number(discountedPrice ?? price ?? original);
    const safeDiscounted = Number.isFinite(requestedDiscounted) && requestedDiscounted >= 0
        ? roundCurrency(Math.min(requestedDiscounted, safeOriginal))
        : safeOriginal;
    const discountAmount = roundCurrency(Math.max(0, safeOriginal - safeDiscounted));
    const discountPercentage = safeOriginal > 0 ? roundCurrency((discountAmount / safeOriginal) * 100) : 0;

    return { originalPrice: safeOriginal, discountedPrice: safeDiscounted, price: safeDiscounted, discountAmount, discountPercentage };
};

const calculateLinePricing = (product, quantity) => {
    const pricing = calculatePricing(product);
    const safeQuantity = Number(quantity) > 0 ? Number(quantity) : 0;
    return {
        ...pricing,
        quantity: safeQuantity,
        total: roundCurrency(pricing.discountedPrice * safeQuantity),
        originalTotal: roundCurrency(pricing.originalPrice * safeQuantity),
        savings: roundCurrency(pricing.discountAmount * safeQuantity),
    };
};

export { roundCurrency, calculatePricing, calculateLinePricing };
