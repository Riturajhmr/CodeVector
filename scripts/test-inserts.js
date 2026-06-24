require('dotenv').config();

const { Client } = require('pg');

const COUNT      = 50;
const CATEGORIES = ['electronics', 'fashion', 'books', 'sports', 'home', 'toys'];

async function testInserts() {
  const client = new Client({ connectionString: process.env.DATABASE_URL });

  try {
    await client.connect();

    const now    = new Date();
    const values = [];
    const placeholders = [];

    for (let i = 0; i < COUNT; i++) {
      const b        = i * 5;
      const category = CATEGORIES[Math.floor(Math.random() * CATEGORIES.length)];
      const price    = (Math.random() * 990 + 10).toFixed(2);

      values.push(`New Product ${i + 1}`, category, price, now, now);
      placeholders.push(`($${b + 1}, $${b + 2}, $${b + 3}, $${b + 4}, $${b + 5})`);
    }

    await client.query(
      `INSERT INTO products (name, category, price, created_at, updated_at)
       VALUES ${placeholders.join(', ')}`,
      values
    );

    console.log(`Inserted ${COUNT} products`);
    process.exit(0);
  } catch (err) {
    console.error('Insert failed:', err.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

testInserts();
