import axios from 'axios';

const axiosInstance = axios.create({
    baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000/api',
    headers: {
        'Content-Type': 'application/json',
    },
    timeout: 30000, // 30 second timeout
});

// Request interceptor — attach JWT token
axiosInstance.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Response interceptor — handle errors
axiosInstance.interceptors.response.use(
    (response) => response,
    (error) => {
        // Handle network errors
        if (!error.response) {
            console.error('Network error:', error.message);
            return Promise.reject(new Error('Network error. Please check your connection.'));
        }

        const { status, data } = error.response;

        // Handle 401 Unauthorized (token expired or invalid)
        if (status === 401) {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            // Only redirect if not already on login page
            if (!window.location.pathname.includes('/login')) {
                window.location.href = '/login';
            }
            return Promise.reject(new Error(data?.message || 'Session expired. Please login again.'));
        }

        // Handle 403 Forbidden (insufficient permissions)
        if (status === 403) {
            return Promise.reject(new Error(data?.message || 'Access denied. Insufficient permissions.'));
        }

        // Handle 404 Not Found
        if (status === 404) {
            return Promise.reject(new Error(data?.message || 'Resource not found.'));
        }

        // Handle 400 Bad Request (validation errors)
        if (status === 400) {
            const errorMessage = data?.errors
                ? data.errors.map(e => e.message).join(', ')
                : data?.message || 'Invalid request.';
            return Promise.reject(new Error(errorMessage));
        }

        // Handle 429 Too Many Requests (rate limiting)
        if (status === 429) {
            return Promise.reject(new Error(data?.message || 'Too many requests. Please try again later.'));
        }

        // Handle 500 Internal Server Error
        if (status >= 500) {
            return Promise.reject(new Error('Server error. Please try again later.'));
        }

        // Default error handling
        return Promise.reject(new Error(data?.message || 'An unexpected error occurred.'));
    }
);

export default axiosInstance;
