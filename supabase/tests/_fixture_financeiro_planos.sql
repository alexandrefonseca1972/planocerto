-- Fixture compartilhada pelos testes 082/083 (banco descartável).
\set QUIET on
SET client_min_messages = warning;

CREATE SCHEMA auth;
CREATE TABLE auth.users (id uuid PRIMARY KEY);
CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql STABLE AS
  $$ SELECT nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
GRANT USAGE ON SCHEMA auth TO anon, authenticated;

CREATE TABLE public.tenants (id uuid PRIMARY KEY);
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY, name text NOT NULL DEFAULT '', role text NOT NULL DEFAULT 'user',
  avatar_url text, active_tenant_id uuid, permissions jsonb, login_start_time time,
  login_end_time time, is_active boolean DEFAULT true, timezone text DEFAULT 'UTC',
  phone text DEFAULT '', social_media jsonb DEFAULT '{}', updated_at timestamptz DEFAULT now()
);
CREATE TABLE public.tenant_members (tenant_id uuid, user_id uuid, role text DEFAULT 'member');
CREATE TABLE public.tenant_member_roles (tenant_id uuid, user_id uuid, role text);
CREATE TABLE public.roles (name text PRIMARY KEY, permissions jsonb NOT NULL DEFAULT '{}');
CREATE TABLE public.action_plans (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), tenant_id uuid NOT NULL,
  unit_id uuid, user_id uuid, title text DEFAULT '', visibility text DEFAULT 'public', updated_at timestamptz DEFAULT now());
CREATE TABLE public.action_items (id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id uuid NOT NULL REFERENCES public.action_plans(id) ON DELETE CASCADE, parent_id uuid, status int DEFAULT 1);
CREATE TABLE public.contas_pagar (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), tenant_id uuid NOT NULL,
  plan_id uuid, item_id uuid, fornecedor_id uuid, categoria_id uuid, descricao text DEFAULT '',
  documento text DEFAULT '', emissao date, valor_total numeric(14,2) DEFAULT 0,
  status text DEFAULT 'aberto', observacoes text DEFAULT '');
CREATE TABLE public.parcelas_pagar (id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conta_id uuid NOT NULL REFERENCES public.contas_pagar(id) ON DELETE CASCADE,
  numero int DEFAULT 1, data_vencimento date DEFAULT current_date, valor numeric(14,2) DEFAULT 0,
  status text DEFAULT 'pendente', valor_pago numeric(14,2), data_pagamento date, forma_pagamento text DEFAULT '');
CREATE TABLE public.conta_attachments (id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conta_id uuid NOT NULL REFERENCES public.contas_pagar(id) ON DELETE CASCADE, uploaded_by uuid);

CREATE FUNCTION public.is_super_admin() RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS
  $$ SELECT COALESCE((SELECT role = 'super_admin' FROM public.profiles WHERE id = auth.uid()), false) $$;
CREATE FUNCTION public.can_access_unit(uuid) RETURNS boolean LANGUAGE sql STABLE AS $$ SELECT true $$;

ALTER TABLE public.action_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.action_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contas_pagar ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.parcelas_pagar ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conta_attachments ENABLE ROW LEVEL SECURITY;
CREATE POLICY r ON public.action_items FOR SELECT USING (plan_id IN (SELECT id FROM public.action_plans));
CREATE POLICY r ON public.contas_pagar FOR SELECT USING (EXISTS (SELECT 1 FROM public.tenant_members WHERE tenant_id = contas_pagar.tenant_id AND user_id = auth.uid()));
CREATE POLICY r ON public.parcelas_pagar FOR SELECT USING (conta_id IN (SELECT id FROM public.contas_pagar));
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;

\i supabase/migrations/066_tenant_scoped_rls_functions.sql
\i supabase/migrations/076_tenant_role_requires_membership.sql
\i supabase/migrations/077_write_policies_require_permissions.sql
\i supabase/migrations/082_financeiro_concorrencia.sql
\i supabase/migrations/083_plan_visibility_restricted.sql

-- a: user (cria/edita planos; sem financeiro) | b: user | m: manager | f: "financeiro" (create/update, sem delete) | d: "diretor" (finance.delete)
INSERT INTO public.tenants VALUES ('10000000-0000-0000-0000-000000000001');
INSERT INTO public.roles VALUES
  ('financeiro', '{"finance.create": true, "finance.update": true}'),
  ('diretor', '{"finance.delete": true}');
INSERT INTO public.profiles (id, role) VALUES
  ('00000000-0000-0000-0000-00000000000a', 'user'),
  ('00000000-0000-0000-0000-00000000000b', 'user'),
  ('00000000-0000-0000-0000-00000000000d', 'diretor'),
  ('00000000-0000-0000-0000-00000000000e', 'manager'),
  ('00000000-0000-0000-0000-00000000000f', 'financeiro');
INSERT INTO public.tenant_members (tenant_id, user_id)
  SELECT '10000000-0000-0000-0000-000000000001', id FROM public.profiles;
