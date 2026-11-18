-- Achados #5 e #6 (ACHADOS-AUDITORIA.md): integridade do financeiro.
--
-- #5 update_conta_with_parcelas checava "tem parcela paga?" e depois apagava
--    e recriava as parcelas, sem bloqueio: um pagamento confirmado no meio
--    era apagado. Agora trava a conta e as parcelas (FOR UPDATE) antes da
--    checagem. Pagamento concorrente espera e, como o app só paga parcela
--    'pendente' (UPDATE ... AND status = 'pendente'), não sobrescreve nada.
--    A exclusão tinha a mesma janela (checagem no app, DELETE depois):
--    excluir_conta() faz tudo com bloqueio.
-- #6 cancelarConta cancelava parcelas e conta em duas chamadas. Agora
--    cancelar_conta() faz as duas numa transação.

CREATE OR REPLACE FUNCTION public.update_conta_with_parcelas(
  conta_id_in UUID,
  payload JSONB
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = 'public'
AS $$
DECLARE
  parcela JSONB;
  soma_parcelas NUMERIC(14,2);
  total NUMERIC(14,2);
  tem_paga BOOLEAN;
BEGIN
  total := (payload->>'valor_total')::NUMERIC(14,2);

  -- Bloqueia conta e parcelas até o fim da transação (#5).
  PERFORM 1 FROM public.contas_pagar WHERE id = conta_id_in FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Conta % não encontrada ou sem permissão', conta_id_in
      USING ERRCODE = 'P0002';
  END IF;
  PERFORM 1 FROM public.parcelas_pagar WHERE conta_id = conta_id_in FOR UPDATE;

  SELECT EXISTS (
    SELECT 1 FROM public.parcelas_pagar
    WHERE conta_id = conta_id_in AND status = 'pago'
  ) INTO tem_paga;
  IF tem_paga THEN
    RAISE EXCEPTION 'Conta possui parcelas pagas; estorne antes de editar'
      USING ERRCODE = '23514';
  END IF;

  SELECT COALESCE(SUM((p->>'valor')::NUMERIC(14,2)), 0)
  INTO soma_parcelas
  FROM jsonb_array_elements(payload->'parcelas') AS p;

  IF ABS(soma_parcelas - total) > 0.01 THEN
    RAISE EXCEPTION 'Soma das parcelas (%) difere do valor total (%)', soma_parcelas, total
      USING ERRCODE = '23514';
  END IF;

  UPDATE public.contas_pagar SET
    plan_id      = NULLIF(payload->>'plan_id', '')::UUID,
    item_id      = NULLIF(payload->>'item_id', '')::UUID,
    fornecedor_id= NULLIF(payload->>'fornecedor_id', '')::UUID,
    categoria_id = NULLIF(payload->>'categoria_id', '')::UUID,
    descricao    = payload->>'descricao',
    documento    = COALESCE(payload->>'documento', ''),
    emissao      = NULLIF(payload->>'emissao', '')::DATE,
    valor_total  = total,
    observacoes  = COALESCE(payload->>'observacoes', '')
  WHERE id = conta_id_in;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Conta % não encontrada ou sem permissão', conta_id_in
      USING ERRCODE = 'P0002';
  END IF;

  DELETE FROM public.parcelas_pagar WHERE conta_id = conta_id_in;

  FOR parcela IN SELECT * FROM jsonb_array_elements(payload->'parcelas')
  LOOP
    INSERT INTO public.parcelas_pagar (conta_id, numero, data_vencimento, valor)
    VALUES (
      conta_id_in,
      (parcela->>'numero')::INT,
      (parcela->>'data_vencimento')::DATE,
      (parcela->>'valor')::NUMERIC(14,2)
    );
  END LOOP;

  RETURN conta_id_in;
END;
$$;

-- Cancelamento atômico (#6). INVOKER: a RLS exige finance.update (077).
CREATE OR REPLACE FUNCTION public.cancelar_conta(p_conta_id uuid, p_motivo text DEFAULT '')
RETURNS void
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
BEGIN
  PERFORM 1 FROM public.contas_pagar WHERE id = p_conta_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Conta % não encontrada ou sem permissão', p_conta_id USING ERRCODE = 'P0002';
  END IF;

  UPDATE public.parcelas_pagar SET status = 'cancelado'
  WHERE conta_id = p_conta_id AND status = 'pendente';

  UPDATE public.contas_pagar SET
    status = 'cancelado',
    observacoes = CASE
      WHEN COALESCE(btrim(p_motivo), '') = '' THEN observacoes
      ELSE btrim(COALESCE(observacoes, '') || E'\n[Cancelada] ' || btrim(p_motivo))
    END
  WHERE id = p_conta_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Sem permissão para cancelar a conta %', p_conta_id USING ERRCODE = '42501';
  END IF;
END;
$$;

-- Exclusão sem janela entre checar e apagar (#5). DEFINER para travar as
-- parcelas mesmo sem finance.update; a permissão é conferida aqui dentro.
CREATE OR REPLACE FUNCTION public.excluir_conta(p_conta_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_tenant uuid;
BEGIN
  SELECT tenant_id INTO v_tenant FROM public.contas_pagar WHERE id = p_conta_id FOR UPDATE;
  IF v_tenant IS NULL OR NOT public.has_perm_for_tenant('finance.delete', v_tenant) THEN
    RAISE EXCEPTION 'Conta % não encontrada ou sem permissão', p_conta_id USING ERRCODE = '42501';
  END IF;

  PERFORM 1 FROM public.parcelas_pagar WHERE conta_id = p_conta_id FOR UPDATE;
  IF EXISTS (SELECT 1 FROM public.parcelas_pagar WHERE conta_id = p_conta_id AND status = 'pago') THEN
    RAISE EXCEPTION 'Conta possui parcelas pagas; cancele para preservar o histórico'
      USING ERRCODE = '23514';
  END IF;

  DELETE FROM public.contas_pagar WHERE id = p_conta_id;
END;
$$;

REVOKE ALL ON FUNCTION public.cancelar_conta(uuid, text) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.excluir_conta(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.cancelar_conta(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.excluir_conta(uuid) TO authenticated;
