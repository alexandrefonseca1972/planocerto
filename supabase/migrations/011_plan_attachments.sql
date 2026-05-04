-- Migration: Plan attachments (file uploads for action items)
CREATE TABLE IF NOT EXISTS public.plan_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id UUID NOT NULL REFERENCES public.action_items(id) ON DELETE CASCADE,
  filename TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  size INTEGER NOT NULL,
  mime_type TEXT NOT NULL,
  uploaded_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.plan_attachments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can read attachments on their tenant items"
  ON public.plan_attachments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.action_items ai
      JOIN public.action_plans ap ON ap.id = ai.plan_id
      JOIN public.tenant_members tm ON tm.tenant_id = ap.tenant_id AND tm.user_id = auth.uid()
      WHERE ai.id = plan_attachments.item_id
    )
    OR
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Members can insert attachments"
  ON public.plan_attachments FOR INSERT
  WITH CHECK (
    auth.uid() = uploaded_by
    AND
    EXISTS (
      SELECT 1 FROM public.action_items ai
      JOIN public.action_plans ap ON ap.id = ai.plan_id
      JOIN public.tenant_members tm ON tm.tenant_id = ap.tenant_id AND tm.user_id = auth.uid()
      WHERE ai.id = plan_attachments.item_id
    )
  );

CREATE POLICY "Members can delete own attachments"
  ON public.plan_attachments FOR DELETE
  USING (
    uploaded_by = auth.uid()
    OR
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );
