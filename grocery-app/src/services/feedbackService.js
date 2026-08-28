import axiosInstance from './axiosInstance';

const feedbackService = {
    getPending: async () => {
        const response = await axiosInstance.get('/feedback/pending');
        return response?.data?.data || [];
    },

    submit: async ({ orderId, rating, comment }) => {
        const response = await axiosInstance.post('/feedback', {
            orderId,
            rating,
            comment,
        });
        return response?.data;
    },

    getAdminSummary: async () => {
        const response = await axiosInstance.get('/feedback/admin/summary');
        return response?.data?.data || { overall_rating: null, rating_count: 0 };
    },

    getVisibilitySettings: async () => {
        const response = await axiosInstance.get('/feedback/visibility-settings');
        return response?.data?.data || { showRatingsToCustomers: true, showCommentsToCustomers: false };
    },

    updateVisibilitySettings: async (settings) => {
        const response = await axiosInstance.put('/feedback/visibility-settings', settings);
        return response?.data?.data || settings;
    },

    getPendingProducts: async () => {
        const response = await axiosInstance.get('/feedback/pending-products');
        const payload = response?.data || {};

        if (Array.isArray(payload)) return payload;
        if (Array.isArray(payload?.data)) return payload.data;
        if (Array.isArray(payload?.products)) return payload.products;

        return [];
    },

    submitProductRatings: async ({ items, comment }) => {
        const response = await axiosInstance.post('/feedback/product-ratings', {
            items,
            comment,
        });
        return response?.data || {};
    },

    getAdminProductRatings: async ({ search, page = 1, limit = 50 } = {}) => {
        const response = await axiosInstance.get('/feedback/admin/product-ratings', {
            params: {
                search: typeof search === 'string' && search.trim() ? search.trim() : undefined,
                page,
                limit,
            },
        });

        return {
            data: response?.data?.data || [],
            pagination: response?.data?.pagination || { page: 1, limit: 50, total: 0, totalPages: 0 },
        };
    },

    getAdminProductReviews: async (productId, { page = 1, limit = 50 } = {}) => {
        const response = await axiosInstance.get(`/feedback/admin/product-ratings/${productId}/reviews`, {
            params: { page, limit },
        });

        return {
            data: response?.data?.data || [],
            pagination: response?.data?.pagination || { page: 1, limit: 50, total: 0 },
            productId: response?.data?.productId || Number(productId),
        };
    },

    getCustomerProductReviews: async (productId) => {
        const response = await axiosInstance.get(`/feedback/products/${productId}/reviews`);
        return {
            data: Array.isArray(response?.data?.data) ? response.data.data : [],
            count: Number(response?.data?.count || 0),
        };
    },
};

export default feedbackService;
