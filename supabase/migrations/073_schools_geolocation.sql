-- Geolocalização na Carteira de Escolas (MVP "Cadastro de Locais" / migração Auvo).
-- Coordenadas manuais (geocoding automático fica para etapa futura). Nullable.
-- Numeração 073: evita colisão com 065_tenant_member_roles na main.
-- NÃO aplicar em produção sem decisão explícita e backup.
ALTER TABLE public.schools
  ADD COLUMN IF NOT EXISTS latitude  NUMERIC(10,7),
  ADD COLUMN IF NOT EXISTS longitude NUMERIC(10,7);
