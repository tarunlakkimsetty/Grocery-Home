const { promisePool } = require('../config/db');
const Product = require('./productModel');
const { calculateLinePricing } = require('../utils/pricing');

const hydrateBillItems = async (items = []) => {
    const safeItems = Array.isArray(items) ? items : [];
    const productIds = Array.from(new Set((safeItems || []).map((it) => Number(it.productId)).filter((id) => Number.isInteger(id) && id > 0)));
    const productMeta = new Map();

    if (productIds.length > 0) {
        try {
            const placeholders = productIds.map(() => '?').join(',');
            const [rows] = await promisePool.query(`SELECT id, unit, name FROM products WHERE id IN (${placeholders})`, productIds);
            for (const row of rows || []) {
                productMeta.set(Number(row.id), { unit: row.unit || null, name: row.name || '' });
            }
        } catch (e) {
            // best effort only
        }
    }

    return safeItems.map((it) => {
        const productId = Number(it?.productId ?? 0) || null;
        const meta = productId ? productMeta.get(productId) || {} : {};
        const productName = it?.productName || it?.name || meta.name || '';

        return {
            ...it,
            unit: it.unit || meta.unit || null,
            productName,
            name: it?.name || productName,
        };
    });
};

const Bill = {
    resolveItemUnit: async (item, productFallback = null) => {
        const explicit = String(item?.unit || '').trim();
        if (explicit) return explicit;

        const fallbackUnit = String(productFallback?.unit || '').trim();
        if (fallbackUnit) return fallbackUnit;

        const productId = Number(item?.productId ?? item?.product_id ?? item?.id ?? 0) || null;
        if (!productId) return null;

        try {
            const [rows] = await promisePool.query('SELECT unit FROM products WHERE id = ?', [productId]);
            if (!Array.isArray(rows) || rows.length === 0) return null;
            const unit = String(rows[0]?.unit || '').trim();
            return unit || null;
        } catch (e) {
            return null;
        }
    },

    /**
     * Create a new bill
     */
    create: async (billData, items) => {
        const connection = await promisePool.getConnection();
        try {
            await connection.beginTransaction();

            const authoritativeItems = [];
            let authoritativeGrandTotal = 0;
            for (const item of (Array.isArray(items) ? items : [])) {
                const product = await Product.findById(item.productId);
                if (!product) throw new Error(`Product with ID ${item.productId} not found`);
                const line = calculateLinePricing(product, item.quantity);
                authoritativeGrandTotal += line.total;
                authoritativeItems.push({
                    ...item,
                    name: product.name,
                    unit: product.unit,
                    ...line,
                    freeItemName: product.freeItemActive ? product.freeItemName : null,
                    freeItemQuantity: product.freeItemActive ? product.freeItemQuantity : null,
                    freeItemUnit: product.freeItemActive ? product.freeItemUnit : null,
                });
            }

            // Insert bill
            const [billResult] = await connection.query(
                `INSERT INTO bills (userId, grandTotal, paymentMethod) VALUES (?, ?, ?)`,
                [billData.userId, authoritativeGrandTotal, billData.paymentMethod || 'Cash']
            );

            const billId = billResult.insertId;

            // Insert bill items
            for (const item of authoritativeItems) {
                const itemUnit = String(item?.unit ?? item?.product?.unit ?? '').trim() || null;
                await connection.query(
                    `INSERT INTO bill_items (billId, productId, productName, price, originalPrice, discountAmount, discountPercentage, freeItemName, freeItemQuantity, freeItemUnit, quantity, unit, total)
                     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                    [billId, item.productId, item.name || item.productName, item.price, item.originalPrice, item.discountAmount, item.discountPercentage, item.freeItemName, item.freeItemQuantity, item.freeItemUnit, item.quantity, itemUnit, item.total]
                );
            }

            await connection.commit();

            return {
                id: billId,
                userId: billData.userId,
                grandTotal: authoritativeGrandTotal,
                paymentMethod: billData.paymentMethod || 'Cash',
                date: new Date().toISOString()
            };
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    },

    /**
     * Find bill by ID with items
     */
    findById: async (id) => {
        const [bills] = await promisePool.query(
            `SELECT * FROM bills WHERE id = ?`,
            [id]
        );

        if (bills.length === 0) return null;

        const bill = bills[0];

        // Get bill items and hydrate with product unit where possible
        const [items] = await promisePool.query(
            `SELECT * FROM bill_items WHERE billId = ?`,
            [id]
        );

        // Fetch product metadata for units
        const productIds = Array.from(new Set((items || []).map((it) => Number(it.productId)).filter((id) => Number.isInteger(id) && id > 0)));
        const productMeta = new Map();
        if (productIds.length > 0) {
            try {
                const placeholders = productIds.map(() => '?').join(',');
                const [rows] = await promisePool.query(`SELECT id, unit, name FROM products WHERE id IN (${placeholders})`, productIds);
                for (const r of rows) productMeta.set(Number(r.id), { unit: r.unit || null, name: r.name || '' });
            } catch (e) {
                // ignore
            }
        }

        const hydrated = await hydrateBillItems(items || []);

        return {
            ...bill,
            items: hydrated
        };
    },

    /**
     * Find bills by user ID
     */
    findByUserId: async (userId) => {
        const [bills] = await promisePool.query(
            `SELECT * FROM bills WHERE userId = ? ORDER BY createdAt DESC`,
            [userId]
        );

        // Get items for each bill and hydrate with product unit
        for (const bill of bills) {
            const [items] = await promisePool.query(`SELECT * FROM bill_items WHERE billId = ?`, [bill.id]);
            const productIds = Array.from(new Set((items || []).map((it) => Number(it.productId)).filter((id) => Number.isInteger(id) && id > 0)));
            let productMeta = new Map();
            if (productIds.length > 0) {
                try {
                    const placeholders = productIds.map(() => '?').join(',');
                    const [rows] = await promisePool.query(`SELECT id, unit, name FROM products WHERE id IN (${placeholders})`, productIds);
                    for (const r of rows) productMeta.set(Number(r.id), { unit: r.unit || null, name: r.name || '' });
                } catch (e) {
                    productMeta = new Map();
                }
            }

            bill.items = await hydrateBillItems(items || []);
        }

        return bills;
    },

    /**
     * Find all bills (admin)
     */
    findAll: async (options = {}) => {
        const { page = 1, limit = 50 } = options;
        const offset = (page - 1) * limit;

        // Get total count
        const [countResult] = await promisePool.query('SELECT COUNT(*) as total FROM bills');
        const total = countResult[0].total;

        // Get bills with pagination
        const [bills] = await promisePool.query(
            `SELECT b.*, u.fullName as customerName 
             FROM bills b 
             LEFT JOIN users u ON b.userId = u.id 
             ORDER BY b.createdAt DESC 
             LIMIT ? OFFSET ?`,
            [limit, offset]
        );

        // Get items for each bill
        for (const bill of bills) {
            const [items] = await promisePool.query(
                `SELECT * FROM bill_items WHERE billId = ?`,
                [bill.id]
            );
            bill.items = await hydrateBillItems(items || []);
        }

        return {
            bills,
            pagination: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit)
            }
        };
    }
};

module.exports = Bill;
