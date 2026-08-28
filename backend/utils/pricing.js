const roundCurrency = (value) => Math.round((Number(value) + Number.EPSILON) * 100) / 100;

const calculatePricing = ({ originalPrice, discountedPrice, price } = {}) => {
    const fallback = Number(price);
    const original = Number(originalPrice ?? price);
    const effectiveOriginal = Number.isFinite(original) && original >= 0 ? roundCurrency(original) : (Number.isFinite(fallback) && fallback >= 0 ? roundCurrency(fallback) : 0);
    const requestedDiscounted = Number(discountedPrice ?? price ?? original);
    const effectiveDiscounted = Number.isFinite(requestedDiscounted) && requestedDiscounted >= 0
        ? roundCurrency(Math.min(requestedDiscounted, effectiveOriginal))
        : effectiveOriginal;
    const discountAmount = roundCurrency(Math.max(0, effectiveOriginal - effectiveDiscounted));
    const discountPercentage = effectiveOriginal > 0 ? roundCurrency((discountAmount / effectiveOriginal) * 100) : 0;

    return {
        originalPrice: effectiveOriginal,
        discountedPrice: effectiveDiscounted,
        price: effectiveDiscounted,
        discountAmount,
        discountPercentage,
    };
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

module.exports = { roundCurrency, calculatePricing, calculateLinePricing };
