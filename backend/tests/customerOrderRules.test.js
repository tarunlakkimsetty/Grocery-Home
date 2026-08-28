const test = require('node:test');
const assert = require('node:assert/strict');

const {
  canCustomerCancelOrder,
  orderMatchesQuery,
} = require('../utils/customerOrderRules');

test('customer can cancel unfinalized online orders but not completed/delivered orders', () => {
  assert.equal(canCustomerCancelOrder({ status: 'Pending Acceptance', isVerified: false, isPaid: false, isDelivered: false }), true);
  assert.equal(canCustomerCancelOrder({ status: 'Accepted', isVerified: false, isPaid: false, isDelivered: false }), true);
  assert.equal(canCustomerCancelOrder({ status: 'Verified', isVerified: true, isPaid: false, isDelivered: false }), true);
  assert.equal(canCustomerCancelOrder({ status: 'Paid', isVerified: true, isPaid: true, isDelivered: false }), true);
  assert.equal(canCustomerCancelOrder({ status: 'Completed', isVerified: true, isPaid: true, isDelivered: true }), false);
  assert.equal(canCustomerCancelOrder({ status: 'Delivered', isVerified: true, isPaid: false, isDelivered: true }), false);
  assert.equal(canCustomerCancelOrder({ status: 'Rejected', isVerified: false, isPaid: false, isDelivered: false }), false);
});

test('order search matches customer name, phone, and item names', () => {
  const order = {
    id: 55,
    customerName: 'Rahul Sharma',
    phone: '9876543210',
    items: [{ name: 'Basmati Rice', quantity: 2 }, { name: 'Milk', quantity: 2 }],
  };

  assert.equal(orderMatchesQuery(order, 'rahul'), true);
  assert.equal(orderMatchesQuery(order, '9876543210'), true);
  assert.equal(orderMatchesQuery(order, 'rice'), true);
  assert.equal(orderMatchesQuery(order, 'mango'), false);
});
