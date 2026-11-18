-- Teste de integração da migration 077 (#3) em banco descartável.
-- Rodar a partir da raiz do repositório:
--   createdb pc_test && psql -v ON_ERROR_STOP=1 -d pc_test -f supabase/tests/077_write_policies.test.sql; dropdb pc_test

\set QUIET on
SET client_min_messages = warning;

-- ---------------------------------------------------------------- fixture
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
  unit_id uuid, user_id uuid, title text DEFAULT '', updated_at timestamptz DEFAULT now());
CREATE TABLE public.action_items (id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id uuid NOT NULL REFERENCES public.action_plans(id) ON DELETE CASCADE, parent_id uuid, status int DEFAULT 1);
CREATE TABLE public.contas_pagar (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), tenant_id uuid NOT NULL,
  descricao text DEFAULT '', status text DEFAULT 'aberto');
CREATE TABLE public.parcelas_pagar (id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conta_id uuid NOT NULL REFERENCES public.contas_pagar(id) ON DELETE CASCADE, status text DEFAULT 'pendente');
CREATE TABLE public.conta_attachments (id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conta_id uuid NOT NULL REFERENCES public.contas_pagar(id) ON DELETE CASCADE, uploaded_by uuid);

CREATE FUNCTION public.is_super_admin() RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS
  $$ SELECT COALESCE((SELECT role = 'super_admin' FROM public.profiles WHERE id = auth.uid()), false) $$;
CREATE FUNCTION public.can_access_unit(uuid) RETURNS boolean LANGUAGE sql STABLE AS $$ SELECT true $$;

-- Leitura (fora do escopo da 077): membro da empresa enxerga.
ALTER TABLE public.action_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.action_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contas_pagar ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.parcelas_pagar ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conta_attachments ENABLE ROW LEVEL SECURITY;
CREATE POLICY r ON public.action_plans FOR SELECT USING (EXISTS (SELECT 1 FROM public.tenant_members WHERE tenant_id = action_plans.tenant_id AND user_id = auth.uid()));
CREATE POLICY r ON public.action_items FOR SELECT USING (plan_id IN (SELECT id FROM public.action_plans));
CREATE POLICY r ON public.contas_pagar FOR SELECT USING (EXISTS (SELECT 1 FROM public.tenant_members WHERE tenant_id = contas_pagar.tenant_id AND user_id = auth.uid()));
CREATE POLICY r ON public.parcelas_pagar FOR SELECT USING (conta_id IN (SELECT id FROM public.contas_pagar));
CREATE POLICY r ON public.conta_attachments FOR SELECT USING (conta_id IN (SELECT id FROM public.contas_pagar));
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;

\i supabase/migrations/066_tenant_scoped_rls_functions.sql
\i supabase/migrations/076_tenant_role_requires_membership.sql
\i supabase/migrations/077_write_policies_require_permissions.sql

-- Usuários (todos membros de T, exceto 'outsider'):
--   v viewer | u user | o user com override plans.update=false | m manager
--   f papel customizado "financeiro" (finance.create + finance.update) | x admin global sem vínculo
INSERT INTO public.tenants VALUES ('10000000-0000-0000-0000-000000000001');
INSERT INTO public.roles VALUES ('financeiro', '{"finance.create": true, "finance.update": true, "finance.delete": false}');
INSERT INTO public.profiles (id, role, permissions) VALUES
  ('00000000-0000-0000-0000-00000000000a', 'viewer', NULL),
  ('00000000-0000-0000-0000-00000000000b', 'user', NULL),
  ('00000000-0000-0000-0000-00000000000c', 'user', '{"plans.update": false}'),
  ('00000000-0000-0000-0000-00000000000d', 'manager', NULL),
  ('00000000-0000-0000-0000-00000000000e', 'financeiro', NULL),
  ('00000000-0000-0000-0000-00000000000f', 'admin', NULL);
INSERT INTO public.tenant_members (tenant_id, user_id)
  SELECT '10000000-0000-0000-0000-000000000001', id FROM public.profiles WHERE role <> 'admin';

INSERT INTO public.action_plans (id, tenant_id, user_id) VALUES
  ('20000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-00000000000d'),
  ('20000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-00000000000c');
INSERT INTO public.action_items (plan_id) VALUES ('20000000-0000-0000-0000-000000000001'), ('20000000-0000-0000-0000-000000000002');
INSERT INTO public.contas_pagar (id, tenant_id) VALUES ('30000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001');
INSERT INTO public.parcelas_pagar (conta_id) VALUES ('30000000-0000-0000-0000-000000000001');

-- Executa como `authenticated` com o usuário dado; devolve linhas afetadas,
-- ou -1 se a policy recusou o INSERT.
CREATE FUNCTION pg_temp.run(who text, sql text) RETURNS int LANGUAGE plpgsql AS $$
DECLARE n int;
BEGIN
  PERFORM set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-00000000000' || who, true);
  SET LOCAL ROLE authenticated;
  BEGIN
    EXECUTE sql;
    GET DIAGNOSTICS n = ROW_COUNT;
  EXCEPTION WHEN insufficient_privilege THEN n := -1;
  END;
  RESET ROLE;
  RETURN n;
END $$;

CREATE FUNCTION pg_temp.expect(who text, sql text, want int, msg text) RETURNS void LANGUAGE plpgsql AS $$
DECLARE got int;
BEGIN
  -- Subtransação desfeita ao final: cada caso parte do mesmo estado.
  -- Variáveis plpgsql não são transacionais, então `got` sobrevive.
  BEGIN
    got := pg_temp.run(who, sql);
    RAISE EXCEPTION USING ERRCODE = 'PCRB0';
  EXCEPTION WHEN SQLSTATE 'PCRB0' THEN NULL;
  END;
  IF got IS DISTINCT FROM want THEN
    RAISE EXCEPTION 'FALHOU [%]: esperado %, obtido % — %', who, want, got, msg;
  END IF;
END $$;


-- ---------------------------------------------------------------- planos
SELECT pg_temp.expect('a', $q$INSERT INTO action_plans (tenant_id) VALUES ('10000000-0000-0000-0000-000000000001')$q$, -1, 'viewer não cria plano');
SELECT pg_temp.expect('a', $q$UPDATE action_plans SET title = 'x' WHERE id = '20000000-0000-0000-0000-000000000001'$q$, 0, 'viewer não edita plano');
SELECT pg_temp.expect('a', $q$INSERT INTO action_items (plan_id) VALUES ('20000000-0000-0000-0000-000000000001')$q$, -1, 'viewer não cria item');
SELECT pg_temp.expect('a', $q$UPDATE action_items SET status = 2$q$, 0, 'viewer não edita item');
SELECT pg_temp.expect('a', $q$DELETE FROM action_items$q$, 0, 'viewer não apaga item');

SELECT pg_temp.expect('b', $q$INSERT INTO action_plans (tenant_id) VALUES ('10000000-0000-0000-0000-000000000001')$q$, 1, 'user cria plano');
SELECT pg_temp.expect('b', $q$UPDATE action_plans SET title = 'x'$q$, 2, 'user edita planos');
SELECT pg_temp.expect('b', $q$DELETE FROM action_plans$q$, 0, 'user não apaga plano');
SELECT pg_temp.expect('b', $q$INSERT INTO action_items (plan_id) VALUES ('20000000-0000-0000-0000-000000000001')$q$, 1, 'user cria item');
SELECT pg_temp.expect('b', $q$DELETE FROM action_items$q$, 2, 'user (plans.update) apaga item');

SELECT pg_temp.expect('c', $q$UPDATE action_plans SET title = 'x'$q$, 1, 'override negando plans.update: só o próprio plano');
SELECT pg_temp.expect('c', $q$UPDATE action_items SET status = 2$q$, 1, 'override negando plans.update: só itens do próprio plano');

SELECT pg_temp.expect('d', $q$DELETE FROM action_plans$q$, 2, 'manager apaga planos');
SELECT pg_temp.expect('f', $q$UPDATE action_plans SET title = 'x'$q$, 0, 'admin global sem vínculo não edita');

-- ---------------------------------------------------------------- financeiro
SELECT pg_temp.expect('a', $q$UPDATE contas_pagar SET descricao = 'x'$q$, 0, 'viewer não edita conta');
SELECT pg_temp.expect('a', $q$UPDATE parcelas_pagar SET status = 'pago'$q$, 0, 'viewer não paga parcela');
SELECT pg_temp.expect('a', $q$DELETE FROM parcelas_pagar$q$, 0, 'viewer não apaga parcela');
SELECT pg_temp.expect('b', $q$INSERT INTO contas_pagar (tenant_id) VALUES ('10000000-0000-0000-0000-000000000001')$q$, -1, 'user não cria conta');
SELECT pg_temp.expect('b', $q$DELETE FROM parcelas_pagar$q$, 0, 'user não apaga parcela');
SELECT pg_temp.expect('b', $q$INSERT INTO conta_attachments (conta_id, uploaded_by) VALUES ('30000000-0000-0000-0000-000000000001', auth.uid())$q$, -1, 'user não anexa');

SELECT pg_temp.expect('e', $q$INSERT INTO contas_pagar (tenant_id) VALUES ('10000000-0000-0000-0000-000000000001')$q$, 1, 'financeiro cria conta');
SELECT pg_temp.expect('e', $q$INSERT INTO parcelas_pagar (conta_id) VALUES ('30000000-0000-0000-0000-000000000001')$q$, 1, 'financeiro cria parcela');
SELECT pg_temp.expect('e', $q$UPDATE parcelas_pagar SET status = 'pago'$q$, 1, 'financeiro paga parcela');
SELECT pg_temp.expect('e', $q$DELETE FROM parcelas_pagar$q$, 1, 'financeiro recria parcelas (update_conta_with_parcelas)');
SELECT pg_temp.expect('e', $q$INSERT INTO conta_attachments (conta_id, uploaded_by) VALUES ('30000000-0000-0000-0000-000000000001', auth.uid())$q$, 1, 'financeiro anexa');
SELECT pg_temp.expect('e', $q$DELETE FROM contas_pagar$q$, 0, 'financeiro sem finance.delete não apaga conta');

SELECT pg_temp.expect('d', $q$DELETE FROM contas_pagar$q$, 1, 'manager apaga conta (parcelas em cascata)');
SELECT pg_temp.expect('f', $q$UPDATE contas_pagar SET descricao = 'x'$q$, 0, 'admin global sem vínculo não edita conta');

\echo OK: 077 write policies
