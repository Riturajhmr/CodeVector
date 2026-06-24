// Cursor encodes { updatedAt, id } — the position of the last seen row in the sorted set.
// Both fields are required: updated_at for sort position, id as a tie-breaker when
// two rows share the same timestamp.

function _encode(obj) {
  return Buffer.from(JSON.stringify(obj)).toString('base64');
}

function _decode(str) {
  return JSON.parse(Buffer.from(str, 'base64').toString('utf8'));
}

// { updatedAt, id } → base64 string
function encodeCursor(data) {
  return _encode({ updatedAt: data.updatedAt, id: data.id });
}

// base64 string → { updatedAt, id }, throws on invalid input
function decodeCursor(str) {
  try {
    const decoded = _decode(str);
    validateCursor(decoded);
    return decoded;
  } catch (err) {
    if (err.message.startsWith('Cursor')) throw err;
    throw new Error('Invalid cursor');
  }
}

// Throws if required cursor fields are missing
function validateCursor(decoded) {
  if (!decoded.updatedAt) throw new Error('Cursor missing updatedAt');
  if (!decoded.id)        throw new Error('Cursor missing id');
}

// Converts a pg row { updated_at, id } into an encoded cursor string.
// Called when building nextCursor in the API response.
function createCursorFromRow(row) {
  return encodeCursor({ updatedAt: row.updated_at, id: row.id });
}

module.exports = { encodeCursor, decodeCursor, validateCursor, createCursorFromRow };
