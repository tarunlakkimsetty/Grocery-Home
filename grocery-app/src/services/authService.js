import axiosInstance from './axiosInstance';

// ============================================================
// Auth Service
// ============================================================
const authService = {
    login: async (phone, password) => {
        const response = await axiosInstance.post('/auth/login', { phone, password });
        // Normalize user object (backend uses fullName, frontend uses name)
        const data = response.data;
        if (data.user) {
            data.user.name = data.user.fullName || data.user.name;
        }
        return data;
    },

    register: async (data) => {
        const response = await axiosInstance.post('/auth/register', data);
        // Normalize user object (backend uses fullName, frontend uses name)
        const result = response.data;
        if (result.user) {
            result.user.name = result.user.fullName || result.user.name;
        }
        return result;
    },

    getCurrentUser: () => {
        const stored = localStorage.getItem('user');
        if (stored) {
            try {
                return JSON.parse(stored);
            } catch {}
        }
        return null;
    },

    logout: () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
    },

    // Password Reset - Step 1: Verify phone
    verifyPhoneForReset: async (phone) => {
        const response = await axiosInstance.post('/auth/forgot-password/verify-phone', { phone });
        return response.data;
    },

    // Password Reset - Step 2: Verify security answers
    verifySecurityAnswers: async (phone, favoriteFood, favoritePlace) => {
        const response = await axiosInstance.post('/auth/forgot-password/verify-answers', {
            phone,
            favoriteFood,
            favoritePlace
        });
        return response.data;
    },

    // Password Reset - Step 3: Reset password
    resetPassword: async (phone, newPassword, confirmPassword) => {
        const response = await axiosInstance.post('/auth/forgot-password/reset', {
            phone,
            newPassword,
            confirmPassword
        });
        return response.data;
    },
};

export default authService;
