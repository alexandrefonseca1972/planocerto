-- Limite de unidades por empresa. NULL = ilimitado (default atual).
-- O super_admin define o limite por empresa; o phase-2 (onboarding/venda)
-- poderá derivá-lo do plano contratado.
ALTER TABLE public.tenants
  ADD COLUMN IF NOT EXISTS max_units integer;

COMMENT ON COLUMN public.tenants.max_units IS 'Limite de unidades da empresa. NULL = ilimitado.';
