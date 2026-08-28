const test = require('node:test');
const assert = require('node:assert/strict');

const Order = require('../models/orderModel');
const Bill = require('../models/billModel');
const { promisePool } = require('../config/db');

test('Order.resolveItemUnit prefers explicit item unit then product unit and handles missing product', async () => {
  const item = { productId: 12, quantity: 2, unit: 'Pack' };
  const resolved = await Order.resolveItemUnit(item, { unit: 'Kg' });
  assert.equal(resolved, 'Pack');

  const fallback = await Order.resolveItemUnit({ productId: 42, quantity: 1 }, { unit: 'L' });
  assert.equal(fallback, 'L');

  const missingProduct = await Order.resolveItemUnit({ productId: 99999, quantity: 1 }, null);
  assert.equal(missingProduct, null);
});

test('Order stores the unit on the persisted order item row', async () => {
  const order = await Order.createOfflineOrder({
    customerName: 'Unit Persistence Test',
    phone: '9999999999',
    place: 'Test',
    address: 'Test Address',
    totalAmount: 50,
    paymentMethod: 'Cash',
    status: 'Pending',
    paymentStatus: 'Unpaid'
  }, [{
    productId: 87,
    productName: 'బియ్యం',
    quantity: 2,
    price: 25,
    unit: 'Kg'
  }]);

  const [rows] = await promisePool.query(
    'SELECT unit FROM order_items WHERE orderId = ? ORDER BY id DESC LIMIT 1',
    [order.id]
  );

  assert.ok(Array.isArray(rows) && rows.length > 0, 'order item should exist');
  assert.equal(rows[0].unit, 'Kg');
});

test('Bill.resolveItemUnit resolves the product unit for historical bill items', async () => {
  const item = { productId: 12, quantity: 3 };
  const resolved = await Bill.resolveItemUnit(item, { unit: 'Piece' });
  assert.equal(resolved, 'Piece');

  const fallback = await Bill.resolveItemUnit({ productId: 99999, quantity: 4 }, null);
  assert.equal(fallback, null);
});
