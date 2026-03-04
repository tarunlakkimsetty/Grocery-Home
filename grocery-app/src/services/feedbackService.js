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
};

export default feedbackService;
