const Order = require('../models/orderModel');
const Product = require('../models/productModel');
const { promisePool } = require('../config/db');

/**
 * @desc    Create online order
 * @route   POST /api/orders/online
 * @access  Customer (authenticated)
 */
const createOnlineOrder = async (req, res, next) => {
    try {
        console.log('Incoming Online Order:', req.body);

        const {
            customerName,
            phone,
            place,
            address,
            items,
            totalAmount: providedTotalAmount,
            paymentMethod
        } = req.body || {};

        const safeItems = Array.isArray(items) ? items : [];
        const customerId = req.user.id;

        // Validate required fields
        if (!customerName || !phone || safeItems.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Missing required order fields',
                received: req.body
            });
        }

        // Optional-but-expected fields for COD flow (don’t block if empty strings were sent)
        const totalAmountNum = Number(providedTotalAmount);
        if (!Number.isFinite(totalAmountNum)) {
            return res.status(400).json({
                success: false,
                message: 'Total amount required',
                received: req.body
            });
        }

        if (!paymentMethod) {
            return res.status(400).json({
                success: false,
                message: 'Payment method required',
                received: req.body
            });
        }

        // Validate and calculate totals
        let totalAmount = 0;
        const orderItems = [];

        for (const item of safeItems) {
            const productId = Number(item?.productId ?? item?.id);
            const quantity = Number(item?.quantity);

            if (!Number.isInteger(productId) || productId <= 0 || !Number.isInteger(quantity) || quantity <= 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid order payload (items must include productId and quantity as positive integers)',
                    received: req.body
                });
            }

            const product = await Product.findById(productId);
            if (!product) {
                return res.status(400).json({
                    success: false,
                    message: `Product with ID ${productId} not found`
                });
            }

            if (product.stock < quantity) {
                return res.status(400).json({
                    success: false,
                    message: `Insufficient stock for ${product.name}. Available: ${product.stock}`
                });
            }

            const itemTotal = product.price * quantity;
            totalAmount += itemTotal;

            orderItems.push({
                productId: product.id,
                productName: product.name,
                price: product.price,
                quantity
            });
        }

        // Create order
        const order = await Order.createOnlineOrder(
            {
                customerId,
                customerName,
                phone,
                place,
                address,
                totalAmount
            },
            orderItems
        );

        console.log('Saved Order:', order);

        res.status(201).json({
            success: true,
            message: 'Order placed successfully',
            order
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Get customer orders
 * @route   GET /api/orders/customer/:id
 * @access  Customer (own orders) or Admin
 */
const getCustomerOrders = async (req, res, next) => {
    try {
        const { id } = req.params;

        // Check authorization (customer can only view own orders)
        if (req.user.role !== 'admin' && req.user.id !== parseInt(id)) {
            return res.status(403).json({
                success: false,
                message: 'Access denied. You can only view your own orders.'
            });
        }

        const orders = await Order.findByCustomerId(id);

        res.status(200).json({
            success: true,
            count: orders.length,
            orders
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Get all orders (admin view)
 * @route   GET /api/orders/admin
 * @access  Admin only
 */
const getAdminOrders = async (req, res, next) => {
    try {
        const { page = 1, limit = 50, status, orderType, view, search } = req.query;

        // Normalize orderType so frontend can send: online/offline or Online/Offline
        let normalizedOrderType = orderType || null;
        if (typeof normalizedOrderType === 'string') {
            const lower = normalizedOrderType.toLowerCase();
            if (lower === 'online') normalizedOrderType = 'Online';
            if (lower === 'offline') normalizedOrderType = 'Offline';
        }

        let sortBy = null;
        if (view === 'bills') {
            sortBy = 'updatedAt';
        }

        const result = await Order.findAll({
            page: parseInt(page),
            limit: parseInt(limit),
            status: status || null,
            orderType: normalizedOrderType,
            sortBy,
            view: view || null,
            search: typeof search === 'string' && search.trim() ? search.trim() : null
        });

        const normalizedOrders = (result?.orders || []).map((order) => {
            const items = Array.isArray(order?.items) ? order.items : [];
            const normalizedItems = items.map((item) => {
                const price = Number(item?.price || 0) || 0;
                const quantity = Number(item?.quantity || 0) || 0;
                const total = Number(item?.total || (price * quantity) || 0) || 0;
                return {
                    ...item,
                    price,
                    quantity,
                    total,
                };
            });

            const totalAmount = Number(order?.totalAmount || 0) || 0;
            return {
                ...order,
                totalAmount,
                items: normalizedItems,
            };
        });

        res.status(200).json({
            success: true,
            ...result,
            orders: normalizedOrders
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Get single order
 * @route   GET /api/orders/:id
 * @access  Customer (own order) or Admin
 */
const getOrder = async (req, res, next) => {
    try {
        const orderId = req.params.id;

        // Fetch order basic details
        const [orderRows] = await promisePool.query(
            'SELECT * FROM orders WHERE id = ?',
            [orderId]
        );

        if (!orderRows.length) {
            return res.status(404).json({ message: 'Order not found' });
        }

        const order = orderRows[0];

        // Check authorization
        if (req.user.role !== 'admin' && req.user.id !== order.customerId) {
            return res.status(403).json({
                success: false,
                message: 'Access denied. You can only view your own orders.'
            });
        }

        // Fetch order items with product names
        // Use LEFT JOIN to avoid dropping items if a product was deleted later.
        const [items] = await promisePool.query(
            `
            SELECT 
                oi.id,
                oi.productId,
                COALESCE(p.name, oi.productName) AS productName,
                oi.quantity,
                oi.price,
                (oi.quantity * oi.price) AS subtotal,
                (oi.quantity * oi.price) AS total,
                oi.isSelected
            FROM order_items oi
            LEFT JOIN products p ON oi.productId = p.id
            WHERE oi.orderId = ?
            `,
            [orderId]
        );

        const normalizedItems = (Array.isArray(items) ? items : []).map((it) => {
            const quantity = Number(it?.quantity || 0) || 0;
            const price = Number(it?.price || 0) || 0;
            const subtotal = Number(it?.subtotal || (quantity * price) || 0) || 0;
            return {
                ...it,
                quantity,
                price,
                subtotal,
                total: Number(it?.total || subtotal || 0) || 0,
                // Compatibility: existing admin order modals also read `name`
                name: it?.productName,
            };
        });

        const existingTotalAmount = Number(order?.totalAmount || 0) || 0;
        const computedTotalAmount = normalizedItems.reduce((sum, it) => sum + (Number(it?.subtotal || 0) || 0), 0);
        const totalAmountSafe = (existingTotalAmount > 0 ? existingTotalAmount : computedTotalAmount);

        res.json({
            success: true,
            order: {
                ...order,
                totalAmount: totalAmountSafe,
                items: normalizedItems,
            }
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Update order items before verification
 * @route   PUT /api/orders/:id/update-items
 * @access  Admin only
 */
const updateOrderItems = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { items, totalAmount } = req.body;

        if (!items || items.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Please provide items'
            });
        }

        await Order.updateOrderItems(id, items, totalAmount);

        const updatedOrder = await Order.findById(id);

        res.status(200).json({
            success: true,
            message: 'Order items updated successfully',
            order: updatedOrder
        });
    } catch (error) {
        if (error.message.includes('locked') || error.message.includes('Cannot modify')) {
            return res.status(400).json({
                success: false,
                message: error.message
            });
        }
        next(error);
    }
};

/**
 * @desc    Verify order (locks order and updates stock)
 * @route   PUT /api/orders/:id/verify
 * @access  Admin only
 */
const verifyOrder = async (req, res, next) => {
    try {
        const { id } = req.params;

        await Order.verifyOrder(id);

        const order = await Order.findById(id);

        res.status(200).json({
            success: true,
            message: 'Order verified successfully. Stock updated.',
            order
        });
    } catch (error) {
        if (error.message.includes('Insufficient stock') || error.message.includes('already verified')) {
            return res.status(400).json({
                success: false,
                message: error.message
            });
        }
        next(error);
    }
};

/**
 * @desc    Mark order as paid
 * @route   PUT /api/orders/:id/mark-paid
 * @access  Admin only
 */
const markOrderPaid = async (req, res, next) => {
    try {
        const { id } = req.params;

        await Order.markPaid(id);

        const order = await Order.findById(id);

        res.status(200).json({
            success: true,
            message: 'Order marked as paid',
            order
        });
    } catch (error) {
        if (error.message.includes('must be verified')) {
            return res.status(400).json({
                success: false,
                message: error.message
            });
        }
        next(error);
    }
};

/**
 * @desc    Mark order as delivered
 * @route   PUT /api/orders/:id/deliver
 * @access  Admin only
 */
const markOrderDelivered = async (req, res, next) => {
    try {
        const { id } = req.params;

        await Order.markDelivered(id);

        const order = await Order.findById(id);

        res.status(200).json({
            success: true,
            message: 'Order marked as delivered',
            order
        });
    } catch (error) {
        if (error.message.includes('must be verified')) {
            return res.status(400).json({
                success: false,
                message: error.message
            });
        }
        next(error);
    }
};

/**
 * @desc    Update order status (admin)
 * @route   PUT /api/orders/:id/status
 * @access  Admin only
 */
const updateOrderStatus = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        if (status === 'Verified') {
            await Order.verifyOrder(id);
            const order = await Order.findById(id);
            return res.status(200).json({
                success: true,
                message: 'Order verified successfully. Stock updated.',
                order,
            });
        }

        await Order.updateStatus(id, status);

        const order = await Order.findById(id);
        res.status(200).json({
            success: true,
            message: 'Status updated',
            order,
        });
    } catch (error) {
        if (
            error.message.includes('Invalid status') ||
            error.message.includes('not found') ||
            error.message.includes('cannot be updated') ||
            error.message.includes('Only Pending orders can be rejected') ||
            error.message.includes('must be verified') ||
            error.message.includes('Approve payment') ||
            error.message.includes('Insufficient stock') ||
            error.message.includes('already verified')
        ) {
            return res.status(400).json({
                success: false,
                message: error.message,
            });
        }
        next(error);
    }
};

/**
 * @desc    Reject order (locks order)
 * @route   PUT /api/orders/:id/reject
 * @access  Admin only
 */
const rejectOrder = async (req, res, next) => {
    try {
        const { id } = req.params;

        await Order.rejectOrder(id);

        const order = await Order.findById(id);

        res.status(200).json({
            success: true,
            message: 'Order rejected',
            order,
        });
    } catch (error) {
        if (
            error.message.includes('Only Pending') ||
            error.message.includes('not found')
        ) {
            return res.status(400).json({
                success: false,
                message: error.message,
            });
        }
        next(error);
    }
};

/**
 * @desc    Add item to order
 * @route   POST /api/orders/:id/add-item
 * @access  Admin only
 */
const addItemToOrder = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { productId, quantity } = req.body;

        if (!productId || !quantity) {
            return res.status(400).json({
                success: false,
                message: 'Please provide productId and quantity'
            });
        }

        // Get product details
        const product = await Product.findById(productId);
        if (!product) {
            return res.status(404).json({
                success: false,
                message: 'Product not found'
            });
        }

        await Order.addItemToOrder(id, {
            productId: product.id,
            productName: product.name,
            price: product.price,
            quantity: parseInt(quantity)
        });

        const order = await Order.findById(id);

        res.status(200).json({
            success: true,
            message: 'Item added to order',
            order
        });
    } catch (error) {
        if (error.message.includes('Cannot add') || error.message.includes('verified')) {
            return res.status(400).json({
                success: false,
                message: error.message
            });
        }
        next(error);
    }
};

/**
 * @desc    Create offline order (walk-in customer)
 * @route   POST /api/orders/offline
 * @access  Admin only
 */
const createOfflineOrder = async (req, res, next) => {
    try {
        const { customerName, phone, place, address, items } = req.body;

        // Validate required fields
        if (!customerName || !phone || !items || items.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Please provide customerName, phone, and items'
            });
        }

        // Validate and calculate totals
        let totalAmount = 0;
        const orderItems = [];

        for (const item of items) {
            const product = await Product.findById(item.productId);
            if (!product) {
                return res.status(400).json({
                    success: false,
                    message: `Product with ID ${item.productId} not found`
                });
            }

            if (product.stock < item.quantity) {
                return res.status(400).json({
                    success: false,
                    message: `Insufficient stock for ${product.name}. Available: ${product.stock}`
                });
            }

            const itemTotal = product.price * item.quantity;
            totalAmount += itemTotal;

            orderItems.push({
                productId: product.id,
                productName: product.name,
                price: product.price,
                quantity: item.quantity
            });
        }

        // Create order
        const order = await Order.createOfflineOrder(
            {
                customerName,
                phone,
                place,
                address,
                totalAmount
            },
            orderItems
        );

        res.status(201).json({
            success: true,
            message: 'Offline order created successfully',
            order
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Get all offline orders
 * @route   GET /api/orders/offline
 * @access  Admin only
 */
const getOfflineOrders = async (req, res, next) => {
    try {
        const { page = 1, limit = 50, status, view, search } = req.query;

        // Default behavior for offline admin page: show active (not Delivered/Rejected)
        const effectiveView = view || 'active';

        const result = await Order.getOfflineOrders({
            page: parseInt(page),
            limit: parseInt(limit),
            status: status || null,
            view: effectiveView,
            search: typeof search === 'string' && search.trim() ? search.trim() : null
        });

        const safeOrders = Array.isArray(result?.orders) ? result.orders : [];
        const normalizedOrders = safeOrders.map((order) => {
            const items = Array.isArray(order?.items) ? order.items : [];
            const normalizedItems = items.map((item) => {
                const price = Number(item?.price || 0) || 0;
                const quantity = Number(item?.quantity || 0) || 0;
                const total = Number(item?.total || (price * quantity) || 0) || 0;
                return {
                    ...item,
                    price,
                    quantity,
                    total,
                };
            });

            const totalAmount = Number(order?.totalAmount || 0) || 0;
            return {
                ...order,
                totalAmount,
                items: normalizedItems,
            };
        });

        // Frontend expects a raw array
        res.status(200).json(normalizedOrders);
    } catch (error) {
        next(error);
    }
};

module.exports = {
    createOnlineOrder,
    getCustomerOrders,
    getAdminOrders,
    getOrder,
    updateOrderItems,
    verifyOrder,
    markOrderPaid,
    markOrderDelivered,
    updateOrderStatus,
    rejectOrder,
    addItemToOrder,
    createOfflineOrder,
    getOfflineOrders
};
