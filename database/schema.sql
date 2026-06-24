-- uuid-ossp provides uuid_generate_v4() for UUID primary keys.
-- gen_random_uuid() is an alternative on PG 13+ without this extension.
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS products (
  id          UUID             PRIMARY KEY DEFAULT uuid_generate_v4(),
  name        TEXT             NOT NULL,
  category    TEXT             NOT NULL,
  price       NUMERIC(10, 2)   NOT NULL,
  created_at  TIMESTAMPTZ      NOT NULL,
  updated_at  TIMESTAMPTZ      NOT NULL
);

-- Used when browsing all products: ORDER BY updated_at DESC, id DESC
-- id is the tie-breaker — ensures stable, deterministic order when two rows
-- share the same updated_at timestamp.
CREATE INDEX IF NOT EXISTS idx_products_updated_at_id
  ON products (updated_at DESC, id DESC);

-- Used when filtering by category: WHERE category = $1 ORDER BY updated_at DESC, id DESC
-- Placing category first allows Postgres to match the equality condition via the index,
-- then walk the remaining (updated_at, id) portion in sorted order — no separate sort step.
CREATE INDEX IF NOT EXISTS idx_products_category_updated_at_id
  ON products (category, updated_at DESC, id DESC);
