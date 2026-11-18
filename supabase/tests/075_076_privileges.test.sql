-- Teste de integração das migrations 075 (#1) e 076 (#2) em banco descartável.
-- Esquema mínimo + stubs de auth; exige os papéis anon/authenticated no cluster.
-- Rodar a partir da raiz do repositório:
--   createdb pc_test && psql -v ON_ERROR_STOP=1 -d pc_test -f supabase/tests/075_076_privileges.test.sql; dropdb pc_test

\set QUIET on
SET client_min_messages = warning;

-- ---------------------------------------------------------------- fixture
CREATE SCHEMA auth;
CREATE TABLE auth.users (id uuid PRIMARY KEY);
CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql STABLE AS
  $$ SELECT nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
GRANT USAGE ON SCHEMA auth TO anon, authenticated;

CREATE TABLE public.tenants (id uuid PRIMARY KEY, name text);
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id),
  name text NOT NULL DEFAULT '', email text NOT NULL DEFAULT '',
  role text NOT NULL DEFAULT 'user', avatar_url text,
  active_tenant_id uuid REFERENCES public.tenants(id),
  permissions jsonb, login_start_time time, login_end_time time,
  is_active boolean DEFAULT true, timezone text NOT NULL DEFAULT 'America/Sao_Paulo',
  phone text NOT NULL DEFAULT '', social_media jsonb NOT NULL DEFAULT '{}',
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE public.tenant_members (tenant_id uuid, user_id uuid, role text DEFAULT 'member');
CREATE TABLE public.tenant_member_roles (tenant_id uuid, user_id uuid, role text);
CREATE TABLE public.roles (name text PRIMARY KEY, permissions jsonb NOT NULL DEFAULT '{}');

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE
  USING (auth.uid() = id) WITH CHECK (auth.uid() = id AND role = 'user');
CREATE POLICY "Users can read own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
-- Privilégios padrão do Supabase (o que torna o achado #1 explorável).
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;

CREATE FUNCTION public.is_super_admin() RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER
  SET search_path = public AS
  $$ SELECT COALESCE((SELECT role = 'super_admin' FROM public.profiles WHERE id = auth.uid()), false) $$;
\i supabase/migrations/066_tenant_scoped_rls_functions.sql

-- u1 user comum; u2 manager membro só de T1; u3 admin global sem vínculo; u4 super_admin sem vínculo
INSERT INTO auth.users VALUES
  ('00000000-0000-0000-0000-000000000001'), ('00000000-0000-0000-0000-000000000002'),
  ('00000000-0000-0000-0000-000000000003'), ('00000000-0000-0000-0000-000000000004');
INSERT INTO public.tenants VALUES
  ('10000000-0000-0000-0000-000000000001', 'T1'), ('10000000-0000-0000-0000-000000000002', 'T2');
INSERT INTO public.profiles (id, role, permissions) VALUES
  ('00000000-0000-0000-0000-000000000001', 'user', '{"plans.update": true}'),
  ('00000000-0000-0000-0000-000000000002', 'manager', NULL),
  ('00000000-0000-0000-0000-000000000003', 'admin', NULL),
  ('00000000-0000-0000-0000-000000000004', 'super_admin', NULL);
INSERT INTO public.tenant_members VALUES
  ('10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'member'),
  ('10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002', 'member');

-- Sanidade: antes da 076 o admin global sem vínculo passa em T2 (achado #2).
SET request.jwt.claim.sub = '00000000-0000-0000-0000-000000000003';
DO $$ BEGIN
  ASSERT public.is_admin_for_tenant('10000000-0000-0000-0000-000000000002'), 'fixture: #2 deveria reproduzir antes da 076';
END $$;

-- ---------------------------------------------------------------- migrations
\i supabase/migrations/075_profiles_column_privileges.sql
\i supabase/migrations/076_tenant_role_requires_membership.sql

-- ---------------------------------------------------------------- #1
CREATE FUNCTION pg_temp.expect_denied(sql text) RETURNS void LANGUAGE plpgsql AS $$
BEGIN
  EXECUTE sql;
  RAISE EXCEPTION 'esperava permission denied: %', sql;
EXCEPTION WHEN insufficient_privilege THEN NULL;
END $$;

SET ROLE authenticated;
SET request.jwt.claim.sub = '00000000-0000-0000-0000-000000000001';
SELECT pg_temp.expect_denied($q$UPDATE public.profiles SET permissions = '{"users.manage": true}' WHERE id = auth.uid()$q$);
SELECT pg_temp.expect_denied($q$UPDATE public.profiles SET is_active = true WHERE id = auth.uid()$q$);
SELECT pg_temp.expect_denied($q$UPDATE public.profiles SET login_start_time = NULL, login_end_time = NULL WHERE id = auth.uid()$q$);
SELECT pg_temp.expect_denied($q$UPDATE public.profiles SET timezone = 'UTC' WHERE id = auth.uid()$q$);
SELECT pg_temp.expect_denied($q$UPDATE public.profiles SET role = 'admin' WHERE id = auth.uid()$q$);

-- Campos pessoais continuam editáveis, inclusive por papel != 'user'.
UPDATE public.profiles SET name = 'Novo', phone = '1', social_media = '{}', updated_at = now(),
  active_tenant_id = '10000000-0000-0000-0000-000000000001' WHERE id = auth.uid();
SET request.jwt.claim.sub = '00000000-0000-0000-0000-000000000002';
UPDATE public.profiles SET name = 'Manager' WHERE id = auth.uid();
-- Não altera perfil alheio.
UPDATE public.profiles SET name = 'hack' WHERE id = '00000000-0000-0000-0000-000000000001';
RESET ROLE;
DO $$ BEGIN
  ASSERT (SELECT name FROM public.profiles WHERE id = '00000000-0000-0000-0000-000000000001') = 'Novo', '#1: user deveria editar o próprio nome';
  ASSERT (SELECT name FROM public.profiles WHERE id = '00000000-0000-0000-0000-000000000002') = 'Manager', '#1: manager deveria editar o próprio nome';
END $$;

-- ---------------------------------------------------------------- #2
SET request.jwt.claim.sub = '00000000-0000-0000-0000-000000000003'; -- admin global, sem vínculo
DO $$ BEGIN
  ASSERT NOT public.is_admin_for_tenant('10000000-0000-0000-0000-000000000002'), '#2: admin global sem vínculo não pode administrar T2';
  ASSERT NOT public.has_perm_for_tenant('plans.update', '10000000-0000-0000-0000-000000000002'), '#2: sem vínculo não tem permissão';
END $$;

SET request.jwt.claim.sub = '00000000-0000-0000-0000-000000000002'; -- manager membro de T1
DO $$ BEGIN
  ASSERT public.is_admin_for_tenant('10000000-0000-0000-0000-000000000001'), '#2: manager membro administra T1';
  ASSERT NOT public.is_admin_for_tenant('10000000-0000-0000-0000-000000000002'), '#2: manager não administra T2';
END $$;

SET request.jwt.claim.sub = '00000000-0000-0000-0000-000000000001'; -- user com override plans.update
DO $$ BEGIN
  ASSERT public.has_perm_for_tenant('plans.update', '10000000-0000-0000-0000-000000000001'), '#2: override vale no tenant do vínculo';
  ASSERT NOT public.has_perm_for_tenant('plans.update', '10000000-0000-0000-0000-000000000002'), '#2: override não vale fora do vínculo';
  ASSERT NOT public.is_admin_for_tenant('10000000-0000-0000-0000-000000000001'), '#2: user não é admin';
END $$;

SET request.jwt.claim.sub = '00000000-0000-0000-0000-000000000004'; -- super_admin sem vínculo
DO $$ BEGIN
  ASSERT public.is_admin_for_tenant('10000000-0000-0000-0000-000000000002'), '#2: super_admin mantém acesso global';
  ASSERT public.has_perm_for_tenant('plans.update', '10000000-0000-0000-0000-000000000002'), '#2: super_admin mantém permissões';
END $$;

\echo OK: 075/076 privileges
