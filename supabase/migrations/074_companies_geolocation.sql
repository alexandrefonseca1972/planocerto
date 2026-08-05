-- Geolocalização na Carteira de Empresas (MVP "Cadastro de Locais" — Auvo).
-- Mesmo padrão da 073 (schools). Numeração 074 para não colidir com 066_* da main.
-- NÃO aplicar em produção sem decisão explícita e backup.
ALTER TABLE public.companies
  ADD COLUMN IF NOT EXISTS latitude  NUMERIC(10,7),
  ADD COLUMN IF NOT EXISTS longitude NUMERIC(10,7);
