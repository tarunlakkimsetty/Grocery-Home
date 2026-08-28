import axiosInstance from './axiosInstance';

const announcementService = {
    getAnnouncements: async () => {
        const response = await axiosInstance.get('/admin/announcements');
        return response.data;
    },
    getActiveAnnouncements: async () => {
        const response = await axiosInstance.get('/announcements/active');
        return response.data;
    },
    createAnnouncement: async (payload) => {
        const response = await axiosInstance.post('/admin/announcements', payload);
        return response.data;
    },
    updateAnnouncement: async (id, payload) => {
        const response = await axiosInstance.put(`/admin/announcements/${id}`, payload);
        return response.data;
    },
    toggleAnnouncementStatus: async (id, status) => {
        const response = await axiosInstance.patch(`/admin/announcements/${id}/status`, { status });
        return response.data;
    },
    deleteAnnouncement: async (id) => {
        const response = await axiosInstance.delete(`/admin/announcements/${id}`);
        return response.data;
    },
};

export default announcementService;
