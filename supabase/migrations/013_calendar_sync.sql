-- Migration: Calendar sync state tracking
CREATE TABLE IF NOT EXISTS public.calendar_sync (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id UUID NOT NULL REFERENCES public.action_items(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  provider TEXT NOT NULL CHECK (provider IN ('google', 'outlook')),
  calendar_event_id TEXT NOT NULL,
  last_synced_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.calendar_sync ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own calendar syncs"
  ON public.calendar_sync FOR ALL
  USING (auth.uid() = user_id);
