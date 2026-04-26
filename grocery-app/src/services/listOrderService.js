import axiosInstance from './axiosInstance';

const listOrderService = {
  // Upload grocery list image(s)
  uploadGroceryList: async (customerName, phone, place, imageFiles, notes = '') => {
    const formData = new FormData();
    formData.append('customerName', customerName);
    formData.append('phone', phone);
    formData.append('place', place);
    
    // Support both single file (for backward compatibility) and multiple files
    if (Array.isArray(imageFiles)) {
      imageFiles.forEach((file, index) => {
        formData.append('images', file);
      });
    } else {
      formData.append('images', imageFiles);
    }
    
    if (notes) formData.append('notes', notes);

    try {
      const response = await axiosInstance.post('/list-orders/upload', formData, {
        headers: {
          'Content-Type': undefined // Let browser/axios set it with boundary
        }
      });
      return response.data;
    } catch (error) {
      console.error('Upload error:', error);
      throw error;
    }
  },

  // 🔒 Get current logged-in user's uploads (authenticated route)
  getCustomerUploads: async () => {
    try {
      // No need to pass customerName/phone - backend extracts from JWT token
      const response = await axiosInstance.post('/list-orders/my-uploads');
      return response.data;
    } catch (error) {
      console.error('Fetch error:', error);
      throw error;
    }
  },

  // Get all list orders (admin)
  getAllListOrders: async (filters = {}) => {
    try {
      const params = new URLSearchParams();
      if (filters.status) params.append('status', filters.status);
      if (filters.phone) params.append('phone', filters.phone);
      if (filters.customerName) params.append('customerName', filters.customerName);

      const response = await axiosInstance.get(
        `/list-orders${params.toString() ? '?' + params.toString() : ''}`
      );
      return response.data;
    } catch (error) {
      console.error('Fetch error:', error);
      throw error;
    }
  },

  // Get single list order
  getListOrderById: async (id) => {
    try {
      const response = await axiosInstance.get(`/list-orders/${id}`);
      return response.data;
    } catch (error) {
      console.error('Fetch error:', error);
      throw error;
    }
  },

  // Update list order status
  updateListOrderStatus: async (id, status, offlineOrderId = null) => {
    try {
      const response = await axiosInstance.patch(`/list-orders/${id}/status`, {
        status,
        offlineOrderId
      });
      return response.data;
    } catch (error) {
      console.error('Update error:', error);
      throw error;
    }
  },

  // Delete list order
  deleteListOrder: async (id) => {
    try {
      const response = await axiosInstance.delete(`/list-orders/${id}`);
      return response.data;
    } catch (error) {
      console.error('Delete error:', error);
      throw error;
    }
  },

  // Get recent list orders
  getRecentListOrders: async (limit = 10) => {
    try {
      const response = await axiosInstance.get(`/list-orders/recent?limit=${limit}`);
      return response.data;
    } catch (error) {
      console.error('Fetch error:', error);
      throw error;
    }
  },

  // Get pending count
  getPendingCount: async () => {
    try {
      const response = await axiosInstance.get(`/list-orders/pending-count`);
      return response.data;
    } catch (error) {
      console.error('Fetch error:', error);
      throw error;
    }
  }
};

export default listOrderService;
