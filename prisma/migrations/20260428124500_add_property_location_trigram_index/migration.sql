CREATE EXTENSION IF NOT EXISTS unaccent;
CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE OR REPLACE FUNCTION immutable_unaccent(input_text text)
RETURNS text
LANGUAGE sql
IMMUTABLE
PARALLEL SAFE
AS $$
  SELECT unaccent('public.unaccent', input_text)
$$;

CREATE INDEX IF NOT EXISTS "Property_location_normalized_trgm_idx"
ON "Property"
USING GIN (immutable_unaccent(lower("location")) gin_trgm_ops);