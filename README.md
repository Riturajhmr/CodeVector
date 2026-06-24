# Tempo Backend

A cursor-paginated product catalog API built as a backend engineering take-home assignment.

---

## Project Overview

This project demonstrates how to build a high-performance read API over a large dataset (200,000+ products) using PostgreSQL cursor-based pagination. The key design goals are correctness under concurrent writes, predictable performance at any page depth, and code that is easy to explain in a technical interview.

---

## Tech Stack

| Layer    | Choice       | Notes                              |
|----------|--------------|------------------------------------|
| Runtime  | Node.js 18+  |                                    |
| Framework| Express      |                                    |
| Database | PostgreSQL   |                                    |
| Driver   | pg           |        
| Config   | dotenv       |                                    |

---

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL 13+

### Setup

```bash
# Install dependencies
npm install

# Copy environment file
cp .env.example .env
```

Edit `.env`:

```
PORT=3000
DATABASE_URL=postgresql://username:password@localhost:5432/products_db
```

### Running locally

```bash
npm run dev    # development — auto-restarts on changes
npm start      # production
```

On startup the server logs the port and verifies the database connection.

**Health check:**

```
GET /health
→ { "ok": true, "message": "Server running" }
```

---

## Database Schema

### Initialize

```bash
npm run db:init
```

### products table

| Column     | Type          | Notes                 |
|------------|---------------|-----------------------|
| id         | UUID          | Primary key, auto-gen |
| name       | TEXT          | Product name          |
| category   | TEXT          | Used for filtering    |
| price      | NUMERIC(10,2) | e.g. 19.99            |
| created_at | TIMESTAMPTZ   | Creation timestamp    |
| updated_at | TIMESTAMPTZ   | Last update timestamp |

### Indexes

- `idx_products_updated_at_id` on `(updated_at DESC, id DESC)` — full catalog browsing
- `idx_products_category_updated_at_id` on `(category, updated_at DESC, id DESC)` — category-filtered browsing

Two indexes are needed because a single index cannot optimally serve both query shapes. See [Design Decisions](#design-decisions) for details.

---

## API Reference

### GET /api/products

Returns a paginated list of products sorted by most recently updated.

**Query parameters**

| Parameter  | Type    | Default | Description                         |
|------------|---------|---------|-------------------------------------|
| `limit`    | integer | 20      | Results per page (max 100)          |
| `category` | string  | —       | Filter by category                  |
| `cursor`   | string  | —       | Pagination cursor from `nextCursor` |

**Example response**

```json
{
  "products": [
    {
      "id": "3f4a1b2c-...",
      "name": "Product 42",
      "category": "electronics",
      "price": "199.99",
      "created_at": "2025-03-01T12:00:00.000Z",
      "updated_at": "2026-01-15T10:00:00.000Z"
    }
  ],
  "nextCursor": "eyJ1cGRhdGVkQXQi..."
}
```

Pass `nextCursor` as the `cursor` parameter to fetch the next page. When `nextCursor` is `null`, there are no more results.

**Error responses**

```json
{ "error": "limit must be a positive integer" }   // 400
{ "error": "limit must not exceed 100" }           // 400
{ "error": "Invalid cursor" }                      // 400
{ "error": "Internal server error" }               // 500
```

**Example requests**

```bash
GET /api/products
GET /api/products?limit=50
GET /api/products?category=electronics
GET /api/products?cursor=eyJ1cGRhdGVkQXQi...
GET /api/products?category=electronics&cursor=eyJ1cGRhdGVkQXQi...
```

---

## Seeding

Inserts 200,000 products using batch inserts (1,000 rows per query).

```bash
npm run seed             # insert 200,000 products
npm run seed -- --truncate  # clear table first, then seed
```

Batch inserts reduce 200,000 single-row round-trips to 200 round-trips — roughly 100× faster in practice. Expected runtime: 10–30 seconds.

---

## Correctness Verification

Cursor pagination remains stable when rows are inserted or updated during an active pagination session. New rows have `updated_at = NOW()`, which sorts them before the cursor position. The keyset condition `(updated_at, id) < cursor` filters them out of subsequent pages automatically.

```bash
npm run test:inserts   # insert 50 new products with updated_at = NOW()
npm run test:updates   # bump updated_at to NOW() on 50 random products
npm run verify         # fetch 5 pages, insert mid-session, assert no duplicate IDs
```

---

## Deployment

### Database — Neon

1. Create a project at [neon.tech](https://neon.tech)
2. Copy the connection string from the dashboard
3. Use it as `DATABASE_URL`

After provisioning, initialize the schema and seed data:

```bash
DATABASE_URL=<neon-url> npm run db:init
DATABASE_URL=<neon-url> npm run seed
```

### Web service — Render

1. Create a new **Web Service** and connect your GitHub repository
2. Runtime: `Node`
3. Build command: `npm install`
4. Start command: `npm start`
5. Environment variables:
   - `DATABASE_URL` — connection string from Neon
   - `PORT` — set automatically by Render

---

## Design Decisions

### Why PostgreSQL?

Mature, battle-tested, and excellent at set-based operations. Composite indexes, row-value comparisons, and `TIMESTAMPTZ` support make it a natural fit for cursor pagination. Widely available on managed platforms (Neon, RDS, Supabase, Render).

### Why raw SQL?

Full control over every query — no ORM abstraction to debug or explain. Every `SELECT` in this codebase is visible and readable. For a performance-focused project, this is a feature: you can read the query plan directly in psql using `EXPLAIN ANALYZE`.

### Why cursor pagination?

Offset pagination (`LIMIT n OFFSET m`) scans and discards all rows before the offset. At page 5,000 with limit 20, that means discarding 100,000 rows for every request. Performance degrades linearly with depth.

Cursor pagination replaces the offset with a `WHERE` clause:

```sql
WHERE (updated_at, id) < ($1::timestamptz, $2::uuid)
ORDER BY updated_at DESC, id DESC
LIMIT 20
```

PostgreSQL seeks directly to the cursor position using the composite index — O(log n) regardless of page depth. It also produces stable results under concurrent writes: new inserts sort before the cursor and are invisible to an ongoing session.

### Why two indexes?

A query filtering by category needs `category` as the leading index column so Postgres can resolve the equality condition and then walk the sorted remainder without a sort step. A query with no filter benefits from an index that starts directly with `(updated_at, id)`. These two shapes require two separate indexes.

---
