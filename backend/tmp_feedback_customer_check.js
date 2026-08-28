const bcrypt = require('bcrypt');
const { promisePool } = require('./config/db');

(async () => {
  const phone = '9000000001';
  const password = 'FeedbackPass123!';
  const hash = await bcrypt.hash(password, 10);

  const [existing] = await promisePool.query('SELECT id FROM users WHERE phone = ? LIMIT 1', [phone]);

  if (existing.length) {
    await promisePool.query('UPDATE users SET password = ?, role = ?, fullName = ? WHERE phone = ?', [hash, 'customer', 'Feedback Tester', phone]);
    console.log('updated', phone, password);
  } else {
    await promisePool.query('INSERT INTO users (fullName, phone, place, password, role, favoriteFood, favoritePlace) VALUES (?, ?, ?, ?, ?, ?, ?)', ['Feedback Tester', phone, 'Test City', hash, 'customer', 'Rice', 'Market']);
    console.log('created', phone, password);
  }

  process.exit(0);
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
