-- Adiciona controle de ativo/inativo e timestamp em units.

ALTER TABLE public.units
  ADD COLUMN IF NOT EXISTS active     BOOLEAN     NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now();
