import axiosInstance from './axiosInstance';

const favoriteService = {
    /**
     * Add a product to favorites
     * POST /api/favorites/:productId
     */
    addFavorite: async (productId) => {
        try {
            const response = await axiosInstance.post(`/favorites/${productId}`);
            return response.data;
        } catch (err) {
            console.error('Error adding to favorites:', err);
            throw err;
        }
    },

    /**
     * Remove a product from favorites
     * DELETE /api/favorites/:productId
     */
    removeFavorite: async (productId) => {
        try {
            const response = await axiosInstance.delete(`/favorites/${productId}`);
            return response.data;
        } catch (err) {
            console.error('Error removing from favorites:', err);
            throw err;
        }
    },

    /**
     * Get all favorites for logged-in customer
     * GET /api/favorites
     */
    getFavorites: async (page = 1, limit = 50) => {
        try {
            const response = await axiosInstance.get('/favorites', {
                params: { page, limit }
            });
            return response.data;
        } catch (err) {
            console.error('Error fetching favorites:', err);
            throw err;
        }
    },

    /**
     * Get count of favorites
     * GET /api/favorites/count
     */
    getFavoritesCount: async () => {
        try {
            const response = await axiosInstance.get('/favorites/count');
            return response.data;
        } catch (err) {
            console.error('Error fetching favorites count:', err);
            throw err;
        }
    },

    /**
     * Check if a product is favorited
     * GET /api/favorites/:productId/check
     */
    checkFavorite: async (productId) => {
        try {
            const response = await axiosInstance.get(`/favorites/${productId}/check`);
            return response.data;
        } catch (err) {
            console.error('Error checking favorite status:', err);
            throw err;
        }
    }
};

export default favoriteService;
