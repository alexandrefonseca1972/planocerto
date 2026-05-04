-- Migration: Item comments
CREATE TABLE IF NOT EXISTS public.item_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id UUID NOT NULL REFERENCES public.action_items(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.item_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can read comments on their tenant items"
  ON public.item_comments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.action_items ai
      JOIN public.action_plans ap ON ap.id = ai.plan_id
      JOIN public.tenant_members tm ON tm.tenant_id = ap.tenant_id AND tm.user_id = auth.uid()
      WHERE ai.id = item_comments.item_id
    )
    OR
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Members can insert comments"
  ON public.item_comments FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    AND
    EXISTS (
      SELECT 1 FROM public.action_items ai
      JOIN public.action_plans ap ON ap.id = ai.plan_id
      JOIN public.tenant_members tm ON tm.tenant_id = ap.tenant_id AND tm.user_id = auth.uid()
      WHERE ai.id = item_comments.item_id
    )
  );

CREATE POLICY "Users can update own comments"
  ON public.item_comments FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own comments"
  ON public.item_comments FOR DELETE
  USING (auth.uid() = user_id);
