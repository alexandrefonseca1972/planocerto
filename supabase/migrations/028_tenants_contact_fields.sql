-- Adiciona campos de contato/cadastro à tenants (Empresas).
-- Todos opcionais.

ALTER TABLE public.tenants
  ADD COLUMN IF NOT EXISTS cnpj             TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS responsavel_nome TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS email            TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS site             TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS fone             TEXT NOT NULL DEFAULT '';

-- CNPJ é único quando preenchido (string vazia pode repetir).
CREATE UNIQUE INDEX IF NOT EXISTS idx_tenants_cnpj_unique
  ON public.tenants(cnpj)
  WHERE cnpj <> '';
