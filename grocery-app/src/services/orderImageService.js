import axiosInstance from './axiosInstance';

const orderImageService = {
    getOrderImages: async ({ entityType, entityId }) => {
        try {
            const response = await axiosInstance.get('/order-images', {
                params: { entityType, entityId },
            });
            return response.data;
        } catch (error) {
            const message = String(error?.message || '').toLowerCase();
            if (
                message.includes('resource not found') ||
                message.includes('not found') ||
                message.includes('/api/order-images')
            ) {
                return { success: true, count: 0, data: [] };
            }
            throw error;
        }
    },

    uploadOrderImages: async ({ entityType, entityId, orderType, files }) => {
        const formData = new FormData();
        formData.append('entityType', entityType);
        formData.append('entityId', String(entityId));

        if (orderType) {
            formData.append('orderType', orderType);
        }

        (Array.isArray(files) ? files : []).forEach((file) => {
            formData.append('images', file);
        });

        const response = await axiosInstance.post('/order-images', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });

        return response.data;
    },

    deleteOrderImage: async (imageId) => {
        const response = await axiosInstance.delete(`/order-images/${imageId}`);
        return response.data;
    },
};

export default orderImageService;