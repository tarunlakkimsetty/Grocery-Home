const Order = require('../models/orderModel');
const Product = require('../models/productModel');

/**
 * @desc    Create online order
 * @route   POST /api/orders/online
 * @access  Customer (authenticated)
 */
const createOnlineOrder = async (req, res, next) => {
    try {
        const { customerName, phone, place, address, items } = req.body;
        const customerId = req.user.id;

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
        const { page = 1, limit = 50, status, orderType } = req.query;

        const result = await Order.findAll({
            page: parseInt(page),
            limit: parseInt(limit),
            status: status || null,
            orderType: orderType || null
        });

        res.status(200).json({
            success: true,
            ...result
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
        const { id } = req.params;

        const order = await Order.findById(id);

        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Order not found'
            });
        }

        // Check authorization
        if (req.user.role !== 'admin' && req.user.id !== order.customerId) {
            return res.status(403).json({
                success: false,
                message: 'Access denied. You can only view your own orders.'
            });
        }

        res.status(200).json({
            success: true,
            order
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
        const { page = 1, limit = 50, status } = req.query;

        const result = await Order.getOfflineOrders({
            page: parseInt(page),
            limit: parseInt(limit),
            status: status || null
        });

        res.status(200).json({
            success: true,
            ...result
        });
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
    addItemToOrder,
    createOfflineOrder,
    getOfflineOrders
};
