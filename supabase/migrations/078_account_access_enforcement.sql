-- Achado #4 (ACHADOS-AUDITORIA.md): conta desativada e janela de horário só
-- eram verificadas pelo proxy nas páginas protegidas. APIs, Server Actions
-- postadas em outras rotas e chamadas diretas ao PostgREST passavam.
--
-- 1) account_access_status(): regra única ('ok' | 'inactive' |
--    'outside_hours' | 'missing'), usada pelo app (via service_role) e pelo
--    banco. A janela é inclusiva por minuto, no fuso do perfil, igual ao
--    proxy antigo; fuso inválido cai em America/Sao_Paulo.
-- 2) check_request_account(): pre-request do PostgREST. Roda antes de cada
--    requisição; recusa com 403 se a conta autenticada não está liberada.
--    service_role e anon não têm auth.uid() e passam.
--
-- Pós-deploy: confirmar que o PostgREST da VPS aceita configuração no banco
-- (db-config, padrão true) e que nenhuma variável PGRST_DB_PRE_REQUEST
-- sobrescreve esta. Teste: com uma conta desativada,
--   curl -H "apikey: $ANON" -H "Authorization: Bearer $JWT" https://<host>/rest/v1/profiles
-- deve responder 403.

CREATE OR REPLACE FUNCTION public.account_access_status(p_user_id uuid, p_now timestamptz DEFAULT now())
RETURNS text
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  p public.profiles%ROWTYPE;
  v_local time;
  v_min int;
BEGIN
  SELECT * INTO p FROM public.profiles WHERE id = p_user_id;
  IF NOT FOUND THEN RETURN 'missing'; END IF;
  IF p.is_active IS FALSE THEN RETURN 'inactive'; END IF;
  IF p.login_start_time IS NULL OR p.login_end_time IS NULL THEN RETURN 'ok'; END IF;

  BEGIN
    v_local := (p_now AT TIME ZONE COALESCE(NULLIF(p.timezone, ''), 'America/Sao_Paulo'))::time;
  EXCEPTION WHEN invalid_parameter_value THEN
    v_local := (p_now AT TIME ZONE 'America/Sao_Paulo')::time;
  END;

  v_min := extract(hour FROM v_local)::int * 60 + extract(minute FROM v_local)::int;
  IF v_min < extract(hour FROM p.login_start_time)::int * 60 + extract(minute FROM p.login_start_time)::int
     OR v_min > extract(hour FROM p.login_end_time)::int * 60 + extract(minute FROM p.login_end_time)::int THEN
    RETURN 'outside_hours';
  END IF;
  RETURN 'ok';
END;
$$;

-- Revela estado de outras contas: só o servidor (service_role) chama direto.
REVOKE ALL ON FUNCTION public.account_access_status(uuid, timestamptz) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.account_access_status(uuid, timestamptz) TO service_role;

CREATE OR REPLACE FUNCTION public.check_request_account()
RETURNS void
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_status text;
BEGIN
  IF auth.uid() IS NULL THEN RETURN; END IF;
  v_status := public.account_access_status(auth.uid());
  IF v_status <> 'ok' THEN
    RAISE EXCEPTION 'Acesso bloqueado: %', v_status
      USING ERRCODE = '42501', HINT = 'Conta desativada ou fora do horário de acesso.';
  END IF;
END;
$$;

GRANT EXECUTE ON FUNCTION public.check_request_account() TO anon, authenticated, service_role;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticator') THEN
    ALTER ROLE authenticator SET pgrst.db_pre_request = 'public.check_request_account';
    NOTIFY pgrst, 'reload config';
  ELSE
    RAISE WARNING 'Papel authenticator ausente: configure db-pre-request = public.check_request_account no PostgREST.';
  END IF;
END $$;
