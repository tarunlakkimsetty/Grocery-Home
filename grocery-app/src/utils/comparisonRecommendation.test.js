const test = require('node:test');
const assert = require('node:assert/strict');

const { getComparisonRecommendation } = require('./comparisonRecommendation');

test('prefers a higher-rated product over a cheaper one when value is better overall', () => {
  const result = getComparisonRecommendation([
    { id: 1, name: 'Budget Rice (5kg)', price: 280, originalPrice: 320, discountedPrice: 280, stock: 25, average_rating: 3.2, rating_count: 8, unit: 'pack', freeItemActive: false },
    { id: 2, name: 'Premium Rice (10kg)', price: 420, originalPrice: 520, discountedPrice: 420, stock: 10, average_rating: 4.7, rating_count: 42, unit: 'pack', freeItemActive: true, freeItemName: 'Free ghee sachet' },
  ]);

  assert.ok(result.winner);
  assert.equal(result.winner.id, 2);
  assert.ok(result.winner.score > 0);
  assert.ok(result.winner.score < 100);
  assert.ok(result.winner.score > result.products[1].score);
  assert.ok(result.winner.reasons.some((reason) => reason.includes('Higher customer rating') || reason.includes('In stock')));
});

test('treats missing reviews as neutral rather than poor quality', () => {
  const result = getComparisonRecommendation([
    { id: 10, name: 'New Brand Oil (1L)', price: 160, originalPrice: 180, discountedPrice: 160, stock: 12, average_rating: null, rating_count: 0, unit: 'bottle', freeItemActive: false },
    { id: 11, name: 'Popular Brand Oil (1L)', price: 180, originalPrice: 200, discountedPrice: 180, stock: 8, average_rating: 4.1, rating_count: 16, unit: 'bottle', freeItemActive: false },
  ]);

  assert.ok(result.winner);
  assert.equal(result.products.find((product) => product.id === 10).ratingText, 'No ratings yet');
});

test('marks near-equal scores as a close match', () => {
  const result = getComparisonRecommendation([
    { id: 30, name: 'Tea (250g)', price: 90, originalPrice: 100, discountedPrice: 90, stock: 40, average_rating: 4.4, rating_count: 20, unit: 'pack', freeItemActive: false },
    { id: 31, name: 'Tea Premium (250g)', price: 90, originalPrice: 100, discountedPrice: 90, stock: 40, average_rating: 4.4, rating_count: 20, unit: 'pack', freeItemActive: false },
  ]);

  assert.ok(result.closeMatch);
  assert.ok(result.winner.recommendationLabel.includes('Best Value'));
});

test('scores products relative to the comparison set instead of assigning 100 to every product', () => {
  const result = getComparisonRecommendation([
    { id: 100, name: 'Toned Milk (500ml)', price: 28, originalPrice: 30, discountedPrice: 28, stock: 18, average_rating: null, rating_count: 0, quantity: 500, unit: 'ml', freeItemActive: false },
    { id: 101, name: 'Full Cream Milk (1L)', price: 62, originalPrice: 70, discountedPrice: 62, stock: 8, average_rating: 4.4, rating_count: 24, quantity: 1, unit: 'l', freeItemActive: false },
  ]);

  const toned = result.products.find((product) => product.id === 100);
  const fullCream = result.products.find((product) => product.id === 101);

  assert.ok(toned && fullCream);
  assert.notEqual(toned.score, fullCream.score);
  assert.ok(toned.score > fullCream.score);
  assert.ok(toned.score < 100);
  assert.ok(fullCream.score < 100);
  assert.ok(result.winner.id === toned.id);
});

test('treats missing ratings and zero-discount products as neutral, not perfect', () => {
  const result = getComparisonRecommendation([
    { id: 200, name: 'Plain Yogurt', price: 40, originalPrice: 40, discountedPrice: 40, stock: 16, average_rating: null, rating_count: 0, quantity: 1, unit: 'kg', freeItemActive: false },
    { id: 201, name: 'Fruit Yogurt', price: 45, originalPrice: 60, discountedPrice: 45, stock: 12, average_rating: 4.6, rating_count: 33, quantity: 1, unit: 'kg', freeItemActive: true, freeItemName: 'Free spoon set' },
  ]);

  const plain = result.products.find((product) => product.id === 200);
  const fruit = result.products.find((product) => product.id === 201);

  assert.ok(plain && fruit);
  assert.equal(plain.ratingValue, 0);
  assert.equal(plain.discountPercent, 0);
  assert.notEqual(plain.score, fruit.score);
  assert.ok(plain.score < 100);
  assert.ok(fruit.score < 100);
});

test('identical products receive the same relative score', () => {
  const result = getComparisonRecommendation([
    { id: 300, name: 'Same Milk', price: 30, originalPrice: 35, discountedPrice: 30, stock: 10, average_rating: 4.2, rating_count: 12, quantity: 1, unit: 'l', freeItemActive: false },
    { id: 301, name: 'Same Milk Duplicate', price: 30, originalPrice: 35, discountedPrice: 30, stock: 10, average_rating: 4.2, rating_count: 12, quantity: 1, unit: 'l', freeItemActive: false },
  ]);

  assert.equal(result.products[0].score, result.products[1].score);
  assert.equal(result.winner.score, result.products[0].score);
});

test('does not award a rating advantage when a product has no ratings', () => {
  const result = getComparisonRecommendation([
    { id: 400, name: 'No Ratings Product', price: 120, originalPrice: 140, discountedPrice: 120, stock: 10, average_rating: null, rating_count: 0, quantity: 1, unit: 'kg', freeItemActive: false },
    { id: 401, name: 'Rated Product', price: 130, originalPrice: 150, discountedPrice: 130, stock: 12, average_rating: 5, rating_count: 10, quantity: 1, unit: 'kg', freeItemActive: false },
  ]);

  const unrated = result.products.find((product) => product.id === 400);
  const rated = result.products.find((product) => product.id === 401);

  assert.ok(unrated);
  assert.ok(rated);
  assert.equal(unrated.ratingValue, 0);
  assert.equal(unrated.ratingScore, null);
  assert.ok(!unrated.reasons.some((reason) => reason.includes('Higher customer rating')));
  assert.equal(rated.ratingValue, 5);
  assert.equal(rated.ratingScore, 100);
  assert.ok(!unrated.reasons.some((reason) => reason.includes('Higher customer rating')));
  assert.ok(unrated.score < 100 && rated.score < 100);
});

test('keeps missing rating data as N/A instead of treating it as a zero rating', () => {
  const result = getComparisonRecommendation([
    { id: 500, name: 'Unrated A', price: 90, originalPrice: 100, discountedPrice: 90, stock: 15, average_rating: null, rating_count: 0, quantity: 1, unit: 'kg', freeItemActive: false },
    { id: 501, name: 'Unrated B', price: 88, originalPrice: 95, discountedPrice: 88, stock: 18, average_rating: null, rating_count: 0, quantity: 1, unit: 'kg', freeItemActive: false },
  ]);

  const a = result.products.find((product) => product.id === 500);
  const b = result.products.find((product) => product.id === 501);

  assert.ok(a && b);
  assert.equal(a.ratingText, 'No ratings yet');
  assert.equal(b.ratingText, 'No ratings yet');
  assert.equal(a.ratingScore, null);
  assert.equal(b.ratingScore, null);
  assert.ok(!a.reasons.some((reason) => reason.includes('Higher customer rating')));
  assert.ok(!b.reasons.some((reason) => reason.includes('Higher customer rating')));
  assert.ok(a.score < 100 && b.score < 100);
});
