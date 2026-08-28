const test = require('node:test');
const assert = require('node:assert/strict');
const dotenv = require('dotenv');

dotenv.config();

const { login } = require('../controllers/authController');
const User = require('../models/userModel');

test('admin login returns the real database user id for suggested-product ownership', async () => {
  const adminUser = await User.findByPhone('9441754505');
  assert.ok(adminUser, 'expected an admin user to exist in the database');

  let statusCode;
  let payload;

  const req = {
    body: {
      phone: '9441754505',
      password: 'Sairam@143'
    }
  };

  const res = {
    status(code) {
      statusCode = code;
      return this;
    },
    json(data) {
      payload = data;
      return this;
    }
  };

  await login(req, res, (error) => {
    throw error;
  });

  assert.equal(statusCode, 200);
  assert.equal(payload.success, true);
  assert.equal(payload.user.id, adminUser.id);
  assert.notEqual(payload.user.id, 0);
});
