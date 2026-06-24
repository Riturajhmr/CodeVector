require('dotenv').config();

const express = require('express');
const productsRouter = require('./routes/products');

const app = express();

app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ ok: true, message: 'Server running' });
});

app.use('/api/products', productsRouter);

module.exports = app;
