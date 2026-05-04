-- Tenants (empresas)
CREATE TABLE IF NOT EXISTS public.tenants (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name          TEXT NOT NULL,
  slug          TEXT UNIQUE NOT NULL,
  plan          TEXT NOT NULL DEFAULT 'free' CHECK (plan IN ('free', 'pro', 'enterprise')),
  active        BOOLEAN NOT NULL DEFAULT true,
  logo_url      TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Tenant members (relacionamento usuário-tenant)
CREATE TABLE IF NOT EXISTS public.tenant_members (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id     UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  user_id       UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role          TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member')),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(tenant_id, user_id)
);

-- Add tenant_id to profiles (current active tenant)
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS active_tenant_id UUID REFERENCES public.tenants(id) ON DELETE SET NULL;

-- Enable RLS
ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tenant_members ENABLE ROW LEVEL SECURITY;

-- Tenants policies
CREATE POLICY "Members can read own tenants"
  ON public.tenants FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.tenant_members
      WHERE tenant_id = id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can read all tenants"
  ON public.tenants FOR SELECT
  USING (public.is_admin());

CREATE POLICY "Admins can create tenants"
  ON public.tenants FOR INSERT
  WITH CHECK (public.is_admin());

CREATE POLICY "Admins can update tenants"
  ON public.tenants FOR UPDATE
  USING (public.is_admin());

CREATE POLICY "Admins can delete tenants"
  ON public.tenants FOR DELETE
  USING (public.is_admin());

-- Tenant members policies
CREATE POLICY "Members can read own memberships"
  ON public.tenant_members FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Admins can read all memberships"
  ON public.tenant_members FOR SELECT
  USING (public.is_admin());

CREATE POLICY "Tenant admins can insert members"
  ON public.tenant_members FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.tenant_members
      WHERE tenant_id = tenant_members.tenant_id
      AND user_id = auth.uid()
      AND role IN ('owner', 'admin')
    )
    OR public.is_admin()
  );

CREATE POLICY "Tenant admins can update members"
  ON public.tenant_members FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.tenant_members
      WHERE tenant_id = tenant_members.tenant_id
      AND user_id = auth.uid()
      AND role IN ('owner', 'admin')
    )
    OR public.is_admin()
  );

CREATE POLICY "Tenant admins can delete members"
  ON public.tenant_members FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.tenant_members
      WHERE tenant_id = tenant_members.tenant_id
      AND user_id = auth.uid()
      AND role IN ('owner', 'admin')
    )
    OR public.is_admin()
  );

-- Create a default tenant for existing users
INSERT INTO public.tenants (id, name, slug, plan) VALUES
  (gen_random_uuid(), 'PlanoCerto', 'planocerto', 'enterprise')
ON CONFLICT (slug) DO NOTHING;

-- Add existing users to default tenant as owner
INSERT INTO public.tenant_members (tenant_id, user_id, role)
SELECT t.id, p.id, 'owner'
FROM public.tenants t
CROSS JOIN public.profiles p
WHERE t.slug = 'planocerto'
ON CONFLICT (tenant_id, user_id) DO NOTHING;

-- Set active tenant for existing users
UPDATE public.profiles
SET active_tenant_id = (SELECT id FROM public.tenants WHERE slug = 'planocerto' LIMIT 1)
WHERE active_tenant_id IS NULL;
