-- Migration: Public share links for dashboards
CREATE TABLE IF NOT EXISTS public.public_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id UUID NOT NULL REFERENCES public.action_plans(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.public_links ENABLE ROW LEVEL SECURITY;

-- Only plan owners/admins can create links
CREATE POLICY "Plan members can manage links"
  ON public.public_links FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.action_plans ap
      JOIN public.tenant_members tm ON tm.tenant_id = ap.tenant_id AND tm.user_id = auth.uid()
      WHERE ap.id = public_links.plan_id AND tm.role IN ('owner', 'admin')
    )
    OR
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Anyone can read by token (public access)
CREATE POLICY "Anyone can read by token"
  ON public.public_links FOR SELECT
  USING (true);
