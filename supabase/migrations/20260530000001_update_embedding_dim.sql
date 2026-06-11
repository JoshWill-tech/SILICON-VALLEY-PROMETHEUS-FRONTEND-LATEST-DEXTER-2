-- Drop old table and function
DROP TABLE IF EXISTS public.knowledge_chunks;
DROP FUNCTION IF EXISTS match_knowledge_chunks;

-- Recreate with 3072 dimensions
CREATE TABLE public.knowledge_chunks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  topic text NOT NULL,
  content text NOT NULL,
  tags text[],
  type text CHECK (type IN ('technique', 'workflow', 'motion_beat', 'qa')),
  source text,
  source_url text,
  embedding extensions.vector(3072),
  created_at timestamptz DEFAULT now()
);

-- Recreate match function with 3072
CREATE OR REPLACE FUNCTION match_knowledge_chunks(
  query_embedding extensions.vector(3072),
  match_threshold float,
  match_count int
)
RETURNS TABLE(
  id uuid,
  topic text,
  content text,
  tags text[],
  type text,
  source text,
  source_url text,
  similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    knowledge_chunks.id,
    knowledge_chunks.topic,
    knowledge_chunks.content,
    knowledge_chunks.tags,
    knowledge_chunks.type,
    knowledge_chunks.source,
    knowledge_chunks.source_url,
    1 - (knowledge_chunks.embedding <=> query_embedding) AS similarity
  FROM knowledge_chunks
  WHERE 1 - (knowledge_chunks.embedding <=> query_embedding) > match_threshold
  ORDER BY knowledge_chunks.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;
