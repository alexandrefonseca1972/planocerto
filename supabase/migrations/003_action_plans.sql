CREATE TABLE IF NOT EXISTS public.action_plans (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id     UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  title         TEXT NOT NULL,
  description   TEXT DEFAULT '',
  category      TEXT NOT NULL DEFAULT 'general' CHECK (category IN ('savings','investment','debt_reduction','budget','emergency_fund','retirement','general')),
  status        TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','in_progress','completed','cancelled')),
  target_date   DATE,
  user_id       UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.action_plans ENABLE ROW LEVEL SECURITY;

-- Members can read plans in their tenants
CREATE POLICY "Members can read plans in own tenants"
  ON public.action_plans FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.tenant_members
      WHERE tenant_id = action_plans.tenant_id AND user_id = auth.uid()
    )
    OR public.is_admin()
  );

-- Members can create plans in their tenants
CREATE POLICY "Members can create plans in own tenants"
  ON public.action_plans FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.tenant_members
      WHERE tenant_id = action_plans.tenant_id AND user_id = auth.uid()
    )
    OR public.is_admin()
  );

-- Members can update plans in their tenants
CREATE POLICY "Members can update plans in own tenants"
  ON public.action_plans FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.tenant_members
      WHERE tenant_id = action_plans.tenant_id AND user_id = auth.uid()
    )
    OR public.is_admin()
  );

-- Members can delete plans in their tenants (owners and admins)
CREATE POLICY "Members can delete plans in own tenants"
  ON public.action_plans FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.tenant_members
      WHERE tenant_id = action_plans.tenant_id
        AND user_id = auth.uid()
        AND role IN ('owner', 'admin')
    )
    OR public.is_admin()
  );
