export const getCustomerRecentViewsKey = (userId) => {
  const safeUserId = Number(userId ?? 0);
  return `grocery_recently_viewed_customer_${safeUserId || 'guest'}`;
};

export const getRecentViewedProducts = (userId = null) => {
  try {
    const raw = localStorage.getItem(getCustomerRecentViewsKey(userId));
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.filter((id) => Number.isFinite(Number(id)) && Number(id) > 0) : [];
  } catch {
    return [];
  }
};

export const saveRecentViewedProducts = (userId, productIds) => {
  try {
    const safeIds = Array.isArray(productIds) ? productIds : [];
    const uniqueIds = [...new Set(safeIds.filter((id) => Number.isFinite(Number(id)) && Number(id) > 0).map((id) => Number(id)))];
    localStorage.setItem(getCustomerRecentViewsKey(userId), JSON.stringify(uniqueIds.slice(0, 12)));
    return uniqueIds.slice(0, 12);
  } catch {
    return [];
  }
};

export const recordRecentlyViewedProduct = (userId, productId) => {
  const safeId = Number(productId);
  if (!Number.isFinite(safeId) || safeId <= 0) return [];
  const current = getRecentViewedProducts(userId);
  const next = [safeId, ...current.filter((id) => id !== safeId)].slice(0, 12);
  return saveRecentViewedProducts(userId, next);
};

export const isProductOnOffer = (product) => {
  const originalPrice = Number(product?.originalPrice ?? product?.price ?? 0);
  const discountedPrice = Number(product?.discountedPrice ?? product?.price ?? 0);
  const discountPercent = Number(product?.discountPercentage ?? 0);
  const freeItemName = String(product?.freeItemName || '').trim();
  const hasDiscount = Number.isFinite(originalPrice) && originalPrice > 0 && Number.isFinite(discountedPrice) && discountedPrice >= 0 && originalPrice > discountedPrice + 0.01;
  const hasFreeOffer = Boolean(product?.freeItemActive) && freeItemName.length > 0;
  return hasDiscount || discountPercent > 0 || hasFreeOffer;
};

export const getLowStockThreshold = () => {
  const stored = Number(localStorage.getItem('grocery_low_stock_threshold') || '10');
  return Number.isFinite(stored) && stored >= 0 ? stored : 10;
};

export const isLowStockProduct = (product, threshold = getLowStockThreshold()) => {
  const stock = Number(product?.stock || 0);
  return stock > 0 && stock <= Number(threshold || 0);
};

export const getOfferProducts = (products = []) => (Array.isArray(products) ? products.filter(isProductOnOffer) : []);

export const getLowStockProducts = (products = [], threshold = getLowStockThreshold()) => (Array.isArray(products) ? products.filter((product) => isLowStockProduct(product, threshold)) : []);

export const getTopRatedProducts = (products = []) => {
  const safeProducts = Array.isArray(products) ? products : [];
  return safeProducts
    .filter((product) => Number(product?.average_rating || 0) > 0 && Number(product?.rating_count || 0) > 0)
    .sort((a, b) => {
      const ratingDiff = Number(b.average_rating || 0) - Number(a.average_rating || 0);
      if (Math.abs(ratingDiff) > 0.0001) return ratingDiff;
      return Number(b.rating_count || 0) - Number(a.rating_count || 0);
    });
};
