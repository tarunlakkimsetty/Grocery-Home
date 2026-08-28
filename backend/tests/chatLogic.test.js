const test = require('node:test');
const assert = require('node:assert/strict');

const {
  DEFAULT_OWNER_MESSAGE,
  shouldSendDefaultOwnerMessage,
  formatDateSeparatorLabel,
} = require('../models/chatModel');

test('default owner message is persisted exactly as the required welcome text', () => {
  assert.ok(DEFAULT_OWNER_MESSAGE.includes('👋 Hi! Welcome to our store.'));
  assert.ok(DEFAULT_OWNER_MESSAGE.includes('Our owner will get back to you within 24 hours.'));
  assert.ok(DEFAULT_OWNER_MESSAGE.includes('9441754505'));
});

test('default owner message triggers only after a 10 minute customer gap', () => {
  const referenceNow = new Date('2026-08-21T09:15:00.000Z').getTime();

  assert.equal(
    shouldSendDefaultOwnerMessage({
      latestCustomerAt: '2026-08-21T09:00:00.000Z',
      gapMs: 10 * 60 * 1000,
      currentTime: referenceNow,
    }),
    true
  );

  assert.equal(
    shouldSendDefaultOwnerMessage({
      latestCustomerAt: '2026-08-21T09:05:00.000Z',
      gapMs: 10 * 60 * 1000,
      currentTime: referenceNow,
    }),
    true
  );

  assert.equal(
    shouldSendDefaultOwnerMessage({
      latestCustomerAt: '2026-08-21T09:14:00.000Z',
      gapMs: 10 * 60 * 1000,
      currentTime: referenceNow,
    }),
    false
  );
});

test('date separator labels use Today, Yesterday, and weekday names', () => {
  const today = new Date('2026-08-21T09:17:00.000Z');
  const yesterday = new Date('2026-08-20T09:17:00.000Z');
  const earlier = new Date('2026-08-19T09:17:00.000Z');

  assert.match(formatDateSeparatorLabel(today), /Today/i);
  assert.match(formatDateSeparatorLabel(yesterday), /Yesterday/i);
  assert.match(formatDateSeparatorLabel(earlier), /Wednesday/i);
});
