-- 086b: agrega o resumo financeiro no SQL (antes: busca todas as contas +
-- parcelas e soma em JS) e reduz o custo da RLS de leitura (auth.uid()
-- avaliado uma vez por consulta, pertencimento por conjunto).
-- Semântica idêntica a getResumoContas (src/app/actions/contas-pagar.ts).

-- ---------------------------------------------------------------------------
-- RLS de leitura: mesma regra de 068 (admin do tenant OU membro do tenant).
-- is_admin_for_tenant continua por linha (depende do tenant da linha); o
-- ramo "membro" vira predicado por conjunto com (select auth.uid()).
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "contas_pagar read" ON public.contas_pagar;
CREATE POLICY "contas_pagar read" ON public.contas_pagar FOR SELECT
  USING (
    contas_pagar.tenant_id IN (
      SELECT tm.tenant_id FROM public.tenant_members tm
      WHERE tm.user_id = (SELECT auth.uid())
    )
    OR public.is_admin_for_tenant(contas_pagar.tenant_id)
  );

DROP POLICY IF EXISTS "parcelas read" ON public.parcelas_pagar;
CREATE POLICY "parcelas read" ON public.parcelas_pagar FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.contas_pagar c
      WHERE c.id = parcelas_pagar.conta_id
        AND (
          c.tenant_id IN (
            SELECT tm.tenant_id FROM public.tenant_members tm
            WHERE tm.user_id = (SELECT auth.uid())
          )
          OR public.is_admin_for_tenant(c.tenant_id)
        )
    )
  );

-- ---------------------------------------------------------------------------
-- resumo_contas: SECURITY INVOKER (RLS do chamador vale).
-- p_from/p_to nulos = sem range. "hoje" em UTC, como o JS (toISOString).
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.resumo_contas(
  p_tenant uuid,
  p_from date,
  p_to date,
  p_fornecedor uuid,
  p_ano int
) RETURNS json
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  WITH p AS (
    SELECT (now() AT TIME ZONE 'utc')::date AS hoje,
           ((now() AT TIME ZONE 'utc')::date + 7) AS lim7
  ),
  c AS (
    SELECT c.id, c.descricao, c.status, c.fornecedor_id,
           COALESCE(f.name, 'Sem fornecedor') AS fnome
    FROM public.contas_pagar c
    LEFT JOIN public.fornecedores f ON f.id = c.fornecedor_id
    WHERE c.tenant_id = p_tenant
      AND (p_fornecedor IS NULL OR c.fornecedor_id = p_fornecedor)
  ),
  pa AS (
    SELECT c.id AS conta_id, c.descricao, c.status AS cstatus, c.fornecedor_id, c.fnome,
           x.id, x.data_vencimento, x.valor, x.status, x.data_pagamento,
           COALESCE(x.valor_pago, x.valor) AS vpago
    FROM c JOIN public.parcelas_pagar x ON x.conta_id = c.id
  ),
  aberta AS (
    SELECT * FROM pa WHERE status = 'pendente' AND cstatus <> 'cancelado'
  ),
  paga AS (
    SELECT * FROM pa WHERE status = 'pago' AND data_pagamento IS NOT NULL
  ),
  forn AS (
    SELECT fornecedor_id, min(fnome) AS nome,
           COALESCE(sum(vpago) FILTER (WHERE k = 'p'), 0) AS tp,
           COALESCE(sum(valor) FILTER (WHERE k = 'a'), 0) AS ta
    FROM (
      SELECT fornecedor_id, fnome, valor, vpago, 'a' AS k FROM aberta
      UNION ALL
      SELECT fornecedor_id, fnome, valor, vpago, 'p' FROM paga
    ) u
    GROUP BY fornecedor_id
  )
  SELECT json_build_object(
    'total_em_aberto', (SELECT COALESCE(sum(valor), 0) FROM aberta),
    'total_atrasado', (SELECT COALESCE(sum(valor), 0) FROM aberta, p WHERE data_vencimento < p.hoje),
    'total_pago_periodo', (SELECT COALESCE(sum(vpago), 0) FROM paga
        WHERE p_from IS NULL OR p_to IS NULL OR (data_pagamento >= p_from AND data_pagamento <= p_to)),
    'contas_quantidade', (SELECT count(*) FROM c WHERE status <> 'cancelado'),
    'proximas_7d', (SELECT COALESCE(json_agg(json_build_object(
          'parcela_id', id, 'conta_id', conta_id, 'descricao', descricao,
          'vencimento', data_vencimento, 'valor', valor) ORDER BY data_vencimento, id), '[]'::json)
        FROM (SELECT * FROM aberta, p WHERE data_vencimento >= p.hoje AND data_vencimento <= p.lim7
              ORDER BY data_vencimento, id LIMIT 20) t),
    'vencimentos_mes', (SELECT COALESCE(json_agg(json_build_object(
          'parcela_id', id, 'conta_id', conta_id, 'descricao', descricao,
          'vencimento', data_vencimento, 'valor', valor,
          'atrasada', data_vencimento < p.hoje) ORDER BY data_vencimento, id), '[]'::json)
        FROM aberta, p WHERE p_from IS NOT NULL AND p_to IS NOT NULL
          AND data_vencimento >= p_from AND data_vencimento <= p_to),
    'por_fornecedor', (SELECT COALESCE(json_agg(json_build_object(
          'fornecedor_id', fornecedor_id, 'fornecedor_nome', nome,
          'total_pago', tp, 'total_aberto', ta) ORDER BY (tp + ta) DESC, nome, fornecedor_id), '[]'::json)
        FROM forn WHERE tp > 0 OR ta > 0),
    'por_status', (SELECT COALESCE(json_agg(json_build_object(
          'status', status, 'quantidade', qtd, 'valor_total', vt) ORDER BY status), '[]'::json)
        FROM (SELECT c.status, count(*) AS qtd, COALESCE(sum(t.v), 0) AS vt
              FROM c
              LEFT JOIN (SELECT conta_id, sum(valor) AS v FROM pa GROUP BY conta_id) t ON t.conta_id = c.id
              WHERE c.status <> 'cancelado' GROUP BY c.status) s),
    'por_mes', (SELECT json_agg(json_build_object(
          'mes', to_char(m, 'YYYY-MM'),
          'total_pago', COALESCE((SELECT sum(vpago) FROM paga WHERE date_trunc('month', data_pagamento)::date = m), 0),
          'total_aberto', COALESCE((SELECT sum(valor) FROM aberta WHERE date_trunc('month', data_vencimento)::date = m), 0)
        ) ORDER BY m)
        FROM (SELECT d::date AS m FROM generate_series(make_date(p_ano, 1, 1), make_date(p_ano, 12, 1), interval '1 month') d) g)
  );
$$;

GRANT EXECUTE ON FUNCTION public.resumo_contas(uuid, date, date, uuid, int) TO authenticated;
