-- Campos de classificação do modelo Excel "PLANO DE AÇÃO":
-- TIPO PA, ÁREA, PRIORIDADE (texto livre, espelham os catálogos homônimos),
-- SUBAÇÃO e COMO? (complementos 5W2H ainda não mapeados).

ALTER TABLE public.action_items
  ADD COLUMN IF NOT EXISTS tipo_pa    TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS area       TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS prioridade TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS subacao    TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS como       TEXT NOT NULL DEFAULT '';
