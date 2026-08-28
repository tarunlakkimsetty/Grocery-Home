import axiosInstance from './axiosInstance';

const suggestedProductsService = {
    getSuggestedProducts: async () => {
        const response = await axiosInstance.get('/suggested-products');
        return response.data;
    },

    adminGetSuggestedProducts: async () => {
        const response = await axiosInstance.get('/admin/suggested-products');
        return response.data;
    },

    addSuggestedProduct: async (productId) => {
        const response = await axiosInstance.post(`/admin/suggested-products/${productId}`);
        return response.data;
    },

    removeSuggestedProduct: async (productId) => {
        const response = await axiosInstance.delete(`/admin/suggested-products/${productId}`);
        return response.data;
    },

    checkSuggestedProduct: async (productId) => {
        const response = await axiosInstance.get(`/suggested-products/${productId}/check`);
        return response.data;
    }
};

export default suggestedProductsService;
