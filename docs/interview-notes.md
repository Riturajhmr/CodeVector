# Interview Notes

Quick-reference answers for common technical interview questions about this project.

---

## Why PostgreSQL?

Mature, production-proven database with excellent composite index support and set-based operations. The row-value comparison syntax `(updated_at, id) < ($1, $2)` used for cursor pagination is a PostgreSQL feature that maps directly onto the index structure. Available on every major managed platform (Neon, RDS, Supabase, Render).

---

## Why raw SQL instead of an ORM?

Full visibility into every query. There is no abstraction layer to debug or explain. In a performance-focused project, being able to paste any query directly into `EXPLAIN ANALYZE` is more valuable than the convenience of an ORM. The dependency list stays minimal: `express`, `pg`, `dotenv`.

---

## Why cursor pagination?

Offset pagination forces the database to scan and discard all rows before the offset. At page 5,000 with limit 20, that is 100,000 rows scanned and thrown away — and the cost grows with every page.

Cursor pagination replaces the offset with a positional `WHERE` clause:

```sql
WHERE (updated_at, id) < ($1::timestamptz, $2::uuid)
ORDER BY updated_at DESC, id DESC
LIMIT 20
```

PostgreSQL resolves this via the composite index in O(log n) time regardless of depth. Performance is identical for page 1 and page 10,000.

---

## Why not OFFSET?

Two problems:

1. **Performance** — `OFFSET n` scans and discards n rows. At large offsets this is expensive and gets worse as the table grows.

2. **Correctness** — If a row is inserted between page 1 and page 2, all subsequent row positions shift by one. The client receives a duplicate row or skips a row entirely. There is no fix for this with offset pagination.

Cursor pagination solves both: it seeks directly to the cursor position, and new inserts sort before or after the cursor cleanly without disrupting an ongoing session.

---

## Why two indexes?

**Query 1: browse all products**

```sql
SELECT ... FROM products
ORDER BY updated_at DESC, id DESC
LIMIT 20
```

Best index: `(updated_at DESC, id DESC)` — starts with the sort columns.

**Query 2: browse with category filter**

```sql
SELECT ... FROM products
WHERE category = $1
ORDER BY updated_at DESC, id DESC
LIMIT 20
```

Best index: `(category, updated_at DESC, id DESC)` — the equality column goes first so Postgres resolves the filter with the index, then walks the remaining columns in sort order with no separate sort step.

One index cannot serve both shapes optimally. The first index has no `category` prefix, so a category filter requires a full index scan of it. The second index has `category` first, so without a category filter it cannot be used for a sorted scan.

---

## Why batch inserts in the seed script?

200,000 single-row `INSERT` statements = 200,000 network round-trips to PostgreSQL. Each round-trip costs roughly 1ms on a local connection.

200,000 × 1ms = ~200 seconds.

With batch inserts of 1,000 rows per query:

200 round-trips × 1ms = ~0.2 seconds of network overhead.

Actual observed runtime: 10–30 seconds (dominated by PostgreSQL's index maintenance, not network overhead).

---

## How did you verify correctness?

`scripts/verify-pagination.js` runs a live correctness check without needing the HTTP server:

1. Fetches page 1 from the service directly, stores 10 product IDs and the `nextCursor`
2. Inserts 5 new products with `updated_at = NOW()` (simulates concurrent writes)
3. Fetches page 2 using the stored cursor
4. Asserts no IDs overlap between page 1 and page 2
5. Continues to page 5, asserts no duplicate IDs across all pages

Why new inserts do not corrupt the session: they have `updated_at = NOW()`, which is newer than any cursor position. The condition `(updated_at, id) < cursor` filters them out of all subsequent pages automatically. They are only visible if the client restarts from page 1.

---

## What would you improve with more time?

- **Rate limiting** — protect the API from abuse (`express-rate-limit`)
- **Structured logging** — request IDs, response times, slow query detection
- **Migration system** — versioned SQL files instead of a single `schema.sql` that re-runs with `IF NOT EXISTS`
- **Integration tests** — automated assertions over the pagination boundary conditions, including concurrent insert scenarios
- **Full-text search** — `tsvector` index on `name` for product name search
- **Price sort option** — secondary sort by `price ASC/DESC` with its own index
