-- Migration: Storage bucket + RLS for plan attachments
-- Creates the "plan-attachments" bucket and policies so authenticated tenant
-- members can upload/read/delete files tied to action_items.

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'plan-attachments',
  'plan-attachments',
  false,
  10485760, -- 10MB
  ARRAY[
    'image/png','image/jpeg','image/webp','image/gif','image/svg+xml',
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-excel',
    'text/csv'
  ]
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Path layout: <action_item_id>/<timestamp>-<filename>
-- Helper: extract item id from object name (first segment).

DROP POLICY IF EXISTS "plan_attachments_read" ON storage.objects;
CREATE POLICY "plan_attachments_read"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'plan-attachments'
    AND (
      EXISTS (
        SELECT 1
        FROM public.action_items ai
        JOIN public.action_plans ap ON ap.id = ai.plan_id
        JOIN public.tenant_members tm ON tm.tenant_id = ap.tenant_id AND tm.user_id = auth.uid()
        WHERE ai.id::text = split_part(storage.objects.name, '/', 1)
      )
      OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
    )
  );

DROP POLICY IF EXISTS "plan_attachments_insert" ON storage.objects;
CREATE POLICY "plan_attachments_insert"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'plan-attachments'
    AND owner = auth.uid()
    AND EXISTS (
      SELECT 1
      FROM public.action_items ai
      JOIN public.action_plans ap ON ap.id = ai.plan_id
      JOIN public.tenant_members tm ON tm.tenant_id = ap.tenant_id AND tm.user_id = auth.uid()
      WHERE ai.id::text = split_part(storage.objects.name, '/', 1)
    )
  );

DROP POLICY IF EXISTS "plan_attachments_delete" ON storage.objects;
CREATE POLICY "plan_attachments_delete"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'plan-attachments'
    AND (
      owner = auth.uid()
      OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
    )
  );
