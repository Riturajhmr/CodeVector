# Tempo Backend

Cursor-paginated product API built with Node.js, Express, and PostgreSQL.

## Prerequisites

- Node.js 18+
- PostgreSQL

## Setup

```bash
# Install dependencies
npm install

# Copy environment file and fill in your database URL
cp .env.example .env
```

Edit `.env`:

```
PORT=3000
DATABASE_URL=postgresql://username:password@localhost:5432/products_db
```

## Run locally

```bash
# Development (auto-restarts on file changes)
npm run dev

# Production
npm start
```

The server logs the port and confirms the database connection on startup.

**Health check:**

```
GET /health
```

## Schema

**products table**

| Column     | Type          | Notes                 |
|------------|---------------|-----------------------|
| id         | UUID          | Primary key, auto-gen |
| name       | TEXT          | Product name          |
| category   | TEXT          | Used for filtering    |
| price      | NUMERIC(10,2) | e.g. 19.99            |
| created_at | TIMESTAMPTZ   | Creation timestamp    |
| updated_at | TIMESTAMPTZ   | Last update timestamp |

**Indexes**

- `idx_products_updated_at_id` on `(updated_at DESC, id DESC)` — full catalog browsing, no filter
- `idx_products_category_updated_at_id` on `(category, updated_at DESC, id DESC)` — category-filtered browsing

Both indexes match the exact sort order the API uses (`ORDER BY updated_at DESC, id DESC`), so Postgres can satisfy queries with an index scan and no separate sort step. `id` acts as a deterministic tie-breaker when two rows share the same `updated_at`.

**Initialize the schema:**

```bash
npm run db:init
```

## Seeding

Inserts 200,000 products using batch inserts (1,000 rows per query).

```bash
# Insert 200,000 products
npm run seed

# Clear the table first, then seed
npm run seed -- --truncate
```

Batch inserts are used because a single-row-per-query loop would require 200,000 round-trips to Postgres. Sending 1,000 rows per query reduces that to 200 round-trips — roughly 100× faster in practice.

Expected runtime: ~10–30 seconds depending on hardware.
