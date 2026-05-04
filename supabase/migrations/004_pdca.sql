DROP TABLE IF EXISTS public.action_plans CASCADE;

CREATE TABLE public.action_plans (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  title           TEXT NOT NULL,
  category        TEXT NOT NULL DEFAULT 'general' CHECK (category IN ('savings','investment','debt_reduction','budget','emergency_fund','retirement','general')),
  status          TEXT NOT NULL DEFAULT 'plan' CHECK (status IN ('plan','do','check','act','completed')),
  -- Plan (Planejar)
  plan_objective  TEXT DEFAULT '',
  plan_problem    TEXT DEFAULT '',
  plan_target     TEXT DEFAULT '',
  plan_kpi        TEXT DEFAULT '',
  plan_actions    TEXT DEFAULT '',
  plan_resources  TEXT DEFAULT '',
  plan_responsible TEXT DEFAULT '',
  plan_deadline   DATE,
  -- Do (Executar)
  do_date         DATE,
  do_actions      TEXT DEFAULT '',
  do_observations TEXT DEFAULT '',
  do_deviations   TEXT DEFAULT '',
  -- Check (Verificar)
  check_date      DATE,
  check_results   TEXT DEFAULT '',
  check_comparison TEXT DEFAULT '',
  check_gap       TEXT DEFAULT '',
  check_learnings TEXT DEFAULT '',
  -- Act (Agir)
  act_date        DATE,
  act_standardization TEXT DEFAULT '',
  act_adjustments    TEXT DEFAULT '',
  act_next_cycle     TEXT DEFAULT '',
  -- Meta
  user_id         UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.action_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can read plans"
  ON public.action_plans FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.tenant_members
      WHERE tenant_id = action_plans.tenant_id AND user_id = auth.uid()
    ) OR public.is_admin()
  );

CREATE POLICY "Members can insert plans"
  ON public.action_plans FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.tenant_members
      WHERE tenant_id = action_plans.tenant_id AND user_id = auth.uid()
    ) OR public.is_admin()
  );

CREATE POLICY "Members can update plans"
  ON public.action_plans FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.tenant_members
      WHERE tenant_id = action_plans.tenant_id AND user_id = auth.uid()
    ) OR public.is_admin()
  );

CREATE POLICY "Tenant admins can delete plans"
  ON public.action_plans FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.tenant_members
      WHERE tenant_id = action_plans.tenant_id
        AND user_id = auth.uid() AND role IN ('owner', 'admin')
    ) OR public.is_admin()
  );
