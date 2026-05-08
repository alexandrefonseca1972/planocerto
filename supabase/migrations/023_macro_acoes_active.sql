-- Adiciona controle de ativo/inativo e timestamp de update em macro_acoes.

ALTER TABLE public.macro_acoes
  ADD COLUMN IF NOT EXISTS active     BOOLEAN     NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now();

-- RLS já existe (read all auth, admin write) — garante apenas atualização para admin.
