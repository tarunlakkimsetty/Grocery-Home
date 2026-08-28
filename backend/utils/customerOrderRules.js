const normalizeText = (value) => String(value || '').trim().toLowerCase().replace(/[\s_-]+/g, '');

const canCustomerCancelOrder = (order = {}) => {
  if (!order || typeof order !== 'object') return false;

  const status = normalizeText(order.status);
  if (status === 'rejected' || status === 'completed' || status === 'delivered') {
    return false;
  }

  if (status === 'pending' || status === 'pendingacceptance' || status === 'accepted' || status === 'verified' || status === 'paid') {
    return true;
  }

  return false;
};

const orderMatchesQuery = (order = {}, query = '') => {
  const text = String(query || '').trim().toLowerCase();
  if (!text) return true;

  const haystacks = [
    order?.customerName,
    order?.phone,
    order?.customerPhone,
    order?.id,
    ...(Array.isArray(order?.items) ? order.items.map((item) => item?.name || item?.productName) : []),
  ];

  return haystacks.some((value) => {
    if (value === undefined || value === null || value === '') return false;
    const normalized = String(value).toLowerCase();
    return normalized.includes(text);
  });
};

module.exports = {
  canCustomerCancelOrder,
  orderMatchesQuery,
};
