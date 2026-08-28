import axiosInstance from './axiosInstance';

const orderAvailabilityService = {
  getSettings: async () => {
    const response = await axiosInstance.get('/order-availability');
    return response.data;
  },
  updateSettings: async (settings) => {
    const response = await axiosInstance.put('/admin/order-availability', settings);
    return response.data;
  },
};

export default orderAvailabilityService;
