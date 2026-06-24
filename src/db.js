const { Pool } = require('pg');

// Single shared pool — reused across all requests
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

module.exports = pool;
