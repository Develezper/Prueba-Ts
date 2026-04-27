-- Generated full-text search vector for property title + description
ALTER TABLE "Property"
ADD COLUMN IF NOT EXISTS "search_vector" tsvector GENERATED ALWAYS AS (
  to_tsvector(
    'spanish',
    translate(
      lower(coalesce("title", '') || ' ' || coalesce("description", '')),
      'áéíóúüñÁÉÍÓÚÜÑ',
      'aeiouunaeiouun'
    )
  )
) STORED;

-- GIN index for fast full-text search
CREATE INDEX IF NOT EXISTS "Property_search_vector_gin_idx"
ON "Property" USING GIN ("search_vector");
