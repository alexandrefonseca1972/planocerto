-- Habilita RLS na knowledge_base (base RAG criada em 045b).
-- A tabela ainda não é consumida pela aplicação; o acesso é apenas via
-- service_role até a feature de RAG ser construída. Quando isso acontecer,
-- adicionar policies de leitura por tenant/unidade/área (colunas unit_id/area_id
-- vieram em 046). Resolve o advisor rls_disabled_in_public (lint 0013).

ALTER TABLE public.knowledge_base ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "service role full access knowledge_base" ON public.knowledge_base;
CREATE POLICY "service role full access knowledge_base"
  ON public.knowledge_base FOR ALL TO service_role
  USING (true) WITH CHECK (true);
