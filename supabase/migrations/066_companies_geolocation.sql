-- Geolocalização na Carteira de Empresas (MVP "Cadastro de Locais" — Auvo).
-- Mesmo padrão da migration 065 (schools): coordenadas manuais, nullable.
ALTER TABLE public.companies
  ADD COLUMN IF NOT EXISTS latitude  NUMERIC(10,7),
  ADD COLUMN IF NOT EXISTS longitude NUMERIC(10,7);
