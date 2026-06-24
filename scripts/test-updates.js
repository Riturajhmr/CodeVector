require('dotenv').config();

const { Client } = require('pg');

const COUNT = 50;

async function testUpdates() {
  const client = new Client({ connectionString: process.env.DATABASE_URL });

  try {
    await client.connect();

    // Randomly select COUNT products and bump their updated_at to NOW().
    // These rows will move to the top of the sort on the next request.
    const result = await client.query(`
      UPDATE products
      SET updated_at = NOW()
      WHERE id IN (
        SELECT id FROM products ORDER BY RANDOM() LIMIT $1
      )
    `, [COUNT]);

    console.log(`Updated ${result.rowCount} products`);
    process.exit(0);
  } catch (err) {
    console.error('Update failed:', err.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

testUpdates();
