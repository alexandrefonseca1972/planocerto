-- Testes das migrations 082 (financeiro) e 083 (visibilidade restrita).
-- Rodar a partir da raiz do repositório:
--   createdb pc_test && psql -v ON_ERROR_STOP=1 -d pc_test -f supabase/tests/082_083_financeiro_visibilidade.test.sql; dropdb pc_test

\i supabase/tests/_fixture_financeiro_planos.sql

INSERT INTO public.contas_pagar (id, tenant_id, observacoes) VALUES
  ('30000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'obs'),
  ('30000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000001', ''),
  ('30000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000001', '');
INSERT INTO public.parcelas_pagar (conta_id, numero, status) VALUES
  ('30000000-0000-0000-0000-000000000001', 1, 'pago'),
  ('30000000-0000-0000-0000-000000000001', 2, 'pendente'),
  ('30000000-0000-0000-0000-000000000002', 1, 'pago'),
  ('30000000-0000-0000-0000-000000000003', 1, 'pendente');
INSERT INTO public.action_plans (id, tenant_id, user_id, visibility) VALUES
  ('20000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-00000000000a', 'restricted'),
  ('20000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-00000000000a', 'public');
INSERT INTO public.action_items (plan_id) VALUES ('20000000-0000-0000-0000-000000000001'), ('20000000-0000-0000-0000-000000000002');

-- Executa como `authenticated`; devolve 'ok' ou o SQLSTATE do erro.
CREATE FUNCTION pg_temp.as_user(who text, sql text) RETURNS text LANGUAGE plpgsql AS $$
DECLARE r text := 'ok';
BEGIN
  PERFORM set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-00000000000' || who, true);
  SET LOCAL ROLE authenticated;
  BEGIN EXECUTE sql; EXCEPTION WHEN OTHERS THEN r := SQLSTATE; END;
  RESET ROLE;
  RETURN r;
END $$;
CREATE FUNCTION pg_temp.count_as(who text, sql text) RETURNS int LANGUAGE plpgsql AS $$
DECLARE n int;
BEGIN
  PERFORM set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-00000000000' || who, true);
  SET LOCAL ROLE authenticated;
  EXECUTE 'SELECT count(*) FROM (' || sql || ') s' INTO n;
  RESET ROLE;
  RETURN n;
END $$;

BEGIN;
DO $$ BEGIN
  -- #6 cancelamento atômico: parcela pendente e conta cancelam juntas; paga fica.
  ASSERT pg_temp.as_user('f', $q$SELECT cancelar_conta('30000000-0000-0000-0000-000000000001', 'motivo x')$q$) = 'ok', '#6 financeiro cancela';
  ASSERT (SELECT status FROM contas_pagar WHERE id = '30000000-0000-0000-0000-000000000001') = 'cancelado', '#6 conta cancelada';
  ASSERT (SELECT observacoes FROM contas_pagar WHERE id = '30000000-0000-0000-0000-000000000001') = E'obs\n[Cancelada] motivo x', '#6 motivo';
  ASSERT (SELECT string_agg(status, ',' ORDER BY numero) FROM parcelas_pagar WHERE conta_id = '30000000-0000-0000-0000-000000000001') = 'pago,cancelado', '#6 parcelas';
  ASSERT pg_temp.as_user('a', $q$SELECT cancelar_conta('30000000-0000-0000-0000-000000000003', '')$q$) = 'P0002', '#6 user sem finance.update não cancela';
  ASSERT (SELECT status FROM parcelas_pagar WHERE conta_id = '30000000-0000-0000-0000-000000000003') = 'pendente', '#6 nada mudou';

  -- #5 exclusão: só com finance.delete e sem parcela paga.
  ASSERT pg_temp.as_user('f', $q$SELECT excluir_conta('30000000-0000-0000-0000-000000000003')$q$) = '42501', '#5 sem finance.delete';
  ASSERT pg_temp.as_user('d', $q$SELECT excluir_conta('30000000-0000-0000-0000-000000000002')$q$) = '23514', '#5 conta com parcela paga';
  ASSERT pg_temp.as_user('d', $q$SELECT excluir_conta('30000000-0000-0000-0000-000000000003')$q$) = 'ok', '#5 diretor exclui conta sem pagamento';
  ASSERT NOT EXISTS (SELECT 1 FROM contas_pagar WHERE id = '30000000-0000-0000-0000-000000000003'), '#5 conta removida';

  -- #5 edição recusa conta com parcela paga.
  ASSERT pg_temp.as_user('f', $q$SELECT update_conta_with_parcelas('30000000-0000-0000-0000-000000000002',
    '{"valor_total": 10, "descricao": "x", "parcelas": [{"numero": 1, "data_vencimento": "2027-01-01", "valor": 10}]}')$q$) = '23514', '#5 edição com paga';

  -- #11 visibilidade restrita.
  ASSERT pg_temp.count_as('a', 'SELECT 1 FROM action_plans') = 2, '#11 criador vê o restrito';
  ASSERT pg_temp.count_as('b', 'SELECT 1 FROM action_plans') = 1, '#11 outro membro não vê o restrito';
  ASSERT pg_temp.count_as('b', 'SELECT 1 FROM action_items') = 1, '#11 itens do restrito somem junto';
  ASSERT pg_temp.count_as('e', 'SELECT 1 FROM action_plans') = 2, '#11 manager vê o restrito';
  ASSERT pg_temp.as_user('b', $q$UPDATE action_plans SET title = 'x' WHERE id = '20000000-0000-0000-0000-000000000001'$q$) = 'ok', '#11 update invisível não erra';
END $$;
ROLLBACK;

DO $$ BEGIN
  ASSERT (SELECT title FROM action_plans WHERE id = '20000000-0000-0000-0000-000000000001') = '', '#11 membro não editou plano restrito';
END $$;

\echo OK: 082/083 financeiro e visibilidade
