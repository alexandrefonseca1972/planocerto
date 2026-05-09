-- Módulo Contas a Pagar.
--
-- Introduz três tabelas operacionais (contas_pagar, parcelas_pagar,
-- conta_attachments) e um catálogo (categorias_despesa). Mantém o padrão
-- de multi-tenancy via RLS por membership e o padrão de catálogo já usado
-- em fornecedores: registros globais (tenant_id NULL) ou por tenant.
--
-- Vínculo opcional com action_plans/action_items via FK NULLABLE: contas
-- podem nascer "soltas" (despesas operacionais) ou geradas a partir de um
-- item de plano. Os campos cost/preco do item permanecem como estimativa
-- declarada; a execução vive aqui.

-- =========================================================================
-- 1. CATÁLOGO: categorias_despesa
-- =========================================================================

CREATE TABLE IF NOT EXISTS public.categorias_despesa (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  sort_order  INT NOT NULL DEFAULT 0,
  active      BOOLEAN NOT NULL DEFAULT true,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT categorias_despesa_name_tenant_unique UNIQUE (tenant_id, name)
);

CREATE INDEX IF NOT EXISTS idx_categorias_despesa_tenant
  ON public.categorias_despesa(tenant_id);
CREATE INDEX IF NOT EXISTS idx_categorias_despesa_active
  ON public.categorias_despesa(active) WHERE active = true;

ALTER TABLE public.categorias_despesa ENABLE ROW LEVEL SECURITY;

CREATE POLICY "categorias_despesa read tenant" ON public.categorias_despesa FOR SELECT
  USING (
    tenant_id IS NULL
    OR public.is_admin()
    OR EXISTS (
      SELECT 1 FROM public.tenant_members
      WHERE tenant_id = categorias_despesa.tenant_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "categorias_despesa write admin" ON public.categorias_despesa FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- =========================================================================
-- 2. CONTAS A PAGAR (cabeçalho)
-- =========================================================================

CREATE TABLE IF NOT EXISTS public.contas_pagar (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  plan_id         UUID REFERENCES public.action_plans(id) ON DELETE SET NULL,
  item_id         UUID REFERENCES public.action_items(id) ON DELETE SET NULL,
  fornecedor_id   UUID REFERENCES public.fornecedores(id) ON DELETE SET NULL,
  categoria_id    UUID REFERENCES public.categorias_despesa(id) ON DELETE SET NULL,
  descricao       TEXT NOT NULL,
  documento       TEXT NOT NULL DEFAULT '',
  emissao         DATE,
  valor_total     NUMERIC(14,2) NOT NULL CHECK (valor_total > 0),
  status          TEXT NOT NULL DEFAULT 'pendente'
                  CHECK (status IN ('pendente','parcial','quitado','cancelado')),
  observacoes     TEXT NOT NULL DEFAULT '',
  created_by      UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_contas_pagar_tenant       ON public.contas_pagar(tenant_id);
CREATE INDEX IF NOT EXISTS idx_contas_pagar_plan         ON public.contas_pagar(plan_id);
CREATE INDEX IF NOT EXISTS idx_contas_pagar_item         ON public.contas_pagar(item_id);
CREATE INDEX IF NOT EXISTS idx_contas_pagar_fornecedor   ON public.contas_pagar(fornecedor_id);
CREATE INDEX IF NOT EXISTS idx_contas_pagar_status       ON public.contas_pagar(tenant_id, status);

ALTER TABLE public.contas_pagar ENABLE ROW LEVEL SECURITY;

CREATE POLICY "contas_pagar read" ON public.contas_pagar FOR SELECT
  USING (
    public.is_admin()
    OR EXISTS (
      SELECT 1 FROM public.tenant_members
      WHERE tenant_id = contas_pagar.tenant_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "contas_pagar insert" ON public.contas_pagar FOR INSERT
  WITH CHECK (
    public.is_admin()
    OR EXISTS (
      SELECT 1 FROM public.tenant_members
      WHERE tenant_id = contas_pagar.tenant_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "contas_pagar update" ON public.contas_pagar FOR UPDATE
  USING (
    public.is_admin()
    OR EXISTS (
      SELECT 1 FROM public.tenant_members
      WHERE tenant_id = contas_pagar.tenant_id AND user_id = auth.uid()
    )
  )
  WITH CHECK (
    public.is_admin()
    OR EXISTS (
      SELECT 1 FROM public.tenant_members
      WHERE tenant_id = contas_pagar.tenant_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "contas_pagar delete" ON public.contas_pagar FOR DELETE
  USING (
    public.is_admin()
    OR EXISTS (
      SELECT 1 FROM public.tenant_members
      WHERE tenant_id = contas_pagar.tenant_id
        AND user_id = auth.uid()
        AND role IN ('owner','admin')
    )
  );

-- =========================================================================
-- 3. PARCELAS
-- =========================================================================

CREATE TABLE IF NOT EXISTS public.parcelas_pagar (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conta_id        UUID NOT NULL REFERENCES public.contas_pagar(id) ON DELETE CASCADE,
  numero          INT NOT NULL CHECK (numero >= 1),
  data_vencimento DATE NOT NULL,
  valor           NUMERIC(14,2) NOT NULL CHECK (valor > 0),
  data_pagamento  DATE,
  valor_pago      NUMERIC(14,2),
  forma_pagamento TEXT NOT NULL DEFAULT '',
  status          TEXT NOT NULL DEFAULT 'pendente'
                  CHECK (status IN ('pendente','pago','cancelado')),
  observacoes     TEXT NOT NULL DEFAULT '',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT parcelas_pagar_conta_numero_unique UNIQUE (conta_id, numero)
);

CREATE INDEX IF NOT EXISTS idx_parcelas_conta
  ON public.parcelas_pagar(conta_id);
CREATE INDEX IF NOT EXISTS idx_parcelas_status_venc
  ON public.parcelas_pagar(status, data_vencimento);
CREATE INDEX IF NOT EXISTS idx_parcelas_pagamento
  ON public.parcelas_pagar(data_pagamento);

ALTER TABLE public.parcelas_pagar ENABLE ROW LEVEL SECURITY;

CREATE POLICY "parcelas read" ON public.parcelas_pagar FOR SELECT
  USING (
    public.is_admin()
    OR EXISTS (
      SELECT 1
      FROM public.contas_pagar c
      JOIN public.tenant_members tm ON tm.tenant_id = c.tenant_id
      WHERE c.id = parcelas_pagar.conta_id AND tm.user_id = auth.uid()
    )
  );

CREATE POLICY "parcelas insert" ON public.parcelas_pagar FOR INSERT
  WITH CHECK (
    public.is_admin()
    OR EXISTS (
      SELECT 1
      FROM public.contas_pagar c
      JOIN public.tenant_members tm ON tm.tenant_id = c.tenant_id
      WHERE c.id = parcelas_pagar.conta_id AND tm.user_id = auth.uid()
    )
  );

CREATE POLICY "parcelas update" ON public.parcelas_pagar FOR UPDATE
  USING (
    public.is_admin()
    OR EXISTS (
      SELECT 1
      FROM public.contas_pagar c
      JOIN public.tenant_members tm ON tm.tenant_id = c.tenant_id
      WHERE c.id = parcelas_pagar.conta_id AND tm.user_id = auth.uid()
    )
  )
  WITH CHECK (
    public.is_admin()
    OR EXISTS (
      SELECT 1
      FROM public.contas_pagar c
      JOIN public.tenant_members tm ON tm.tenant_id = c.tenant_id
      WHERE c.id = parcelas_pagar.conta_id AND tm.user_id = auth.uid()
    )
  );

CREATE POLICY "parcelas delete" ON public.parcelas_pagar FOR DELETE
  USING (
    public.is_admin()
    OR EXISTS (
      SELECT 1
      FROM public.contas_pagar c
      JOIN public.tenant_members tm ON tm.tenant_id = c.tenant_id
      WHERE c.id = parcelas_pagar.conta_id AND tm.user_id = auth.uid()
    )
  );

-- =========================================================================
-- 4. ANEXOS
-- =========================================================================

CREATE TABLE IF NOT EXISTS public.conta_attachments (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conta_id        UUID NOT NULL REFERENCES public.contas_pagar(id) ON DELETE CASCADE,
  filename        TEXT NOT NULL,
  storage_path    TEXT NOT NULL,
  size            INTEGER NOT NULL,
  mime_type       TEXT NOT NULL,
  uploaded_by     UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_conta_attachments_conta
  ON public.conta_attachments(conta_id);

ALTER TABLE public.conta_attachments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "conta_attachments read" ON public.conta_attachments FOR SELECT
  USING (
    public.is_admin()
    OR EXISTS (
      SELECT 1
      FROM public.contas_pagar c
      JOIN public.tenant_members tm ON tm.tenant_id = c.tenant_id
      WHERE c.id = conta_attachments.conta_id AND tm.user_id = auth.uid()
    )
  );

CREATE POLICY "conta_attachments insert" ON public.conta_attachments FOR INSERT
  WITH CHECK (
    auth.uid() = uploaded_by
    AND EXISTS (
      SELECT 1
      FROM public.contas_pagar c
      JOIN public.tenant_members tm ON tm.tenant_id = c.tenant_id
      WHERE c.id = conta_attachments.conta_id AND tm.user_id = auth.uid()
    )
  );

CREATE POLICY "conta_attachments delete" ON public.conta_attachments FOR DELETE
  USING (
    uploaded_by = auth.uid()
    OR public.is_admin()
  );

-- =========================================================================
-- 5. TRIGGERS
-- =========================================================================

-- Função genérica de updated_at (idempotente: criar OR REPLACE).
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_categorias_despesa_updated_at ON public.categorias_despesa;
CREATE TRIGGER trg_categorias_despesa_updated_at
  BEFORE UPDATE ON public.categorias_despesa
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_contas_pagar_updated_at ON public.contas_pagar;
CREATE TRIGGER trg_contas_pagar_updated_at
  BEFORE UPDATE ON public.contas_pagar
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_parcelas_pagar_updated_at ON public.parcelas_pagar;
CREATE TRIGGER trg_parcelas_pagar_updated_at
  BEFORE UPDATE ON public.parcelas_pagar
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Recalcula o status do cabeçalho a partir do agregado das parcelas.
-- Cancelamento manual da conta é preservado (a função respeita 'cancelado').
CREATE OR REPLACE FUNCTION public.recompute_conta_status()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  target_conta_id UUID;
  total_parcelas  INT;
  pagas           INT;
  pendentes       INT;
  current_status  TEXT;
  novo_status     TEXT;
BEGIN
  IF TG_OP = 'DELETE' THEN
    target_conta_id := OLD.conta_id;
  ELSE
    target_conta_id := NEW.conta_id;
  END IF;

  SELECT status INTO current_status FROM public.contas_pagar WHERE id = target_conta_id;
  IF current_status = 'cancelado' THEN
    RETURN COALESCE(NEW, OLD);
  END IF;

  SELECT
    COUNT(*),
    COUNT(*) FILTER (WHERE status = 'pago'),
    COUNT(*) FILTER (WHERE status = 'pendente')
  INTO total_parcelas, pagas, pendentes
  FROM public.parcelas_pagar
  WHERE conta_id = target_conta_id;

  IF total_parcelas = 0 THEN
    novo_status := current_status;
  ELSIF pagas = total_parcelas THEN
    novo_status := 'quitado';
  ELSIF pagas > 0 THEN
    novo_status := 'parcial';
  ELSE
    novo_status := 'pendente';
  END IF;

  IF novo_status IS DISTINCT FROM current_status THEN
    UPDATE public.contas_pagar
    SET status = novo_status, updated_at = now()
    WHERE id = target_conta_id;
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$;

DROP TRIGGER IF EXISTS trg_parcelas_recompute_status ON public.parcelas_pagar;
CREATE TRIGGER trg_parcelas_recompute_status
  AFTER INSERT OR UPDATE OR DELETE ON public.parcelas_pagar
  FOR EACH ROW EXECUTE FUNCTION public.recompute_conta_status();

-- =========================================================================
-- 6. RPC: criação atômica de conta + parcelas
-- =========================================================================

-- Recebe um payload JSON com cabeçalho e array de parcelas. Valida soma,
-- insere na contas_pagar e nas parcelas_pagar dentro da mesma transação,
-- e retorna o id da conta criada. RLS é respeitada (SECURITY INVOKER).
CREATE OR REPLACE FUNCTION public.create_conta_with_parcelas(payload JSONB)
RETURNS UUID
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = 'public'
AS $$
DECLARE
  nova_conta_id UUID;
  parcela JSONB;
  soma_parcelas NUMERIC(14,2);
  total NUMERIC(14,2);
BEGIN
  total := (payload->>'valor_total')::NUMERIC(14,2);

  SELECT COALESCE(SUM((p->>'valor')::NUMERIC(14,2)), 0)
  INTO soma_parcelas
  FROM jsonb_array_elements(payload->'parcelas') AS p;

  IF ABS(soma_parcelas - total) > 0.01 THEN
    RAISE EXCEPTION 'Soma das parcelas (%) difere do valor total (%)', soma_parcelas, total
      USING ERRCODE = '23514';
  END IF;

  INSERT INTO public.contas_pagar (
    tenant_id, plan_id, item_id, fornecedor_id, categoria_id,
    descricao, documento, emissao, valor_total, observacoes, created_by
  )
  VALUES (
    (payload->>'tenant_id')::UUID,
    NULLIF(payload->>'plan_id', '')::UUID,
    NULLIF(payload->>'item_id', '')::UUID,
    NULLIF(payload->>'fornecedor_id', '')::UUID,
    NULLIF(payload->>'categoria_id', '')::UUID,
    payload->>'descricao',
    COALESCE(payload->>'documento', ''),
    NULLIF(payload->>'emissao', '')::DATE,
    total,
    COALESCE(payload->>'observacoes', ''),
    auth.uid()
  )
  RETURNING id INTO nova_conta_id;

  FOR parcela IN SELECT * FROM jsonb_array_elements(payload->'parcelas')
  LOOP
    INSERT INTO public.parcelas_pagar (
      conta_id, numero, data_vencimento, valor
    )
    VALUES (
      nova_conta_id,
      (parcela->>'numero')::INT,
      (parcela->>'data_vencimento')::DATE,
      (parcela->>'valor')::NUMERIC(14,2)
    );
  END LOOP;

  RETURN nova_conta_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.create_conta_with_parcelas(JSONB) TO authenticated;

-- Atualiza cabeçalho + parcelas de uma conta dentro da mesma transação.
-- Bloqueia se houver parcela paga (preserva integridade dos pagamentos).
-- Substitui TODAS as parcelas pelas do payload — RLS garante que só membros
-- do tenant da conta podem chamar.
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
      USING ERRCODE = 'PGRST116';
  END IF;

  DELETE FROM public.parcelas_pagar WHERE conta_id = conta_id_in;

  FOR parcela IN SELECT * FROM jsonb_array_elements(payload->'parcelas')
  LOOP
    INSERT INTO public.parcelas_pagar (
      conta_id, numero, data_vencimento, valor
    )
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

GRANT EXECUTE ON FUNCTION public.update_conta_with_parcelas(UUID, JSONB) TO authenticated;

-- =========================================================================
-- 7. STORAGE BUCKET: contas-anexos
-- =========================================================================

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'contas-anexos',
  'contas-anexos',
  false,
  10485760,
  ARRAY[
    'image/png','image/jpeg','image/webp','image/gif','image/svg+xml',
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-excel',
    'text/csv'
  ]
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Path layout: <conta_id>/<timestamp>-<filename>

DROP POLICY IF EXISTS "contas_anexos_read" ON storage.objects;
CREATE POLICY "contas_anexos_read"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'contas-anexos'
    AND (
      EXISTS (
        SELECT 1
        FROM public.contas_pagar c
        JOIN public.tenant_members tm ON tm.tenant_id = c.tenant_id AND tm.user_id = auth.uid()
        WHERE c.id::text = split_part(storage.objects.name, '/', 1)
      )
      OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
    )
  );

DROP POLICY IF EXISTS "contas_anexos_insert" ON storage.objects;
CREATE POLICY "contas_anexos_insert"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'contas-anexos'
    AND owner = auth.uid()
    AND EXISTS (
      SELECT 1
      FROM public.contas_pagar c
      JOIN public.tenant_members tm ON tm.tenant_id = c.tenant_id AND tm.user_id = auth.uid()
      WHERE c.id::text = split_part(storage.objects.name, '/', 1)
    )
  );

DROP POLICY IF EXISTS "contas_anexos_delete" ON storage.objects;
CREATE POLICY "contas_anexos_delete"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'contas-anexos'
    AND (
      owner = auth.uid()
      OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
    )
  );

-- =========================================================================
-- 8. SEED: categorias globais sugeridas
-- =========================================================================

INSERT INTO public.categorias_despesa (name, sort_order, tenant_id) VALUES
  ('Marketing', 10, NULL),
  ('Folha',     20, NULL),
  ('Aluguel',   30, NULL),
  ('Insumos',   40, NULL),
  ('Serviços',  50, NULL),
  ('Impostos',  60, NULL),
  ('Outros',    99, NULL)
ON CONFLICT (tenant_id, name) DO NOTHING;
