const {
  encodeCursor,
  decodeCursor,
  validateCursor,
  createCursorFromRow,
} = require('../src/utils/cursor');

// --- Happy path ---

const sampleRow = {
  updated_at: new Date('2026-01-15T10:00:00.000Z'),
  id: 'abc-123',
};

const encoded = createCursorFromRow(sampleRow);
console.log('Encoded cursor:');
console.log(encoded);

const decoded = decodeCursor(encoded);
console.log('\nDecoded cursor:');
console.log(decoded);

validateCursor(decoded);
console.log('\nValidation passed.');

// --- Error handling ---

console.log('\n--- Error handling ---');

try {
  decodeCursor('this is not valid base64!!');
} catch (err) {
  console.log('Bad cursor error:', err.message);
}

try {
  validateCursor({ updatedAt: '2026-01-15T10:00:00.000Z' }); // missing id
} catch (err) {
  console.log('Missing field error:', err.message);
}
