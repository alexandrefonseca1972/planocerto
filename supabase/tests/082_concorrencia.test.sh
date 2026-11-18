#!/usr/bin/env bash
# Concorrência real do achado #5: pagamento em andamento x edição da conta.
# Sessão B paga a parcela e segura a transação; sessão A edita a conta no
# meio. Esperado: A espera o lock, vê o pagamento e recusa (23514); o
# pagamento sobrevive. Sem o FOR UPDATE da 082, A apagava a parcela paga.
# Uso (raiz do repo): bash supabase/tests/082_concorrencia.test.sh
set -euo pipefail
DB=pc_test_conc
dropdb --if-exists "$DB" 2>/dev/null; createdb "$DB"
trap 'dropdb --if-exists "$DB" >/dev/null 2>&1' EXIT
P="psql -X -q -v ON_ERROR_STOP=1 -d $DB"

$P -o /dev/null -f supabase/tests/_fixture_financeiro_planos.sql
$P -o /dev/null -c "
  INSERT INTO contas_pagar (id, tenant_id, valor_total) VALUES ('30000000-0000-0000-0000-000000000009', '10000000-0000-0000-0000-000000000001', 10);
  INSERT INTO parcelas_pagar (id, conta_id, numero, valor) VALUES ('40000000-0000-0000-0000-000000000009', '30000000-0000-0000-0000-000000000009', 1, 10);"

AS_FIN="SET ROLE authenticated; SET request.jwt.claim.sub = '00000000-0000-0000-0000-00000000000f';"

# B: paga e segura a transação por 2s.
$P -o /dev/null -c "$AS_FIN BEGIN;
  UPDATE parcelas_pagar SET status = 'pago', valor_pago = 10 WHERE id = '40000000-0000-0000-0000-000000000009' AND status = 'pendente';
  SELECT pg_sleep(2); COMMIT;" &
B=$!
sleep 0.5

# A: edita a conta enquanto B ainda não confirmou.
A_OUT=$($P -At -c "$AS_FIN SELECT update_conta_with_parcelas('30000000-0000-0000-0000-000000000009',
  '{\"valor_total\": 10, \"descricao\": \"editada\", \"parcelas\": [{\"numero\": 1, \"data_vencimento\": \"2027-01-01\", \"valor\": 10}]}')" 2>&1 || true)
wait $B

PAGO=$($P -At -c "SELECT count(*) FROM parcelas_pagar WHERE id = '40000000-0000-0000-0000-000000000009' AND status = 'pago'")
echo "A: ${A_OUT:-ok}"
if [[ "$PAGO" == "1" && "$A_OUT" == *"parcelas pagas"* ]]; then
  echo "OK: 082 concorrência (pagamento preservado, edição recusada)"
else
  echo "FALHOU: parcela paga preservada=$PAGO"; exit 1
fi
