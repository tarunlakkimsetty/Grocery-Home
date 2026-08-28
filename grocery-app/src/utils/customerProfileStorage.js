export const getCustomerStorageKey = (userId, suffix) => {
  const safeUserId = Number(userId ?? 0);
  const base = safeUserId > 0 ? `grocery_customer_${safeUserId}` : 'grocery_customer_guest';
  return suffix ? `${base}_${suffix}` : base;
};

export const getSavedAddresses = (userId) => {
  try {
    const raw = localStorage.getItem(getCustomerStorageKey(userId, 'addresses'));
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.filter(Boolean) : [];
  } catch {
    return [];
  }
};

export const saveSavedAddresses = (userId, addresses) => {
  const safeValues = Array.isArray(addresses) ? addresses.filter(Boolean) : [];
  localStorage.setItem(getCustomerStorageKey(userId, 'addresses'), JSON.stringify(safeValues));
  return safeValues;
};

export const getDefaultAddress = (userId) => {
  const addresses = getSavedAddresses(userId);
  return addresses.find((entry) => entry.default) || addresses[0] || null;
};

export const setDefaultAddress = (userId, value) => {
  const addresses = getSavedAddresses(userId).map((entry) => ({ ...entry, default: entry.value === value }));
  saveSavedAddresses(userId, addresses);
  return addresses;
};

export const getRestockSubscriptions = (userId) => {
  try {
    const raw = localStorage.getItem(getCustomerStorageKey(userId, 'restock_alerts'));
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

export const saveRestockSubscriptions = (userId, values) => {
  const safeValues = Array.isArray(values) ? values : [];
  localStorage.setItem(getCustomerStorageKey(userId, 'restock_alerts'), JSON.stringify(safeValues));
  return safeValues;
};

export const getAnnouncements = () => {
  try {
    const raw = localStorage.getItem('grocery_announcements_payload');
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : null;
  } catch {
    return null;
  }
};

export const isAnnouncementDismissed = (dismissKey) => {
  try {
    return Boolean(localStorage.getItem(`grocery_banner_dismissed_${dismissKey}`));
  } catch {
    return false;
  }
};

export const dismissAnnouncement = (dismissKey) => {
  try {
    localStorage.setItem(`grocery_banner_dismissed_${dismissKey}`, '1');
  } catch {
    // ignore storage issues
  }
};

export const getComparedProductIds = (userId) => {
  try {
    const raw = localStorage.getItem(getCustomerStorageKey(userId, 'compare_products'));
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.map(Number).filter((id) => Number.isFinite(id) && id > 0).slice(0, 4) : [];
  } catch {
    return [];
  }
};

export const toggleComparedProduct = (userId, productId) => {
  const safeId = Number(productId);
  if (!Number.isFinite(safeId) || safeId <= 0) return [];
  const existing = getComparedProductIds(userId);
  const next = existing.includes(safeId)
    ? existing.filter((id) => id !== safeId)
    : [...existing, safeId].slice(0, 4);
  localStorage.setItem(getCustomerStorageKey(userId, 'compare_products'), JSON.stringify(next));
  return next;
};

export const getCustomerProfile = (userId) => {
  try {
    const raw = localStorage.getItem(getCustomerStorageKey(userId, 'profile'));
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
};

export const saveCustomerProfile = (userId, profile) => {
  localStorage.setItem(getCustomerStorageKey(userId, 'profile'), JSON.stringify(profile || {}));
  return profile || {};
};
