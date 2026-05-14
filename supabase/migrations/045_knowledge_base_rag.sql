-- Migration para Base de Conhecimento (RAG)
CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE IF NOT EXISTS public.knowledge_base (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  content     TEXT NOT NULL,
  metadata    JSONB DEFAULT '{}',
  embedding   VECTOR(1536),
  created_at  TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS knowledge_base_embedding_idx ON public.knowledge_base USING hnsw (embedding vector_cosine_ops);

-- Função para busca semântica simples (início)
CREATE OR REPLACE FUNCTION match_knowledge(
  query_embedding VECTOR(1536),
  match_threshold FLOAT,
  match_count INT,
  p_tenant_id UUID
) RETURNS TABLE (
  id UUID,
  content TEXT,
  similarity FLOAT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    kb.id,
    kb.content,
    1 - (kb.embedding <=> query_embedding) AS similarity
  FROM public.knowledge_base kb
  WHERE kb.tenant_id = p_tenant_id
    AND 1 - (kb.embedding <=> query_embedding) > match_threshold
  ORDER BY similarity DESC
  LIMIT match_count;
END;
$$ LANGUAGE plpgsql;
