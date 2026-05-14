ALTER TABLE public.action_plans
  ADD COLUMN IF NOT EXISTS unit_id UUID REFERENCES public.units(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_action_plans_unit_id
  ON public.action_plans(unit_id);

UPDATE public.action_plans ap
SET unit_id = u.id
FROM public.units u
WHERE ap.unit_id IS NULL
  AND ap.tenant_id = u.tenant_id
  AND lower(trim(ap.unit)) = lower(trim(u.name));

COMMENT ON COLUMN public.action_plans.unit_id IS
  'Referência oficial à unidade do catálogo. Mantém unit textual como compatibilidade temporária.';
