require('dotenv').config();

const fs = require('fs');
const path = require('path');
const { Client } = require('pg');

const schemaPath = path.join(__dirname, '..', 'database', 'schema.sql');

async function initDb() {
  const client = new Client({ connectionString: process.env.DATABASE_URL });

  try {
    await client.connect();
    console.log('Connected to database.');

    const sql = fs.readFileSync(schemaPath, 'utf8');
    await client.query(sql);

    console.log('Schema applied successfully.');
  } catch (err) {
    console.error('Failed to apply schema:', err.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

initDb();
