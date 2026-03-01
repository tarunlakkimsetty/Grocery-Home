import axiosInstance from './axiosInstance';

// ============================================================
// MOCK ORDERS DATA (Cash on Delivery orders)
// ============================================================
let mockOrders = [
    {
        id: 2001,
        userId: 2,
        customerName: 'John Doe',
        customerPhone: '9876543210',
        place: 'Tatipaka',
        address: 'Kirana Street, Tatipaka, Razole Mandalam',
        items: [
            { productId: 1, name: 'Basmati Rice (5kg)', price: 420, quantity: 2, total: 840 },
            { productId: 7, name: 'Full Cream Milk (1L)', price: 62, quantity: 3, total: 186 },
        ],
        grandTotal: 1026,
        paymentType: 'Cash on Delivery',
        paymentStatus: 'Pending Payment',
        status: 'Pending',
        date: '2026-02-27T11:00:00Z',
    },
    {
        id: 2002,
        userId: 2,
        customerName: 'John Doe',
        customerPhone: '9876543210',
        place: 'Tatipaka',
        address: 'Kirana Street, Tatipaka, Razole Mandalam',
        items: [
            { productId: 19, name: 'Turmeric Powder (200g)', price: 55, quantity: 2, total: 110 },
            { productId: 25, name: 'Sunflower Oil (1L)', price: 145, quantity: 1, total: 145 },
        ],
        grandTotal: 255,
        paymentType: 'Cash on Delivery',
        paymentStatus: 'Paid',
        status: 'Verified',
        date: '2026-02-26T09:30:00Z',
    },
];

let orderNextId = 2003;

// ============================================================
// MOCK OFFLINE ORDERS DATA (created manually by admin)
// ============================================================
let mockOfflineOrders = [];
let offlineOrderNextId = 9001;

const findMockOrderById = (orderId) => {
    const id = parseInt(orderId);
    return mockOrders.find((o) => o.id === id) || mockOfflineOrders.find((o) => o.id === id);
};

// ============================================================
// Order Service
// ============================================================
const orderService = {
    // Customer: place a new COD order
    // API: POST /api/orders/online
    placeOrder: async (orderData) => {
        try {
            // Transform field names to match backend
            const payload = {
                customerName: orderData.customerName,
                phone: orderData.customerPhone || orderData.phone,
                place: orderData.place,
                address: orderData.address,
                items: orderData.items
            };
            const response = await axiosInstance.post('/orders/online', payload);
            return response.data;
        } catch {
            const newOrder = {
                id: orderNextId++,
                userId: orderData.userId,
                customerName: orderData.customerName,
                customerPhone: orderData.customerPhone,
                place: orderData.place || '',
                address: orderData.address || '',
                items: orderData.items,
                grandTotal: orderData.grandTotal,
                paymentType: 'Cash on Delivery',
                paymentStatus: 'Pending Payment',
                status: 'Pending',
                date: new Date().toISOString(),
            };
            mockOrders.push(newOrder);
            return newOrder;
        }
    },

    // Admin: get all COD orders
    // API: GET /api/orders/admin
    getAllOrders: async () => {
        try {
            const response = await axiosInstance.get('/orders/admin');
            return response.data;
        } catch {
            return [...mockOrders].sort((a, b) => new Date(b.date) - new Date(a.date));
        }
    },

    // Customer: get orders for a specific user
    // API: GET /api/orders/customer/:id
    getUserOrders: async (userId) => {
        try {
            const response = await axiosInstance.get('/orders/customer/' + userId);
            return response.data;
        } catch {
            return mockOrders
                .filter((o) => o.userId === userId)
                .sort((a, b) => new Date(b.date) - new Date(a.date));
        }
    },

    // Customer: fetch updated orders (final verified view)
    // API: GET /api/orders/customer/:customerId
    getCustomerOrders: async (customerId) => {
        try {
            const response = await axiosInstance.get('/orders/customer/' + customerId);
            return response.data;
        } catch {
            // Fallback to existing mock/user endpoint behavior
            return mockOrders
                .filter((o) => o.userId === customerId)
                .sort((a, b) => new Date(b.date) - new Date(a.date));
        }
    },

    // Admin: get single order details
    getOrderById: async (orderId) => {
        try {
            const response = await axiosInstance.get('/orders/' + orderId);
            return response.data;
        } catch {
            const order = findMockOrderById(orderId);
            if (!order) throw new Error('Order not found');
            return order;
        }
    },

    // Admin: mark order as Verified
    // API: PUT /api/orders/:id/verify
    // Some backends may accept a payload (finalItems, grandTotal). Keep it optional.
    verifyOrder: async (orderId, payload) => {
        try {
            const response = await axiosInstance.put('/orders/' + orderId + '/verify', payload);
            return response.data;
        } catch {
            const order = findMockOrderById(orderId);
            if (order) {
                order.status = 'Verified';
                if (payload && payload.items) {
                    order.items = payload.items;
                }
                if (payload && typeof payload.grandTotal === 'number') {
                    order.grandTotal = payload.grandTotal;
                }
            }
            return order;
        }
    },

    // Admin: add product to an order (before Verified)
    // API: POST /api/orders/:id/add-item
    addItemToOrder: async (orderId, productId, quantity) => {
        try {
            const response = await axiosInstance.post('/orders/' + orderId + '/add-item', {
                productId,
                quantity,
            });
            return response.data;
        } catch {
            const order = findMockOrderById(orderId);
            if (!order) throw new Error('Order not found');
            if (order.status !== 'Pending') throw new Error('Order is locked');

            const existing = order.items.find((i) => i.productId === productId);
            if (existing) {
                existing.quantity += quantity;
                existing.total = existing.price * existing.quantity;
            } else {
                // In mock mode, caller is expected to provide name/price via update-items.
                order.items.push({
                    productId,
                    name: 'New Product',
                    price: 0,
                    quantity,
                    total: 0,
                });
            }
            order.grandTotal = order.items.reduce((sum, i) => sum + (i.total || 0), 0);
            return order;
        }
    },

    // Admin: update order items before verification (final selected items)
    // API: PUT /api/orders/:id/update-items
    updateOrderBeforeVerify: async (orderId, items, grandTotal) => {
        try {
            const response = await axiosInstance.put('/orders/' + orderId + '/update-items', {
                items,
                totalAmount: grandTotal,
            });
            return response.data;
        } catch {
            const order = findMockOrderById(orderId);
            if (!order) throw new Error('Order not found');
            if (order.status !== 'Pending') throw new Error('Order is locked');

            order.items = items;
            order.grandTotal = grandTotal;
            return order;
        }
    },

    // Admin: approve payment (paymentStatus → Paid)
    // API: PUT /api/orders/:id/mark-paid
    approvePayment: async (orderId) => {
        try {
            const response = await axiosInstance.put('/orders/' + orderId + '/mark-paid');
            return response.data;
        } catch {
            const order = findMockOrderById(orderId);
            if (order) order.paymentStatus = 'Paid';
            return order;
        }
    },

    // Admin: mark order as Delivered (requires paymentStatus === 'Paid')
    deliverOrder: async (orderId) => {
        try {
            const response = await axiosInstance.put('/orders/' + orderId + '/deliver');
            return response.data;
        } catch {
            const order = findMockOrderById(orderId);
            if (order) order.status = 'Delivered';
            return order;
        }
    },

    // ─────────────────────────────────────────────────────────────────────────
    // OFFLINE ORDERS (Admin)
    // ─────────────────────────────────────────────────────────────────────────

    // Create Offline Order
    // API: POST /api/orders/offline
    createOfflineOrder: async (payload) => {
        try {
            const response = await axiosInstance.post('/orders/offline', payload);
            return response.data;
        } catch {
            const nowIso = new Date().toISOString();
            const orderDate = payload.orderDate || nowIso;
            const newOrder = {
                id: offlineOrderNextId++,
                customerName: payload.customerName,
                customerPhone: payload.phone,
                place: payload.place,
                address: payload.address || '',
                items: payload.items || [],
                grandTotal: payload.totalAmount || 0,
                paymentType: 'Cash',
                paymentStatus: payload.status === 'Paid' ? 'Paid' : 'Pending Payment',
                status: payload.status || 'Pending',
                orderType: payload.orderType || 'Offline',
                // Backend should return `orderDate`; keep `date` for compatibility with existing code.
                orderDate: orderDate,
                date: orderDate,
            };
            mockOfflineOrders.push(newOrder);
            return newOrder;
        }
    },

    // Fetch Offline Orders
    // API: GET /api/orders/offline
    getOfflineOrders: async () => {
        try {
            const response = await axiosInstance.get('/orders/offline');
            return response.data;
        } catch {
            return [...mockOfflineOrders].sort(
                (a, b) =>
                    new Date(b.orderDate || b.date) - new Date(a.orderDate || a.date)
            );
        }
    },

    // Update Offline/Online Order
    // API: PUT /api/orders/:id
    updateOrder: async (orderId, data) => {
        try {
            const response = await axiosInstance.put('/orders/' + orderId, data);
            return response.data;
        } catch {
            const order = findMockOrderById(orderId);
            if (!order) throw new Error('Order not found');
            Object.assign(order, data);
            return order;
        }
    },

    // Admin: update order items (edited quantities)
    // API: PUT /api/orders/:id/update-items
    updateOrderItems: async (orderId, items, grandTotal) => {
        try {
            const response = await axiosInstance.put('/orders/' + orderId + '/update-items', { items, totalAmount: grandTotal });
            return response.data;
        } catch {
            const order = mockOrders.find((o) => o.id === parseInt(orderId));
            if (order) {
                order.items = items;
                order.grandTotal = grandTotal;
            }
            return order;
        }
    },
};

export default orderService;
