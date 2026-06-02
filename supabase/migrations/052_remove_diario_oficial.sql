-- Remove a feature "Diário Oficial" (monitor / DO / INLABS) do PlanoCerto.
-- Reverte o schema introduzido em 037–043 e 050. As tabelas estavam vazias e
-- a feature não é mais consumida por nenhum código (rotas /api/do/*, workers
-- de ingest/extract/correlate/alerts e o webhook social foram removidos).
--
-- Mantém: extensão `vector` (usada pela knowledge_base em 045b), `pg_trgm` e
-- `pg_cron` (genéricas, podem servir a outras features).

-- Tabelas (CASCADE remove índices, FKs e a constraint de idempotência de 050).
DROP TABLE IF EXISTS public.entity_correlations CASCADE;
DROP TABLE IF EXISTS public.do_entities CASCADE;
DROP TABLE IF EXISTS public.do_publications CASCADE;
DROP TABLE IF EXISTS public.ingest_runs CASCADE;

-- Funções exclusivas da busca de publicações.
DROP FUNCTION IF EXISTS public.search_publications(
  query_text text, source_filter text, state_filter character,
  date_from date, date_to date, act_type_filter text,
  result_limit integer, result_offset integer
);
DROP FUNCTION IF EXISTS public.immutable_unaccent(text);

-- Extensão usada apenas pela busca do Diário Oficial.
DROP EXTENSION IF EXISTS unaccent;
