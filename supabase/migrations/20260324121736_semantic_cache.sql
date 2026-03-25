-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Table for semantic cache
CREATE TABLE IF NOT EXISTS public.ai_semantic_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  niche_label TEXT NOT NULL,
  query_text TEXT NOT NULL,
  query_embedding VECTOR(768),
  cached_response JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (now() + interval '7 days')
);

-- Enable RLS
ALTER TABLE public.ai_semantic_cache ENABLE ROW LEVEL SECURITY;

-- Add classification to detected_problems
ALTER TABLE public.detected_problems ADD COLUMN IF NOT EXISTS mindset_classification TEXT; -- SaaS Tradicional | AI-First

-- Policies
CREATE POLICY "Users can view their own cache" ON public.ai_semantic_cache FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own cache" ON public.ai_semantic_cache FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Index for similarity search
CREATE INDEX ON ai_semantic_cache USING ivfflat (query_embedding vector_cosine_ops)
WITH (lists = 100);

-- RPC for semantic matching
CREATE OR REPLACE FUNCTION match_semantic_cache (
  query_embedding vector(768),
  match_threshold float,
  match_count int
)
RETURNS TABLE (
  id uuid,
  cached_response jsonb,
  similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    ai_semantic_cache.id,
    ai_semantic_cache.cached_response,
    1 - (ai_semantic_cache.query_embedding <=> query_embedding) AS similarity
  FROM ai_semantic_cache
  WHERE 1 - (ai_semantic_cache.query_embedding <=> query_embedding) > match_threshold
  ORDER BY ai_semantic_cache.query_embedding <=> query_embedding
  LIMIT match_count;
END;
$$;
