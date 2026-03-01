import axiosInstance from './axiosInstance';

// ============================================================
// MOCK BILLS DATA
// ============================================================
let mockBills = [
    {
        id: 1001,
        userId: 2,
        date: '2026-02-25T10:30:00Z',
        items: [
            { productId: 1, name: 'Basmati Rice (5kg)', price: 420, quantity: 2, total: 840 },
            { productId: 7, name: 'Full Cream Milk (1L)', price: 62, quantity: 3, total: 186 },
            { productId: 19, name: 'Turmeric Powder (200g)', price: 55, quantity: 1, total: 55 },
        ],
        grandTotal: 1081,
        paymentMethod: 'UPI',
    },
    {
        id: 1002,
        userId: 2,
        date: '2026-02-26T14:15:00Z',
        items: [
            { productId: 13, name: 'Potato Chips Classic', price: 30, quantity: 5, total: 150 },
            { productId: 30, name: 'Tomato Ketchup (500g)', price: 105, quantity: 1, total: 105 },
        ],
        grandTotal: 255,
        paymentMethod: 'Cash',
    },
    {
        id: 1003,
        userId: 2,
        date: '2026-02-27T09:00:00Z',
        items: [
            { productId: 35, name: 'Dish Wash Liquid (500ml)', price: 85, quantity: 2, total: 170 },
            { productId: 40, name: 'Toothpaste (150g)', price: 95, quantity: 1, total: 95 },
            { productId: 42, name: 'Bath Soap (4-pack)', price: 120, quantity: 1, total: 120 },
        ],
        grandTotal: 385,
        paymentMethod: 'Card',
    },
];

let billNextId = 1004;

// ============================================================
// Bill Service
// ============================================================
const billService = {
    generateBill: async (billData) => {
        try {
            const response = await axiosInstance.post('/bills', billData);
            return response.data;
        } catch {
            const newBill = {
                id: billNextId++,
                userId: billData.userId,
                date: new Date().toISOString(),
                items: billData.items,
                grandTotal: billData.grandTotal,
                paymentMethod: billData.paymentMethod,
            };
            mockBills.push(newBill);
            return newBill;
        }
    },

    getBillHistory: async (userId) => {
        try {
            const response = await axiosInstance.get('/bills/history', { params: { userId } });
            return response.data;
        } catch {
            return mockBills
                .filter((b) => b.userId === userId)
                .sort((a, b) => new Date(b.date) - new Date(a.date));
        }
    },

    getBillDetails: async (billId) => {
        try {
            const response = await axiosInstance.get(`/bills/${billId}`);
            return response.data;
        } catch {
            const bill = mockBills.find((b) => b.id === parseInt(billId));
            if (!bill) throw new Error('Bill not found');
            return bill;
        }
    },

    getAllBills: async () => {
        try {
            const response = await axiosInstance.get('/bills');
            return response.data;
        } catch {
            return [...mockBills].sort((a, b) => new Date(b.date) - new Date(a.date));
        }
    },
};

export default billService;
