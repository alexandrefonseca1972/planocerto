-- Catálogo de Unidades: campos de responsável e contato.
-- responsavel = Diretor/Reitor da unidade.

ALTER TABLE public.units
  ADD COLUMN IF NOT EXISTS responsavel text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS email       text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS fone        text NOT NULL DEFAULT '';

COMMENT ON COLUMN public.units.responsavel IS 'Responsável pela unidade (Diretor/Reitor).';
