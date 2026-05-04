-- Migration: Add teams_webhook_url column to tenants table
-- Required by: src/app/actions/action-plan.ts:161, src/app/actions/tenant.ts:198

ALTER TABLE public.tenants
ADD COLUMN IF NOT EXISTS teams_webhook_url TEXT DEFAULT '';
