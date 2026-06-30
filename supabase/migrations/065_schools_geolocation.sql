-- Geolocalização na Carteira de Escolas (MVP "Cadastro de Locais" da migração Auvo).
-- Coordenadas manuais (geocoding automático fica para etapa futura). Nullable —
-- locais existentes seguem sem coordenadas até serem preenchidas.
ALTER TABLE public.schools
  ADD COLUMN IF NOT EXISTS latitude  NUMERIC(10,7),
  ADD COLUMN IF NOT EXISTS longitude NUMERIC(10,7);
