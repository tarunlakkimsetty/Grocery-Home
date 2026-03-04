import axiosInstance from './axiosInstance';

// ============================================================
// MOCK ORDERS DATA (Cash on Delivery orders)
// ============================================================
let mockOrders = [
    {
        id: 2001,
        userId: 2,
        customerName: 'John Doe',
        customerPhone: '',
        place: 'Tatipaka',
        address: 'Kirana Street, Tatipaka, Razole Mandalam',
        items: [
            { productId: 1, name: 'Basmati Rice (5kg)', price: 420, quantity: 2, total: 840 },
            { productId: 7, name: 'Full Cream Milk (1L)', price: 62, quantity: 3, total: 186 },
        ],
        grandTotal: 1026,
        advanceAmount: 0,
        paymentType: 'Cash on Delivery',
        paymentStatus: 'Pending Payment',
        status: 'Pending Acceptance',
        date: '2026-02-27T11:00:00Z',
    },
    {
        id: 2002,
        userId: 2,
        customerName: 'John Doe',
        customerPhone: '',
        place: 'Tatipaka',
        address: 'Kirana Street, Tatipaka, Razole Mandalam',
        items: [
            { productId: 19, name: 'Turmeric Powder (200g)', price: 55, quantity: 2, total: 110 },
            { productId: 25, name: 'Sunflower Oil (1L)', price: 145, quantity: 1, total: 145 },
        ],
        grandTotal: 255,
        advanceAmount: 0,
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
            // Do NOT transform the payload; send exactly what the frontend built.
            const response = await axiosInstance.post('/orders/online', orderData);
            return response.data;
        } catch {
            const newOrder = {
                id: orderNextId++,
                userId: orderData.userId,
                customerName: orderData.customerName,
                customerPhone: orderData.phone,
                place: orderData.place || '',
                address: orderData.address || '',
                items: orderData.items,
                grandTotal: orderData.totalAmount,
                paymentType: orderData.paymentMethod || 'Cash on Delivery',
                paymentStatus: 'Pending Payment',
                status: 'Pending Acceptance',
                date: new Date().toISOString(),
            };
            mockOrders.push(newOrder);
            return newOrder;
        }
    },

    // Admin: get all COD orders
    // API: GET /api/orders/admin
    getAllOrders: async (search) => {
        try {
            const response = await axiosInstance.get('/orders/admin', {
                params: {
                    orderType: 'Online',
                    view: 'active',
                    search: typeof search === 'string' && search.trim() ? search.trim() : undefined,
                },
            });

            const data = response.data;
            // Backend returns: { success: true, orders: [...], pagination: {...} }
            if (Array.isArray(data)) return data;
            return data?.orders || data?.data?.orders || data?.data || [];
        } catch {
            return [...mockOrders].sort((a, b) => new Date(b.date) - new Date(a.date));
        }
    },

    // Admin: get Delivered/Rejected orders for Bills page
    // API: GET /api/orders/admin?orderType=Online|Offline&view=bills
    getBillsOrders: async (orderType, search) => {
        try {
            const response = await axiosInstance.get('/orders/admin', {
                params: {
                    orderType,
                    view: 'bills',
                    search: typeof search === 'string' && search.trim() ? search.trim() : undefined,
                },
            });
            const data = response.data;
            if (Array.isArray(data)) return data;
            return data?.orders || data?.data?.orders || data?.data || [];
        } catch {
            const source = String(orderType || '').toLowerCase() === 'offline' ? mockOfflineOrders : mockOrders;
            return [...source]
                .filter((o) => o.status === 'Completed' || o.status === 'Rejected')
                .sort((a, b) => new Date(b.orderDate || b.date) - new Date(a.orderDate || a.date));
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

    // Customer: get offline orders for the logged-in user
    // API: GET /api/user/offline-orders
    getUserOfflineOrders: async () => {
        try {
            const response = await axiosInstance.get('/user/offline-orders');
            return response.data;
        } catch {
            // No mock fallback to avoid leaking/mixing offline data.
            return { success: true, orders: [] };
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

    // Admin: get printable bill data for any order status
    // API: GET /api/orders/:id/print
    getPrintableBill: async (orderId) => {
        const mapOrderToPrintableBill = (order) => {
            const safeOrder = order || {};
            const items = Array.isArray(safeOrder.items)
                ? safeOrder.items.map((item) => {
                    const quantity = Number(item?.quantity || 0) || 0;
                    const price = Number(item?.price || 0) || 0;
                    const subtotal = Number(item?.subtotal || item?.total || quantity * price || 0) || 0;
                    return {
                        productId: item?.productId,
                        productName: item?.name || item?.productName || '',
                        quantity,
                        price,
                        subtotal,
                    };
                })
                : [];

            const computedTotal = items.reduce((sum, item) => sum + (Number(item?.subtotal || 0) || 0), 0);
            const totalAmount = Number(safeOrder.totalAmount ?? safeOrder.grandTotal ?? computedTotal ?? 0) || 0;
            const advanceAmount = Number(safeOrder.advanceAmount || 0) || 0;

            return {
                success: true,
                bill: {
                    shop: {
                        name: 'Om Sri Satya Sai Rama Kirana And General Merchants',
                        address: 'Kirana Street, Tatipaka, Razole Mandalam, Dr. B.R. Ambedkar Konaseema District',
                        phone: '9441754505',
                        gst: null,
                    },
                    order: {
                        id: safeOrder.id,
                        orderType: safeOrder.orderType || 'Online',
                        orderDate: safeOrder.orderDate || safeOrder.date || safeOrder.createdAt || new Date().toISOString(),
                        status: safeOrder.status || 'Pending',
                        paymentStatus: safeOrder.paymentStatus || 'Unpaid',
                        customerName: safeOrder.customerName || '',
                        customerPhone: safeOrder.phone || safeOrder.customerPhone || '',
                        customerAddress: safeOrder.address || '',
                        place: safeOrder.place || '',
                    },
                    items,
                    totals: {
                        totalAmount,
                        advanceAmount,
                        remainingBalance: totalAmount - advanceAmount,
                    },
                },
            };
        };

        try {
            const response = await axiosInstance.get('/orders/' + orderId);
            const apiOrder = response?.data?.order || response?.data;
            if (apiOrder) {
                return mapOrderToPrintableBill(apiOrder);
            }
        } catch {
            try {
                const printResponse = await axiosInstance.get('/orders/' + orderId + '/print');
                if (printResponse?.data) return printResponse.data;
            } catch {
                // continue to mock fallback
            }

            const order = findMockOrderById(orderId);
            if (!order) throw new Error('Order not found');

            return mapOrderToPrintableBill(order);
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
                order.isVerified = true;
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
            if (order.status !== 'Accepted') throw new Error('Order is locked');

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
            if (order.status !== 'Accepted') throw new Error('Order is locked');

            order.items = items;
            order.grandTotal = grandTotal;
            return order;
        }
    },

    // Admin: accept online order
    // API: PUT /api/orders/:id/accept
    acceptOrder: async (orderId) => {
        try {
            const response = await axiosInstance.put('/orders/' + orderId + '/accept');
            return response.data;
        } catch (error) {
            throw error;
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
            if (order) {
                order.isPaid = true;
                order.paymentStatus = 'Paid';
                order.status = order.isDelivered ? 'Completed' : 'Paid';
            }
            return order;
        }
    },

    // Admin: update status (Paid/Delivered/etc)
    // API: PUT /api/orders/:id/status
    updateOrderStatus: async (orderId, status) => {
        try {
            const response = await axiosInstance.put('/orders/' + orderId + '/status', { status });
            return response.data;
        } catch {
            const order = findMockOrderById(orderId);
            if (order) order.status = status;
            return order;
        }
    },

    // Admin: update advance amount
    // API: PUT /api/orders/:id/advance
    updateAdvanceAmount: async (orderId, advanceAmount) => {
        try {
            const response = await axiosInstance.put('/orders/' + orderId + '/advance', { advanceAmount });
            return response.data;
        } catch {
            const order = findMockOrderById(orderId);
            if (!order) throw new Error('Order not found');

            const status = String(order.status || '').trim().toLowerCase();
            const paymentStatus = String(order.paymentStatus || '').trim().toLowerCase();
            const isLocked = Boolean(order.isPaid) || paymentStatus === 'paid' || status === 'paid' || status === 'completed' || status === 'mark paid';
            if (isLocked) throw new Error('Advance amount cannot be updated after Paid/Completed');

            const num = Number(advanceAmount);
            if (!Number.isFinite(num) || num < 0) throw new Error('Invalid advance amount');

            order.advanceAmount = num;
            return { success: true, order };
        }
    },

    // Admin: mark order as Delivered (requires paymentStatus === 'Paid')
    deliverOrder: async (orderId) => {
        try {
            const response = await axiosInstance.put('/orders/' + orderId + '/deliver');
            return response.data;
        } catch {
            const order = findMockOrderById(orderId);
            if (order) {
                order.isDelivered = true;
                order.status = order.isPaid ? 'Completed' : 'Delivered';
            }
            return order;
        }
    },

    // Admin: reject order (Pending only)
    // API: PUT /api/orders/:id/reject
    rejectOrder: async (orderId) => {
        try {
            const response = await axiosInstance.put('/orders/' + orderId + '/reject');
            return response.data;
        } catch {
            const order = findMockOrderById(orderId);
            if (order) order.status = 'Rejected';
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
                advanceAmount: 0,
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
    // API: GET /api/orders/admin?view=active&orderType=offline
    getOfflineOrders: async (search) => {
        try {
            const response = await axiosInstance.get('/orders/admin', {
                params: {
                    orderType: 'Offline',
                    view: 'active',
                    search: typeof search === 'string' && search.trim() ? search.trim() : undefined,
                },
            });
            const data = response.data;
            if (Array.isArray(data)) return data;
            return data?.orders || data?.data?.orders || data?.data || [];
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
