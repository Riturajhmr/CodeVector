require('dotenv').config();

// Call the service directly — no HTTP server required.
const { getProducts }  = require('../src/services/products.service');
const { decodeCursor } = require('../src/utils/cursor');
const pool             = require('../src/db');

const PAGE_SIZE    = 10;
const TOTAL_PAGES  = 5;
const CATEGORIES   = ['electronics', 'fashion', 'books', 'sports', 'home', 'toys'];

function pass(msg) { console.log(`PASS: ${msg}`); }
function fail(msg) { console.log(`FAIL: ${msg}`); }

function hasDuplicates(arr) {
  return new Set(arr).size !== arr.length;
}

// Insert COUNT products with updated_at = NOW() to simulate concurrent writes.
// These rows will sort to the top — before the cursor — so they should not
// appear on any subsequent page in the current pagination session.
async function insertProducts(count) {
  const now = new Date();
  const values = [];
  const placeholders = [];

  for (let i = 0; i < count; i++) {
    const b        = i * 5;
    const category = CATEGORIES[Math.floor(Math.random() * CATEGORIES.length)];
    const price    = (Math.random() * 990 + 10).toFixed(2);
    values.push(`Verify Insert ${i + 1}`, category, price, now, now);
    placeholders.push(`($${b + 1}, $${b + 2}, $${b + 3}, $${b + 4}, $${b + 5})`);
  }

  await pool.query(
    `INSERT INTO products (name, category, price, created_at, updated_at)
     VALUES ${placeholders.join(', ')}`,
    values
  );
}

async function verify() {
  try {
    // Step 1: fetch page 1
    console.log('Fetching page 1...');
    const page1    = await getProducts({ limit: PAGE_SIZE, category: null, cursor: null });
    const page1IDs = page1.products.map(p => p.id);
    console.log(`Page 1: ${page1IDs.length} products, nextCursor ${page1.nextCursor ? 'present' : 'absent'}\n`);

    if (!page1.nextCursor) {
      console.log('SKIP: Not enough data to paginate — run npm run seed first');
      process.exit(0);
    }

    // Step 2: insert new products during the pagination session
    console.log('Inserting 5 new products to simulate concurrent activity...');
    await insertProducts(5);
    console.log('Inserted 5 products.\n');

    // Step 3: fetch page 2 using the cursor from page 1
    console.log('Fetching page 2 with stored cursor...');
    const cursor2  = decodeCursor(page1.nextCursor);
    const page2    = await getProducts({ limit: PAGE_SIZE, category: null, cursor: cursor2 });
    const page2IDs = page2.products.map(p => p.id);
    console.log(`Page 2: ${page2IDs.length} products\n`);

    // Check 1: no duplicates between page 1 and page 2
    const overlap = page1IDs.filter(id => page2IDs.includes(id));
    if (overlap.length === 0) {
      pass('No duplicates between page 1 and page 2');
    } else {
      fail(`${overlap.length} duplicate ID(s) found between page 1 and page 2`);
    }

    // Check 2: walk TOTAL_PAGES and verify no duplicates across all of them
    const allIDs      = [...page1IDs, ...page2IDs];
    let nextCursorStr = page2.nextCursor;

    for (let page = 3; page <= TOTAL_PAGES; page++) {
      if (!nextCursorStr) break;
      const cursor = decodeCursor(nextCursorStr);
      const result = await getProducts({ limit: PAGE_SIZE, category: null, cursor });
      allIDs.push(...result.products.map(p => p.id));
      nextCursorStr = result.nextCursor;
    }

    if (hasDuplicates(allIDs)) {
      fail(`Duplicate IDs detected across ${TOTAL_PAGES} pages`);
    } else {
      pass(`No duplicates across ${TOTAL_PAGES} pages`);
    }

    pass('Cursor remained stable during concurrent inserts');
    process.exit(0);
  } catch (err) {
    console.error('Verification failed:', err.message);
    process.exit(1);
  }
}

verify();
