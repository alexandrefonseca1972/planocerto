-- Teste de integração da migration 078 (#4) em banco descartável.
-- Rodar a partir da raiz do repositório:
--   createdb pc_test && psql -v ON_ERROR_STOP=1 -d pc_test -f supabase/tests/078_account_access.test.sql; dropdb pc_test

\set QUIET on
SET client_min_messages = error;

CREATE SCHEMA auth;
CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql STABLE AS
  $$ SELECT nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
GRANT USAGE ON SCHEMA auth TO anon, authenticated;
GRANT USAGE ON SCHEMA public TO anon, authenticated;

CREATE TABLE public.profiles (
  id uuid PRIMARY KEY, is_active boolean DEFAULT true,
  login_start_time time, login_end_time time, timezone text DEFAULT 'America/Sao_Paulo'
);

\i supabase/migrations/078_account_access_enforcement.sql

INSERT INTO public.profiles (id, is_active, login_start_time, login_end_time, timezone) VALUES
  ('00000000-0000-0000-0000-000000000001', true,  NULL,    NULL,    'America/Sao_Paulo'),
  ('00000000-0000-0000-0000-000000000002', false, NULL,    NULL,    'America/Sao_Paulo'),
  ('00000000-0000-0000-0000-000000000003', true,  '08:00', '18:00', 'America/Sao_Paulo'),
  ('00000000-0000-0000-0000-000000000004', true,  '08:00', '18:00', 'Mars/Base');

DO $$
DECLARE
  u1 uuid := '00000000-0000-0000-0000-000000000001';
  u2 uuid := '00000000-0000-0000-0000-000000000002';
  u3 uuid := '00000000-0000-0000-0000-000000000003';
  u4 uuid := '00000000-0000-0000-0000-000000000004';
  u9 uuid := '00000000-0000-0000-0000-000000000009';
BEGIN
  ASSERT public.account_access_status(u1) = 'ok', 'sem restrição';
  ASSERT public.account_access_status(u2) = 'inactive', 'desativada';
  ASSERT public.account_access_status(u9) = 'missing', 'sem perfil';
  ASSERT public.account_access_status(u3, '2026-11-17 12:00-03') = 'ok', 'meio da janela';
  ASSERT public.account_access_status(u3, '2026-11-17 08:00-03') = 'ok', 'início inclusivo';
  ASSERT public.account_access_status(u3, '2026-11-17 18:00:59-03') = 'ok', 'fim inclusivo no minuto';
  ASSERT public.account_access_status(u3, '2026-11-17 18:01-03') = 'outside_hours', 'depois da janela';
  ASSERT public.account_access_status(u3, '2026-11-17 07:59-03') = 'outside_hours', 'antes da janela';
  ASSERT public.account_access_status(u3, '2026-11-17 12:00+00') = 'ok', '09:00 em SP';
  ASSERT public.account_access_status(u3, '2026-11-17 23:00+00') = 'outside_hours', '20:00 em SP';
  ASSERT public.account_access_status(u4, '2026-11-17 12:00-03') = 'ok', 'fuso inválido cai em SP';
  ASSERT public.account_access_status(u4, '2026-11-17 20:00-03') = 'outside_hours', 'fuso inválido cai em SP (fora)';
END $$;

-- pre-request: barra autenticado bloqueado, libera anon e conta ok.
CREATE FUNCTION pg_temp.pre_request_as(who text) RETURNS text LANGUAGE plpgsql AS $$
BEGIN
  PERFORM set_config('request.jwt.claim.sub', who, true);
  SET LOCAL ROLE authenticated;
  BEGIN
    PERFORM public.check_request_account();
  EXCEPTION WHEN insufficient_privilege THEN
    RESET ROLE;
    RETURN 'blocked';
  END;
  RESET ROLE;
  RETURN 'ok';
END $$;

DO $$ BEGIN
  ASSERT pg_temp.pre_request_as('') = 'ok', 'anon passa';
  ASSERT pg_temp.pre_request_as('00000000-0000-0000-0000-000000000001') = 'ok', 'conta ok passa';
  ASSERT pg_temp.pre_request_as('00000000-0000-0000-0000-000000000002') = 'blocked', 'desativada é barrada';
  ASSERT pg_temp.pre_request_as('00000000-0000-0000-0000-000000000009') = 'blocked', 'sem perfil é barrada';
END $$;

-- authenticated não consulta status de outras contas.
SET ROLE authenticated;
DO $$ BEGIN
  PERFORM public.account_access_status('00000000-0000-0000-0000-000000000002');
  RAISE EXCEPTION 'authenticated não deveria executar account_access_status';
EXCEPTION WHEN insufficient_privilege THEN NULL;
END $$;
RESET ROLE;

\echo OK: 078 account access
