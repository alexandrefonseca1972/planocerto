-- Adiciona controle de ativo/inativo e timestamp em areas.

ALTER TABLE public.areas
  ADD COLUMN IF NOT EXISTS active     BOOLEAN     NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now();
