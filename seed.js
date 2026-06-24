require('dotenv').config();

const { Client } = require('pg');

const TOTAL      = 200_000;
const BATCH_SIZE = 1_000; // 5 columns × 1000 rows = 5000 params — well under PG's 65535 limit
const CATEGORIES = ['electronics', 'fashion', 'books', 'sports', 'home', 'toys'];

const NOW          = new Date();
const TWO_YEARS_AGO = new Date(NOW.getTime() - 2 * 365 * 24 * 60 * 60 * 1000);

function randomDate(from, to) {
  return new Date(from.getTime() + Math.random() * (to.getTime() - from.getTime()));
}

function generateProduct(i) {
  const category  = CATEGORIES[Math.floor(Math.random() * CATEGORIES.length)];
  const price     = (Math.random() * 990 + 10).toFixed(2); // 10.00 – 999.99
  const createdAt = randomDate(TWO_YEARS_AGO, NOW);
  const updatedAt = randomDate(createdAt, NOW);             // always >= createdAt

  return {
    name:       `Product ${i + 1}`,
    category,
    price,
    created_at: createdAt,
    updated_at: updatedAt,
  };
}

// Builds one INSERT with BATCH_SIZE rows — a single round-trip to Postgres
function insertBatch(client, batch) {
  const values       = [];
  const placeholders = batch.map((p, i) => {
    const b = i * 5;
    values.push(p.name, p.category, p.price, p.created_at, p.updated_at);
    return `($${b + 1}, $${b + 2}, $${b + 3}, $${b + 4}, $${b + 5})`;
  });

  return client.query(
    `INSERT INTO products (name, category, price, created_at, updated_at)
     VALUES ${placeholders.join(', ')}`,
    values
  );
}

async function seed() {
  const truncate = process.argv.includes('--truncate');
  const client   = new Client({ connectionString: process.env.DATABASE_URL });

  try {
    await client.connect();
    console.log('Connected to database.\n');

    if (truncate) {
      await client.query('TRUNCATE TABLE products');
      console.log('Table truncated.\n');
    }

    console.log('Starting seed...\n');
    const startTime   = Date.now();
    const totalBatches = Math.ceil(TOTAL / BATCH_SIZE);

    for (let batch = 0; batch < totalBatches; batch++) {
      const start = batch * BATCH_SIZE;
      const end   = Math.min(start + BATCH_SIZE, TOTAL);

      const products = [];
      for (let i = start; i < end; i++) {
        products.push(generateProduct(i));
      }

      await insertBatch(client, products);
      console.log(`Inserted batch ${batch + 1}/${totalBatches}`);
    }

    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);

    console.log('\nSeed complete.');
    console.log(`Inserted: ${TOTAL} products`);
    console.log(`Duration: ${elapsed} seconds`);

    process.exit(0);
  } catch (err) {
    console.error('Seed failed:', err.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

seed();
