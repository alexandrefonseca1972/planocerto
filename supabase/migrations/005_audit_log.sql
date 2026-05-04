CREATE TABLE IF NOT EXISTS public.plan_audit_log (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id     UUID NOT NULL REFERENCES public.action_plans(id) ON DELETE CASCADE,
  item_id     UUID REFERENCES public.action_items(id) ON DELETE SET NULL,
  action      TEXT NOT NULL CHECK (action IN ('CREATE_PLAN','UPDATE_PLAN','CREATE_ITEM','UPDATE_ITEM','DELETE_ITEM')),
  snapshot    JSONB NOT NULL DEFAULT '{}',
  user_id     UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  user_name   TEXT DEFAULT '',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.plan_audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can read audit logs"
  ON public.plan_audit_log FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.action_plans p
      JOIN public.tenant_members tm ON tm.tenant_id = p.tenant_id
      WHERE p.id = plan_audit_log.plan_id AND tm.user_id = auth.uid()
    ) OR public.is_admin()
  );

CREATE POLICY "Members can insert audit logs"
  ON public.plan_audit_log FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.action_plans p
      JOIN public.tenant_members tm ON tm.tenant_id = p.tenant_id
      WHERE p.id = plan_audit_log.plan_id AND tm.user_id = auth.uid()
    ) OR public.is_admin()
  );
