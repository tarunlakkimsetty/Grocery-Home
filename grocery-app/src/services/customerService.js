import axiosInstance from './axiosInstance';

const customerService = {
    // Admin: list all customers with analytics
    getAdminCustomers: async (search) => {
        const response = await axiosInstance.get('/admin/customers', {
            params: {
                search: typeof search === 'string' ? search : undefined,
            },
        });
        const data = response.data;
        if (Array.isArray(data)) return data;
        return data?.data || data?.customers || [];
    },

    // Admin: get one customer analytics by id
    getAdminCustomerById: async (customerId) => {
        const response = await axiosInstance.get('/admin/customers/' + customerId);
        const data = response.data;
        return data?.data || data?.customer || data;
    },
};

export default customerService;
