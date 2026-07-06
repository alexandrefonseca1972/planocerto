-- Rollout de RLS por-tenant (fase 1, domínio 2/4): fornecedores,
-- categorias_despesa, contas_pagar, parcelas_pagar, conta_attachments.
-- Diff mínimo: mesmas policies vigentes (032_fornecedores.sql,
-- 033_contas_pagar.sql), só troca is_admin() -> is_admin_for_tenant(tenant_id).
-- Nenhuma dessas policies usa has_perm().

-- ===========================================================================
-- fornecedores / categorias_despesa — tenant_id NULLABLE (registros globais)
-- ===========================================================================

DROP POLICY IF EXISTS "fornecedores read tenant" ON public.fornecedores;
CREATE POLICY "fornecedores read tenant" ON public.fornecedores FOR SELECT
  USING (
    (fornecedores.tenant_id IS NOT NULL AND public.is_admin_for_tenant(fornecedores.tenant_id))
    OR (fornecedores.tenant_id IS NULL AND public.is_admin())
    OR EXISTS (
      SELECT 1 FROM public.tenant_members
      WHERE tenant_id = fornecedores.tenant_id AND user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "fornecedores write admin" ON public.fornecedores;
CREATE POLICY "fornecedores write admin" ON public.fornecedores FOR ALL
  USING (
    (fornecedores.tenant_id IS NOT NULL AND public.is_admin_for_tenant(fornecedores.tenant_id))
    OR (fornecedores.tenant_id IS NULL AND public.is_admin())
  )
  WITH CHECK (
    (fornecedores.tenant_id IS NOT NULL AND public.is_admin_for_tenant(fornecedores.tenant_id))
    OR (fornecedores.tenant_id IS NULL AND public.is_admin())
  );

DROP POLICY IF EXISTS "categorias_despesa read tenant" ON public.categorias_despesa;
CREATE POLICY "categorias_despesa read tenant" ON public.categorias_despesa FOR SELECT
  USING (
    (categorias_despesa.tenant_id IS NOT NULL AND public.is_admin_for_tenant(categorias_despesa.tenant_id))
    OR (categorias_despesa.tenant_id IS NULL AND public.is_admin())
    OR EXISTS (
      SELECT 1 FROM public.tenant_members
      WHERE tenant_id = categorias_despesa.tenant_id AND user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "categorias_despesa write admin" ON public.categorias_despesa;
CREATE POLICY "categorias_despesa write admin" ON public.categorias_despesa FOR ALL
  USING (
    (categorias_despesa.tenant_id IS NOT NULL AND public.is_admin_for_tenant(categorias_despesa.tenant_id))
    OR (categorias_despesa.tenant_id IS NULL AND public.is_admin())
  )
  WITH CHECK (
    (categorias_despesa.tenant_id IS NOT NULL AND public.is_admin_for_tenant(categorias_despesa.tenant_id))
    OR (categorias_despesa.tenant_id IS NULL AND public.is_admin())
  );

-- ===========================================================================
-- contas_pagar — tenant_id NOT NULL
-- ===========================================================================

DROP POLICY IF EXISTS "contas_pagar read" ON public.contas_pagar;
CREATE POLICY "contas_pagar read" ON public.contas_pagar FOR SELECT
  USING (
    public.is_admin_for_tenant(contas_pagar.tenant_id)
    OR EXISTS (
      SELECT 1 FROM public.tenant_members
      WHERE tenant_id = contas_pagar.tenant_id AND user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "contas_pagar insert" ON public.contas_pagar;
CREATE POLICY "contas_pagar insert" ON public.contas_pagar FOR INSERT
  WITH CHECK (
    public.is_admin_for_tenant(contas_pagar.tenant_id)
    OR EXISTS (
      SELECT 1 FROM public.tenant_members
      WHERE tenant_id = contas_pagar.tenant_id AND user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "contas_pagar update" ON public.contas_pagar;
CREATE POLICY "contas_pagar update" ON public.contas_pagar FOR UPDATE
  USING (
    public.is_admin_for_tenant(contas_pagar.tenant_id)
    OR EXISTS (
      SELECT 1 FROM public.tenant_members
      WHERE tenant_id = contas_pagar.tenant_id AND user_id = auth.uid()
    )
  )
  WITH CHECK (
    public.is_admin_for_tenant(contas_pagar.tenant_id)
    OR EXISTS (
      SELECT 1 FROM public.tenant_members
      WHERE tenant_id = contas_pagar.tenant_id AND user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "contas_pagar delete" ON public.contas_pagar;
CREATE POLICY "contas_pagar delete" ON public.contas_pagar FOR DELETE
  USING (
    public.is_admin_for_tenant(contas_pagar.tenant_id)
    OR EXISTS (
      SELECT 1 FROM public.tenant_members
      WHERE tenant_id = contas_pagar.tenant_id
        AND user_id = auth.uid()
        AND role IN ('owner','admin')
    )
  );

-- ===========================================================================
-- parcelas_pagar — tenant só via JOIN em contas_pagar
-- ===========================================================================

DROP POLICY IF EXISTS "parcelas read" ON public.parcelas_pagar;
CREATE POLICY "parcelas read" ON public.parcelas_pagar FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.contas_pagar c
      WHERE c.id = parcelas_pagar.conta_id AND public.is_admin_for_tenant(c.tenant_id)
    )
    OR EXISTS (
      SELECT 1
      FROM public.contas_pagar c
      JOIN public.tenant_members tm ON tm.tenant_id = c.tenant_id
      WHERE c.id = parcelas_pagar.conta_id AND tm.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "parcelas insert" ON public.parcelas_pagar;
CREATE POLICY "parcelas insert" ON public.parcelas_pagar FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.contas_pagar c
      WHERE c.id = parcelas_pagar.conta_id AND public.is_admin_for_tenant(c.tenant_id)
    )
    OR EXISTS (
      SELECT 1
      FROM public.contas_pagar c
      JOIN public.tenant_members tm ON tm.tenant_id = c.tenant_id
      WHERE c.id = parcelas_pagar.conta_id AND tm.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "parcelas update" ON public.parcelas_pagar;
CREATE POLICY "parcelas update" ON public.parcelas_pagar FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.contas_pagar c
      WHERE c.id = parcelas_pagar.conta_id AND public.is_admin_for_tenant(c.tenant_id)
    )
    OR EXISTS (
      SELECT 1
      FROM public.contas_pagar c
      JOIN public.tenant_members tm ON tm.tenant_id = c.tenant_id
      WHERE c.id = parcelas_pagar.conta_id AND tm.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.contas_pagar c
      WHERE c.id = parcelas_pagar.conta_id AND public.is_admin_for_tenant(c.tenant_id)
    )
    OR EXISTS (
      SELECT 1
      FROM public.contas_pagar c
      JOIN public.tenant_members tm ON tm.tenant_id = c.tenant_id
      WHERE c.id = parcelas_pagar.conta_id AND tm.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "parcelas delete" ON public.parcelas_pagar;
CREATE POLICY "parcelas delete" ON public.parcelas_pagar FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.contas_pagar c
      WHERE c.id = parcelas_pagar.conta_id AND public.is_admin_for_tenant(c.tenant_id)
    )
    OR EXISTS (
      SELECT 1
      FROM public.contas_pagar c
      JOIN public.tenant_members tm ON tm.tenant_id = c.tenant_id
      WHERE c.id = parcelas_pagar.conta_id AND tm.user_id = auth.uid()
    )
  );

-- ===========================================================================
-- conta_attachments — tenant só via JOIN em contas_pagar
-- ===========================================================================

DROP POLICY IF EXISTS "conta_attachments read" ON public.conta_attachments;
CREATE POLICY "conta_attachments read" ON public.conta_attachments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.contas_pagar c
      WHERE c.id = conta_attachments.conta_id AND public.is_admin_for_tenant(c.tenant_id)
    )
    OR EXISTS (
      SELECT 1
      FROM public.contas_pagar c
      JOIN public.tenant_members tm ON tm.tenant_id = c.tenant_id
      WHERE c.id = conta_attachments.conta_id AND tm.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "conta_attachments insert" ON public.conta_attachments;
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

-- "conta_attachments delete" já não usa is_admin() no ramo do dono (só
-- uploaded_by = auth.uid()); o ramo admin puro é trocado para tenant-scoped.
DROP POLICY IF EXISTS "conta_attachments delete" ON public.conta_attachments;
CREATE POLICY "conta_attachments delete" ON public.conta_attachments FOR DELETE
  USING (
    uploaded_by = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.contas_pagar c
      WHERE c.id = conta_attachments.conta_id AND public.is_admin_for_tenant(c.tenant_id)
    )
  );
