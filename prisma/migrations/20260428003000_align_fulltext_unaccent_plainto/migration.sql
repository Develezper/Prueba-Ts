-- Align full-text normalization with lower(unaccent(...)) for existing databases.

CREATE EXTENSION IF NOT EXISTS unaccent;

CREATE OR REPLACE FUNCTION immutable_unaccent(input_text text)
RETURNS text
LANGUAGE sql
IMMUTABLE
PARALLEL SAFE
AS $$
  SELECT unaccent('public.unaccent', input_text)
$$;

ALTER TABLE "Property"
DROP COLUMN IF EXISTS "search_vector";

ALTER TABLE "Property"
ADD COLUMN "search_vector" tsvector GENERATED ALWAYS AS (
  to_tsvector(
    'spanish',
    immutable_unaccent(lower(coalesce("title", '') || ' ' || coalesce("description", '')))
  )
) STORED;

CREATE INDEX IF NOT EXISTS "Property_search_vector_gin_idx"
ON "Property" USING GIN ("search_vector");
