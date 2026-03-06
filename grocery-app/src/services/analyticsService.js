import axiosInstance from './axiosInstance';

const analyticsService = {
    // Admin: Sales Analytics page payload
    getDashboard: async () => {
        const response = await axiosInstance.get('/admin/analytics/dashboard');
        const data = response.data;
        return data?.data || data;
    },

    // Admin: Sales summary by date range (inclusive)
    getSalesSummaryByDateRange: async ({ startDate, endDate }) => {
        const response = await axiosInstance.get('/admin/analytics/sales-summary', {
            params: {
                startDate,
                endDate,
            },
        });
        const data = response.data;
        return data?.data || data;
    },
};

export default analyticsService;
