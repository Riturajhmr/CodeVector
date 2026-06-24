const pool = require('../db');
const { createCursorFromRow } = require('../utils/cursor');

// Builds a parameterized SELECT query dynamically based on which filters are active.
// addParam() ensures $N placeholders always match the params array — no manual counting.
function buildQuery({ limit, category, cursor }) {
  const params     = [];
  const conditions = [];

  function addParam(val) {
    params.push(val);
    return `$${params.length}`;
  }

  if (cursor) {
    const p1 = addParam(cursor.updatedAt);
    const p2 = addParam(cursor.id);
    // Row-value comparison: continue from after the cursor position.
    // Works correctly with DESC ordering — both columns decrease together.
    conditions.push(`(updated_at, id) < (${p1}::timestamptz, ${p2}::uuid)`);
  }

  if (category) {
    conditions.push(`category = ${addParam(category)}`);
  }

  const where      = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  const limitParam = addParam(limit + 1); // fetch one extra to detect whether a next page exists

  const sql = `
    SELECT id, name, category, price, created_at, updated_at
    FROM products
    ${where}
    ORDER BY updated_at DESC, id DESC
    LIMIT ${limitParam}
  `;

  return { sql, params };
}

async function getProducts({ limit, category, cursor }) {
  const { sql, params } = buildQuery({ limit, category, cursor });
  const { rows }        = await pool.query(sql, params);

  const hasNextPage = rows.length > limit;
  const products    = hasNextPage ? rows.slice(0, limit) : rows;
  const nextCursor  = hasNextPage ? createCursorFromRow(products[products.length - 1]) : null;

  return { products, nextCursor };
}

module.exports = { getProducts };
