-- RBAC + Login Time + Notifications

-- Add permissions column to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS permissions JSONB DEFAULT '{"create_plan":true,"edit_plan":true,"delete_plan":false,"create_item":true,"edit_item":true,"delete_item":false}';

-- Add login time restrictions
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS login_start_time TIME DEFAULT NULL;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS login_end_time TIME DEFAULT NULL;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- Notifications table
CREATE TABLE IF NOT EXISTS public.notifications (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title         TEXT NOT NULL,
  message       TEXT NOT NULL DEFAULT '',
  type          TEXT NOT NULL DEFAULT 'info' CHECK (type IN ('info','warning','success','error')),
  target_type   TEXT NOT NULL DEFAULT 'all' CHECK (target_type IN ('all','user','tenant')),
  target_id     UUID,
  is_fixed      BOOLEAN NOT NULL DEFAULT false,
  expires_at    TIMESTAMPTZ,
  created_by    UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Notification read status per user
CREATE TABLE IF NOT EXISTS public.notification_reads (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  notification_id UUID NOT NULL REFERENCES public.notifications(id) ON DELETE CASCADE,
  user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  read_at         TIMESTAMPTZ DEFAULT now(),
  UNIQUE(notification_id, user_id)
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_reads ENABLE ROW LEVEL SECURITY;

-- Notifications policies
CREATE POLICY "Users can read targeted notifications" ON public.notifications FOR SELECT
  USING (
    target_type = 'all'
    OR (target_type = 'user' AND target_id = auth.uid())
    OR (target_type = 'tenant' AND target_id IN (SELECT tenant_id FROM public.tenant_members WHERE user_id = auth.uid()))
    OR public.is_admin()
  );

CREATE POLICY "Admins can create notifications" ON public.notifications FOR INSERT
  WITH CHECK (public.is_admin());

CREATE POLICY "Admins can update notifications" ON public.notifications FOR UPDATE
  USING (public.is_admin());

CREATE POLICY "Admins can delete notifications" ON public.notifications FOR DELETE
  USING (public.is_admin());

-- Notification reads policies
CREATE POLICY "Users can read own reads" ON public.notification_reads FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own reads" ON public.notification_reads FOR INSERT
  WITH CHECK (user_id = auth.uid());
