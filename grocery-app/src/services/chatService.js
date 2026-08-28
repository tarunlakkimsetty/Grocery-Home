import axiosInstance from './axiosInstance';

const unwrap = (response) => response?.data || {};

const chatService = {
    getCustomerConversation: async () => unwrap(await axiosInstance.get('/chat/conversation')),
    sendCustomerMessage: async (message) => unwrap(await axiosInstance.post('/chat/messages', { message })),
    markCustomerRead: async () => unwrap(await axiosInstance.patch('/chat/read')),
    getCustomerUnreadCount: async () => unwrap(await axiosInstance.get('/chat/unread-count')),
    getAdminChats: async (search = '') => unwrap(await axiosInstance.get('/admin/chats', { params: { search: search || undefined } })),
    getAdminChat: async (customerId) => unwrap(await axiosInstance.get(`/admin/chats/${customerId}`)),
    sendAdminMessage: async (customerId, message) => unwrap(await axiosInstance.post(`/admin/chats/${customerId}/messages`, { message })),
    markAdminRead: async (customerId) => unwrap(await axiosInstance.patch(`/admin/chats/${customerId}/read`)),
    getAdminUnreadCount: async () => unwrap(await axiosInstance.get('/admin/chats/unread-count')),
};

export default chatService;
