-- Enable accent-insensitive normalization for full-text search
CREATE EXTENSION IF NOT EXISTS unaccent;

-- Generated full-text search vector for property title + description
ALTER TABLE "Property"
ADD COLUMN IF NOT EXISTS "search_vector" tsvector GENERATED ALWAYS AS (
  to_tsvector(
    'spanish',
    unaccent(coalesce("title", '') || ' ' || coalesce("description", ''))
  )
) STORED;

-- GIN index for fast full-text search
CREATE INDEX IF NOT EXISTS "Property_search_vector_gin_idx"
ON "Property" USING GIN ("search_vector");
