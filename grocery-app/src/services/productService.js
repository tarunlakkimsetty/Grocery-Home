import axiosInstance from './axiosInstance';

// ============================================================
// MOCK PRODUCTS DATA
// ============================================================
const MOCK_PRODUCTS = [
    // Grains, Rice & Pulses
    { id: 1, name: 'Basmati Rice (5kg)', category: 'grains', price: 420, stock: 50, unit: 'pack', emoji: '🌾' },
    { id: 2, name: 'Toor Dal (1kg)', category: 'grains', price: 140, stock: 80, unit: 'pack', emoji: '🫘' },
    { id: 3, name: 'Wheat Flour Atta (5kg)', category: 'grains', price: 260, stock: 60, unit: 'pack', emoji: '🌾' },
    { id: 4, name: 'Moong Dal (1kg)', category: 'grains', price: 160, stock: 45, unit: 'pack', emoji: '🫘' },
    { id: 5, name: 'Chana Dal (1kg)', category: 'grains', price: 100, stock: 70, unit: 'pack', emoji: '🫘' },
    { id: 6, name: 'Brown Rice (2kg)', category: 'grains', price: 220, stock: 30, unit: 'pack', emoji: '🍚' },
    // Milk
    { id: 7, name: 'Full Cream Milk (1L)', category: 'milk', price: 62, stock: 100, unit: 'packet', emoji: '🥛' },
    { id: 8, name: 'Toned Milk (500ml)', category: 'milk', price: 28, stock: 120, unit: 'packet', emoji: '🥛' },
    { id: 9, name: 'Curd (400g)', category: 'milk', price: 40, stock: 60, unit: 'cup', emoji: '🍶' },
    { id: 10, name: 'Paneer (200g)', category: 'milk', price: 90, stock: 40, unit: 'pack', emoji: '🧀' },
    { id: 11, name: 'Butter (100g)', category: 'milk', price: 52, stock: 55, unit: 'pack', emoji: '🧈' },
    { id: 12, name: 'Ghee (500ml)', category: 'milk', price: 310, stock: 35, unit: 'jar', emoji: '🫙' },
    // Snacks
    { id: 13, name: 'Potato Chips Classic', category: 'snacks', price: 30, stock: 200, unit: 'pack', emoji: '🍿' },
    { id: 14, name: 'Namkeen Mix (400g)', category: 'snacks', price: 120, stock: 90, unit: 'pack', emoji: '🥨' },
    { id: 15, name: 'Biscuits Cream (150g)', category: 'snacks', price: 35, stock: 150, unit: 'pack', emoji: '🍪' },
    { id: 16, name: 'Instant Noodles (4-pack)', category: 'snacks', price: 56, stock: 110, unit: 'pack', emoji: '🍜' },
    { id: 17, name: 'Peanut Butter (350g)', category: 'snacks', price: 185, stock: 40, unit: 'jar', emoji: '🥜' },
    { id: 18, name: 'Muesli (500g)', category: 'snacks', price: 280, stock: 25, unit: 'pack', emoji: '🥣' },
    // Spices
    { id: 19, name: 'Turmeric Powder (200g)', category: 'spices', price: 55, stock: 80, unit: 'pack', emoji: '🌿' },
    { id: 20, name: 'Red Chilli Powder (200g)', category: 'spices', price: 65, stock: 75, unit: 'pack', emoji: '🌶️' },
    { id: 21, name: 'Garam Masala (100g)', category: 'spices', price: 78, stock: 60, unit: 'pack', emoji: '🫙' },
    { id: 22, name: 'Cumin Seeds (100g)', category: 'spices', price: 45, stock: 90, unit: 'pack', emoji: '🌱' },
    { id: 23, name: 'Coriander Powder (200g)', category: 'spices', price: 40, stock: 85, unit: 'pack', emoji: '🌿' },
    { id: 24, name: 'Black Pepper (50g)', category: 'spices', price: 60, stock: 50, unit: 'pack', emoji: '⚫' },
    // Oils
    { id: 25, name: 'Sunflower Oil (1L)', category: 'oils', price: 150, stock: 70, unit: 'bottle', emoji: '🌻' },
    { id: 26, name: 'Mustard Oil (1L)', category: 'oils', price: 180, stock: 55, unit: 'bottle', emoji: '🫗' },
    { id: 27, name: 'Olive Oil Extra Virgin (500ml)', category: 'oils', price: 480, stock: 20, unit: 'bottle', emoji: '🫒' },
    { id: 28, name: 'Coconut Oil (500ml)', category: 'oils', price: 130, stock: 65, unit: 'bottle', emoji: '🥥' },
    { id: 29, name: 'Groundnut Oil (1L)', category: 'oils', price: 200, stock: 40, unit: 'bottle', emoji: '🥜' },
    // Condiments
    { id: 30, name: 'Tomato Ketchup (500g)', category: 'condiments', price: 105, stock: 85, unit: 'bottle', emoji: '🍅' },
    { id: 31, name: 'Soy Sauce (200ml)', category: 'condiments', price: 65, stock: 50, unit: 'bottle', emoji: '🫙' },
    { id: 32, name: 'Vinegar (500ml)', category: 'condiments', price: 45, stock: 60, unit: 'bottle', emoji: '🍶' },
    { id: 33, name: 'Mayonnaise (250g)', category: 'condiments', price: 95, stock: 40, unit: 'jar', emoji: '🥫' },
    { id: 34, name: 'Green Chutney (200g)', category: 'condiments', price: 55, stock: 30, unit: 'pack', emoji: '🌿' },
    // Cleaning Supplies
    { id: 35, name: 'Dish Wash Liquid (500ml)', category: 'cleaning', price: 85, stock: 90, unit: 'bottle', emoji: '🧴' },
    { id: 36, name: 'Floor Cleaner (1L)', category: 'cleaning', price: 120, stock: 70, unit: 'bottle', emoji: '🧹' },
    { id: 37, name: 'Laundry Detergent (1kg)', category: 'cleaning', price: 195, stock: 55, unit: 'pack', emoji: '🧺' },
    { id: 38, name: 'Toilet Cleaner (500ml)', category: 'cleaning', price: 75, stock: 80, unit: 'bottle', emoji: '🚽' },
    { id: 39, name: 'Glass Cleaner (500ml)', category: 'cleaning', price: 110, stock: 45, unit: 'bottle', emoji: '🪟' },
    // Personal Care & Hygiene
    { id: 40, name: 'Toothpaste (150g)', category: 'personal', price: 95, stock: 100, unit: 'tube', emoji: '🪥' },
    { id: 41, name: 'Shampoo (200ml)', category: 'personal', price: 160, stock: 70, unit: 'bottle', emoji: '🧴' },
    { id: 42, name: 'Bath Soap (4-pack)', category: 'personal', price: 120, stock: 80, unit: 'pack', emoji: '🧼' },
    { id: 43, name: 'Hand Wash (250ml)', category: 'personal', price: 75, stock: 90, unit: 'bottle', emoji: '🧴' },
    { id: 44, name: 'Face Wash (100ml)', category: 'personal', price: 135, stock: 50, unit: 'tube', emoji: '✨' },
    { id: 45, name: 'Deodorant (150ml)', category: 'personal', price: 195, stock: 40, unit: 'can', emoji: '💨' },
];

let mockProductStore = [...MOCK_PRODUCTS];
let productNextId = 46;

// ============================================================
// Product Service
// ============================================================
const productService = {
    getProducts: async (category) => {
        try {
            const params = category ? { category } : {};
            const response = await axiosInstance.get('/products', { params });
            return response.data;
        } catch {
            if (category) {
                return mockProductStore.filter((p) => p.category === category);
            }
            return [...mockProductStore];
        }
    },

    getProductById: async (id) => {
        try {
            const response = await axiosInstance.get(`/products/${id}`);
            return response.data;
        } catch {
            return mockProductStore.find((p) => p.id === parseInt(id)) || null;
        }
    },

    addProduct: async (product) => {
        try {
            console.log('productService.addProduct sending:', product);
            const response = await axiosInstance.post('/products', product);
            console.log('productService.addProduct response:', response.data);
            return response.data;
        } catch (err) {
            console.error('productService.addProduct error:', err.response?.data || err.message);
            throw err;
        }
    },

    updateProduct: async (id, data) => {
        try {
            const response = await axiosInstance.put(`/products/${id}`, data);
            return response.data;
        } catch {
            const idx = mockProductStore.findIndex((p) => p.id === parseInt(id));
            if (idx !== -1) {
                mockProductStore[idx] = { ...mockProductStore[idx], ...data };
                return mockProductStore[idx];
            }
            throw new Error('Product not found');
        }
    },

    updateStock: async (id, stock) => {
        try {
            const response = await axiosInstance.patch(`/products/${id}/stock`, { stock });
            return response.data;
        } catch {
            const idx = mockProductStore.findIndex((p) => p.id === parseInt(id));
            if (idx !== -1) {
                mockProductStore[idx].stock = stock;
                return mockProductStore[idx];
            }
            throw new Error('Product not found');
        }
    },

    deleteProduct: async (id) => {
        try {
            await axiosInstance.delete(`/products/${id}`);
            return { success: true };
        } catch {
            const idx = mockProductStore.findIndex((p) => p.id === parseInt(id));
            if (idx !== -1) {
                mockProductStore.splice(idx, 1);
                return { success: true };
            }
            throw new Error('Product not found');
        }
    },
};

export default productService;
