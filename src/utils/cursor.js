// Cursor wraps { updated_at, id } as base64 JSON for stable keyset pagination.
// Using both fields avoids duplicates and missing records when rows share a timestamp.

function encode(obj) {
  return Buffer.from(JSON.stringify(obj)).toString('base64');
}

function decode(str) {
  return JSON.parse(Buffer.from(str, 'base64').toString('utf8'));
}

module.exports = { encode, decode };
