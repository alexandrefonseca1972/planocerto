-- Métricas estruturadas do modelo Excel "PLANO DE AÇÃO":
-- Preço (orçamento) e funil triplo Inscritos / Mat. Financeira / Mat. Acadêmica
-- com pares Esperado/Real.

ALTER TABLE public.action_items
  ADD COLUMN IF NOT EXISTS preco              NUMERIC(12,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS inscritos_esperado INT           NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS inscritos_real     INT           NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS mat_fin_esperado   INT           NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS mat_fin_real       INT           NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS mat_acad_esperado  INT           NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS mat_acad_real      INT           NOT NULL DEFAULT 0;

-- Índices úteis para agregação no dashboard
CREATE INDEX IF NOT EXISTS idx_action_items_metrics
  ON public.action_items(plan_id, status);
