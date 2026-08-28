const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

const normalizeText = (value) => String(value ?? '').trim().toLowerCase();

const safeNumber = (value, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const getEffectivePrice = (product) => {
  const current = safeNumber(product?.discountedPrice ?? product?.price ?? product?.effectivePrice, 0);
  const original = safeNumber(product?.originalPrice ?? product?.basePrice ?? product?.price, 0);
  if (original > 0 && current > 0) return Math.min(current, original);
  if (current > 0) return current;
  if (original > 0) return original;
  return 0;
};

const getDiscountPercent = (product) => {
  const original = safeNumber(product?.originalPrice ?? product?.basePrice ?? product?.price, 0);
  const current = getEffectivePrice(product);
  if (original <= 0) return 0;
  return clamp(((original - current) / original) * 100, 0, 100);
};

const getRatingValue = (product) => {
  const rating = safeNumber(product?.average_rating ?? product?.rating ?? product?.customerRating, 0);
  return rating > 0 ? clamp(rating, 0, 5) : 0;
};

const getReviewCount = (product) => safeNumber(product?.rating_count ?? product?.reviewCount ?? product?.reviews_count, 0);

const getUnitComparableValue = (product) => {
  const unit = normalizeText(product?.unit || product?.packUnit || product?.measurementUnit);
  const quantity = safeNumber(product?.quantity ?? product?.packQuantity ?? product?.size ?? product?.measurementQty, 0);
  if (!quantity || quantity <= 0) return 0;

  const familyMap = {
    kg: 'weight', g: 'weight', gram: 'weight', grams: 'weight', litre: 'volume', liter: 'volume', l: 'volume', ml: 'volume', pack: 'pack', packs: 'pack', packet: 'pack', packets: 'pack', bottle: 'volume', bottles: 'volume', box: 'pack', boxes: 'pack', jar: 'volume', jars: 'volume', can: 'pack', cans: 'pack', tube: 'pack', tubes: 'pack', pouch: 'pack', pouches: 'pack', basket: 'pack', baskets: 'pack', bundle: 'pack', bundles: 'pack', unit: 'pack', units: 'pack'
  };

  const family = familyMap[unit] || 'pack';
  const normalized = {
    weight: quantity,
    volume: quantity,
    pack: quantity,
  };

  return Number.isFinite(normalized[family]) ? normalized[family] : quantity;
};

const hasFreeOffer = (product) => Boolean(product?.freeItemActive || product?.freeItemName || product?.freeItemOffer);

const normalizeComparable = (value, min, max) => {
  if (!Number.isFinite(value)) return 0;
  if (max <= min) return 1;
  return clamp((value - min) / (max - min), 0, 1);
};

const getRelativeFactorScore = (value, values, { higherIsBetter = true } = {}) => {
  if (!Number.isFinite(value)) return null;

  const numericValues = values.filter((entry) => Number.isFinite(entry));
  if (numericValues.length === 0) return null;

  const min = Math.min(...numericValues);
  const max = Math.max(...numericValues);

  if (max === min) return 100;

  const normalized = normalizeComparable(value, min, max);
  return higherIsBetter ? normalized * 100 : (1 - normalized) * 100;
};

const getComparableUnitAmount = (product) => {
  const unitText = normalizeText(product?.unit || product?.packUnit || product?.measurementUnit);
  const quantity = safeNumber(product?.quantity ?? product?.packQuantity ?? product?.size ?? product?.measurementQty, 0);

  if (!quantity || quantity <= 0) return 0;

  if (unitText.includes('ml')) return quantity / 1000;
  if (unitText.includes('l') || unitText === 'liter' || unitText === 'litre') return quantity;
  if (unitText.includes('g') || unitText === 'gram' || unitText === 'grams') return quantity / 1000;
  if (unitText.includes('kg') || unitText === 'kilogram' || unitText === 'kilograms') return quantity;
  return quantity;
};

const getUnitPriceValue = (product) => {
  const price = getEffectivePrice(product);
  const amount = getComparableUnitAmount(product);
  if (!price || !amount || amount <= 0) return 0;
  return price / amount;
};

const formatFactorDisplay = (value, fallbackLabel) => {
  if (value === null || value === undefined) return fallbackLabel;
  return `${Math.round(value)}/100`;
};

const buildRecommendation = (products) => {
  const safeProducts = Array.isArray(products) ? products.filter(Boolean) : [];
  if (safeProducts.length === 0) {
    return { winner: null, closeMatch: false, products: [], recommendationType: 'No comparison data' };
  }

  const priceValues = safeProducts.map((product) => getEffectivePrice(product)).filter((value) => Number.isFinite(value) && value > 0);
  const ratingValues = safeProducts.map((product) => getRatingValue(product)).filter((value) => Number.isFinite(value) && value > 0);
  const discountValues = safeProducts.map((product) => getDiscountPercent(product)).filter((value) => Number.isFinite(value));
  const unitValues = safeProducts.map((product) => getUnitPriceValue(product)).filter((value) => Number.isFinite(value) && value > 0);
  const reviewValues = safeProducts.map((product) => getReviewCount(product)).filter((value) => Number.isFinite(value) && value > 0);

  const scoredProducts = safeProducts.map((product) => {
    const effectivePrice = getEffectivePrice(product);
    const ratingValue = getRatingValue(product);
    const discountPercent = getDiscountPercent(product);
    const unitPriceValue = getUnitPriceValue(product);
    const reviewCount = getReviewCount(product);

    const hasActualRating = ratingValue > 0;
    const hasActualReviews = reviewCount > 0;

    // Scoring formula:
    // 1) Only compare factors with actual data. Missing rating/review data is treated as N/A instead of 0/
    //    50 so the product is not rewarded or punished for lacking evidence.
    // 2) When a factor is unavailable, we redistribute its weight across the other factors that are present.
    // 3) Final score is normalized against the remaining weights, so products with insufficient data do not
    //    automatically become 100/100 or 0/100.
    const scoreWeights = {
      price: 0.35,
      discount: 0.15,
      rating: 0.25,
      review: 0.05,
      stock: 0.10,
      unit: 0.05,
      offer: 0.05,
    };

    const priceScore = priceValues.length > 0 ? getRelativeFactorScore(effectivePrice, priceValues, { higherIsBetter: false }) : null;
    const ratingScore = ratingValues.length > 0 && hasActualRating ? getRelativeFactorScore(ratingValue, ratingValues, { higherIsBetter: true }) : null;
    const discountScore = discountValues.length > 0 ? getRelativeFactorScore(discountPercent, discountValues, { higherIsBetter: true }) : null;
    const unitScore = unitValues.length > 0 ? getRelativeFactorScore(unitPriceValue, unitValues, { higherIsBetter: false }) : null;
    const reviewScore = reviewValues.length > 0 && hasActualReviews ? getRelativeFactorScore(reviewCount, reviewValues, { higherIsBetter: true }) : null;
    const stockScore = safeNumber(product?.stock, 0) > 0 ? 100 : 0;
    const freeOfferScore = hasFreeOffer(product) ? 100 : 0;

    const factorEntries = {
      price: { weight: scoreWeights.price, score: priceScore },
      discount: { weight: scoreWeights.discount, score: discountScore },
      rating: { weight: scoreWeights.rating, score: ratingScore },
      review: { weight: scoreWeights.review, score: reviewScore },
      stock: { weight: scoreWeights.stock, score: stockScore },
      unit: { weight: scoreWeights.unit, score: unitScore },
      offer: { weight: scoreWeights.offer, score: freeOfferScore },
    };

    const presentFactors = Object.entries(factorEntries).filter(([, factor]) => factor.score !== null);
    const totalWeight = presentFactors.reduce((sum, [, factor]) => sum + factor.weight, 0);
    const weightedValue = presentFactors.reduce((sum, [key, factor]) => {
      const scoreValue = factor.score;
      if (scoreValue === null || scoreValue === undefined) return sum;
      return sum + ((scoreValue / 100) * factor.weight);
    }, 0);
    const score = totalWeight > 0 ? clamp(Number(((weightedValue / totalWeight) * 100).toFixed(2)), 0, 100) : 0;

    const hasLowerPrice = priceValues.length > 0 && effectivePrice > 0 && effectivePrice <= Math.min(...priceValues);
    const hasHigherDiscount = discountValues.length > 0 && discountPercent >= Math.max(...discountValues);
    const hasHigherRating = ratingValues.length > 0 && hasActualRating && ratingValue >= Math.max(...ratingValues);
    const hasHigherReviewConfidence = reviewValues.length > 0 && hasActualReviews && reviewCount >= Math.max(...reviewValues);
    const isInStock = safeNumber(product?.stock, 0) > 0;
    const hasOffer = hasFreeOffer(product);
    const hasBetterUnitValue = unitValues.length > 0 && unitPriceValue > 0 && unitPriceValue <= Math.min(...unitValues);

    const reasons = [];
    if (hasLowerPrice) reasons.push('✓ Lower effective price');
    if (hasHigherDiscount && discountPercent > 0) reasons.push('✓ Higher discount percentage');
    if (hasHigherRating) reasons.push('✓ Higher customer rating');
    if (hasHigherReviewConfidence) reasons.push('✓ Better review confidence');
    if (isInStock) reasons.push('✓ In stock');
    if (hasOffer) reasons.push('✓ Active free offer');
    if (hasBetterUnitValue) reasons.push('✓ Better value per unit');
    if (reasons.length === 0) reasons.push('✓ Competitive option based on current comparison set');

    return {
      ...product,
      effectivePrice,
      discountPercent,
      ratingValue,
      reviewCount,
      unitValue: unitPriceValue,
      score,
      priceScore,
      ratingScore,
      discountScore,
      unitScore,
      reviewScore,
      stockScore,
      freeOfferScore,
      scoreBreakdown: {
        price: formatFactorDisplay(priceScore, 'N/A'),
        discount: formatFactorDisplay(discountScore, 'N/A'),
        rating: hasActualRating ? formatFactorDisplay(ratingScore, 'N/A') : 'N/A',
        reviews: hasActualReviews ? formatFactorDisplay(reviewScore, 'N/A') : 'N/A',
        stock: `${Math.round(stockScore)}/100`,
        offer: `${Math.round(freeOfferScore)}/100`,
        unit: formatFactorDisplay(unitScore, 'N/A'),
      },
      reasons,
      ratingText: hasActualRating ? `${Number(ratingValue).toFixed(1)} / 5` : 'No ratings yet',
      reviewText: hasActualReviews ? `${reviewCount} reviews` : 'No reviews yet',
      badge: 'Best Value',
      componentScores: {
        price: priceScore,
        discount: discountScore,
        rating: ratingScore,
        review: reviewScore,
        stock: stockScore,
        offer: freeOfferScore,
        unit: unitScore,
      },
    };
  });

  const sorted = [...scoredProducts].sort((a, b) => b.score - a.score || b.ratingValue - a.ratingValue || b.reviewCount - a.reviewCount || a.effectivePrice - b.effectivePrice);
  const winner = sorted[0];
  const second = sorted[1];
  const closeMatch = second ? Math.abs(winner.score - second.score) <= 10 : false;

  const finalProducts = sorted.map((product, index) => {
    const isWinner = index === 0;
    const label = isWinner ? (closeMatch ? 'Best Value — Close Match' : '🏆 BEST VALUE') : '⭐ RECOMMENDED';
    return {
      ...product,
      isWinner,
      recommendationLabel: label,
      badge: label,
      reasons: [...new Set(product.reasons)],
    };
  });

  return {
    winner: finalProducts[0] || null,
    closeMatch,
    products: finalProducts,
    recommendationType: closeMatch ? 'Best Value — Close Match' : '🏆 BEST VALUE',
  };
};

const getComparisonRecommendation = (products) => buildRecommendation(products);

module.exports = {
  getComparisonRecommendation,
  buildRecommendation,
  getEffectivePrice,
  getDiscountPercent,
  getRatingValue,
  getReviewCount,
  getUnitComparableValue,
  hasFreeOffer,
};
