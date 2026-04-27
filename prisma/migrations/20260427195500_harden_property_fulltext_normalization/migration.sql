-- Keep unaccent available for accent-insensitive search normalization
CREATE EXTENSION IF NOT EXISTS unaccent;

-- Rebuild generated tsvector to normalize with lower(unaccent(...))
ALTER TABLE "Property"
DROP COLUMN IF EXISTS "search_vector";

ALTER TABLE "Property"
ADD COLUMN "search_vector" tsvector GENERATED ALWAYS AS (
  to_tsvector(
    'spanish',
    lower(unaccent(coalesce("title", '') || ' ' || coalesce("description", '')))
  )
) STORED;

-- Recreate GIN index over the regenerated vector
CREATE INDEX IF NOT EXISTS "Property_search_vector_gin_idx"
ON "Property" USING GIN ("search_vector");
