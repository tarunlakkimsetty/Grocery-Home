const test = require('node:test');
const assert = require('node:assert/strict');

const { normalizeAvailabilitySettings, DEFAULT_ORDER_AVAILABILITY } = require('../models/orderAvailabilitySettingsModel');

test('defaults keep both ordering options enabled', () => {
  assert.deepEqual(DEFAULT_ORDER_AVAILABILITY, {
    onlineOrdersEnabled: true,
    listOrdersEnabled: true,
  });
});

test('normalizes mixed values to booleans and preserves independence', () => {
  const normalized = normalizeAvailabilitySettings({
    onlineOrdersEnabled: 'false',
    listOrdersEnabled: 1,
  });

  assert.deepEqual(normalized, {
    onlineOrdersEnabled: false,
    listOrdersEnabled: true,
  });
});
