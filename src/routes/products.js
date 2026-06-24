const express = require('express');
const { decodeCursor } = require('../utils/cursor');
const { getProducts }  = require('../services/products.service');

const router = express.Router();

function parseLimit(value) {
  if (value === undefined) return 20;
  const n = parseInt(value, 10);
  if (isNaN(n) || n < 1) throw Object.assign(new Error('limit must be a positive integer'), { status: 400 });
  if (n > 100)           throw Object.assign(new Error('limit must not exceed 100'), { status: 400 });
  return n;
}

router.get('/', async (req, res) => {
  try {
    const limit    = parseLimit(req.query.limit);
    const category = req.query.category || null;
    const cursor   = req.query.cursor ? decodeCursor(req.query.cursor) : null;

    const result = await getProducts({ limit, category, cursor });
    res.json(result);
  } catch (err) {
    const isClientError =
      err.status === 400 ||
      err.message.startsWith('Cursor') ||
      err.message === 'Invalid cursor';

    if (isClientError) {
      return res.status(400).json({ error: err.message });
    }

    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
