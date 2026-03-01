import axiosInstance from './axiosInstance';

// ============================================================
// MOCK DATA — used when no backend is running
// ============================================================
const MOCK_USERS = [
    { id: 1, name: 'Admin User', email: 'admin@grocery.com', password: 'admin123', phone: '9876543210', role: 'admin' },
    { id: 2, name: 'John Customer', email: 'john@grocery.com', password: 'john1234', phone: '9876543211', role: 'customer' },
];

let mockUserStore = [...MOCK_USERS];
let nextId = 3;

function generateMockToken(user) {
    return btoa(
        JSON.stringify({
            id: user.id,
            role: user.role,
            name: user.name,
            phone: user.phone,
            // keep email for backward compatibility (may be undefined for phone-only users)
            email: user.email,
        })
    );
}

function decodeMockToken(token) {
    try {
        return JSON.parse(atob(token));
    } catch {
        return null;
    }
}

// ============================================================
// Auth Service
// ============================================================
const authService = {
    login: async (phone, password) => {
        try {
            const response = await axiosInstance.post('/auth/login', { phone, password });
            // Normalize user object (backend uses fullName, frontend uses name)
            const data = response.data;
            if (data.user) {
                data.user.name = data.user.fullName || data.user.name;
            }
            return data;
        } catch (err) {
            // Check if it's a handled error from axiosInstance
            if (err.message && !err.response) {
                throw err;
            }
            // Fallback to mock
            const cleanedPhone = String(phone || '').replace(/\\D/g, '');
            const user = mockUserStore.find(
                (u) => String(u.phone) === cleanedPhone && u.password === password
            );
            if (!user) {
                throw new Error('Invalid phone or password');
            }
            const token = generateMockToken(user);
            const { password: _, ...userData } = user;
            return { success: true, token, user: userData };
        }
    },

    register: async (data) => {
        try {
            const response = await axiosInstance.post('/auth/register', data);
            // Normalize user object (backend uses fullName, frontend uses name)
            const result = response.data;
            if (result.user) {
                result.user.name = result.user.fullName || result.user.name;
            }
            return result;
        } catch (err) {
            // Check if it's a handled error from axiosInstance
            if (err.message && !err.response) {
                throw err;
            }
            // Fallback to mock
            const cleanedPhone = String(data.phone || '').replace(/\\D/g, '');
            const exists = mockUserStore.find((u) => String(u.phone) === cleanedPhone);
            if (exists) {
                throw new Error('Phone number already registered');
            }

            const fullName = data.fullName || data.name;
            const newUser = {
                id: nextId++,
                name: fullName,
                email: data.email, // optional
                password: data.password,
                phone: cleanedPhone,
                role: 'customer',
            };
            mockUserStore.push(newUser);
            const token = generateMockToken(newUser);
            const { password: _, ...userData } = newUser;
            return { success: true, token, user: userData };
        }
    },

    getCurrentUser: () => {
        const token = localStorage.getItem('token');
        if (!token) return null;
        const stored = localStorage.getItem('user');
        if (stored) {
            try {
                return JSON.parse(stored);
            } catch {
                return decodeMockToken(token);
            }
        }
        return decodeMockToken(token);
    },

    logout: () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
    },
};

export default authService;
