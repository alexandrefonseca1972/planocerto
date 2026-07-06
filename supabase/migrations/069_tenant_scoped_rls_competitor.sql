-- Rollout de RLS por-tenant (fase 1, domínio 3/4): instituicoes,
-- cursos_instituicao, corpo_docente, mensalidades_concorrentes (módulo de
-- benchmarking de concorrentes, 045_competitor_benchmark.sql). Diff mínimo:
-- mesmas policies vigentes, só troca is_admin() -> is_admin_for_tenant(...).
-- Catálogos globais do módulo (modalidades, cursos_superiores, turnos) não
-- têm tenant_id — ficam de fora do rollout.

-- ===========================================================================
-- instituicoes — tenant_id NOT NULL
-- ===========================================================================

DROP POLICY IF EXISTS "instituicoes read" ON public.instituicoes;
CREATE POLICY "instituicoes read" ON public.instituicoes FOR SELECT
  USING (
    public.is_admin_for_tenant(instituicoes.tenant_id)
    OR EXISTS (
      SELECT 1 FROM public.tenant_members
      WHERE tenant_id = instituicoes.tenant_id AND user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "instituicoes insert" ON public.instituicoes;
CREATE POLICY "instituicoes insert" ON public.instituicoes FOR INSERT
  WITH CHECK (
    public.is_admin_for_tenant(instituicoes.tenant_id)
    OR EXISTS (
      SELECT 1 FROM public.tenant_members
      WHERE tenant_id = instituicoes.tenant_id AND user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "instituicoes update" ON public.instituicoes;
CREATE POLICY "instituicoes update" ON public.instituicoes FOR UPDATE
  USING (
    public.is_admin_for_tenant(instituicoes.tenant_id)
    OR EXISTS (
      SELECT 1 FROM public.tenant_members
      WHERE tenant_id = instituicoes.tenant_id AND user_id = auth.uid()
    )
  )
  WITH CHECK (
    public.is_admin_for_tenant(instituicoes.tenant_id)
    OR EXISTS (
      SELECT 1 FROM public.tenant_members
      WHERE tenant_id = instituicoes.tenant_id AND user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "instituicoes delete" ON public.instituicoes;
CREATE POLICY "instituicoes delete" ON public.instituicoes FOR DELETE
  USING (
    public.is_admin_for_tenant(instituicoes.tenant_id)
    OR EXISTS (
      SELECT 1 FROM public.tenant_members
      WHERE tenant_id = instituicoes.tenant_id
        AND user_id = auth.uid()
        AND role IN ('owner','admin')
    )
  );

-- ===========================================================================
-- cursos_instituicao — tenant via JOIN em instituicoes
-- ===========================================================================

DROP POLICY IF EXISTS "cursos_instituicao read" ON public.cursos_instituicao;
CREATE POLICY "cursos_instituicao read" ON public.cursos_instituicao FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.instituicoes i
      WHERE i.id = cursos_instituicao.instituicao_id AND public.is_admin_for_tenant(i.tenant_id)
    )
    OR EXISTS (
      SELECT 1 FROM public.instituicoes i
      JOIN public.tenant_members tm ON tm.tenant_id = i.tenant_id
      WHERE i.id = cursos_instituicao.instituicao_id AND tm.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "cursos_instituicao insert" ON public.cursos_instituicao;
CREATE POLICY "cursos_instituicao insert" ON public.cursos_instituicao FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.instituicoes i
      WHERE i.id = cursos_instituicao.instituicao_id AND public.is_admin_for_tenant(i.tenant_id)
    )
    OR EXISTS (
      SELECT 1 FROM public.instituicoes i
      JOIN public.tenant_members tm ON tm.tenant_id = i.tenant_id
      WHERE i.id = cursos_instituicao.instituicao_id AND tm.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "cursos_instituicao update" ON public.cursos_instituicao;
CREATE POLICY "cursos_instituicao update" ON public.cursos_instituicao FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.instituicoes i
      WHERE i.id = cursos_instituicao.instituicao_id AND public.is_admin_for_tenant(i.tenant_id)
    )
    OR EXISTS (
      SELECT 1 FROM public.instituicoes i
      JOIN public.tenant_members tm ON tm.tenant_id = i.tenant_id
      WHERE i.id = cursos_instituicao.instituicao_id AND tm.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.instituicoes i
      WHERE i.id = cursos_instituicao.instituicao_id AND public.is_admin_for_tenant(i.tenant_id)
    )
    OR EXISTS (
      SELECT 1 FROM public.instituicoes i
      JOIN public.tenant_members tm ON tm.tenant_id = i.tenant_id
      WHERE i.id = cursos_instituicao.instituicao_id AND tm.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "cursos_instituicao delete" ON public.cursos_instituicao;
CREATE POLICY "cursos_instituicao delete" ON public.cursos_instituicao FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.instituicoes i
      WHERE i.id = cursos_instituicao.instituicao_id AND public.is_admin_for_tenant(i.tenant_id)
    )
    OR EXISTS (
      SELECT 1 FROM public.instituicoes i
      JOIN public.tenant_members tm ON tm.tenant_id = i.tenant_id
      WHERE i.id = cursos_instituicao.instituicao_id
        AND tm.user_id = auth.uid()
        AND tm.role IN ('owner','admin')
    )
  );

-- ===========================================================================
-- corpo_docente — tenant via JOIN duplo (cursos_instituicao -> instituicoes)
-- ===========================================================================

DROP POLICY IF EXISTS "corpo_docente read" ON public.corpo_docente;
CREATE POLICY "corpo_docente read" ON public.corpo_docente FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.cursos_instituicao ci
      JOIN public.instituicoes i ON i.id = ci.instituicao_id
      WHERE ci.id = corpo_docente.curso_instituicao_id AND public.is_admin_for_tenant(i.tenant_id)
    )
    OR EXISTS (
      SELECT 1 FROM public.cursos_instituicao ci
      JOIN public.instituicoes i ON i.id = ci.instituicao_id
      JOIN public.tenant_members tm ON tm.tenant_id = i.tenant_id
      WHERE ci.id = corpo_docente.curso_instituicao_id AND tm.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "corpo_docente insert" ON public.corpo_docente;
CREATE POLICY "corpo_docente insert" ON public.corpo_docente FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.cursos_instituicao ci
      JOIN public.instituicoes i ON i.id = ci.instituicao_id
      WHERE ci.id = corpo_docente.curso_instituicao_id AND public.is_admin_for_tenant(i.tenant_id)
    )
    OR EXISTS (
      SELECT 1 FROM public.cursos_instituicao ci
      JOIN public.instituicoes i ON i.id = ci.instituicao_id
      JOIN public.tenant_members tm ON tm.tenant_id = i.tenant_id
      WHERE ci.id = corpo_docente.curso_instituicao_id AND tm.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "corpo_docente update" ON public.corpo_docente;
CREATE POLICY "corpo_docente update" ON public.corpo_docente FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.cursos_instituicao ci
      JOIN public.instituicoes i ON i.id = ci.instituicao_id
      WHERE ci.id = corpo_docente.curso_instituicao_id AND public.is_admin_for_tenant(i.tenant_id)
    )
    OR EXISTS (
      SELECT 1 FROM public.cursos_instituicao ci
      JOIN public.instituicoes i ON i.id = ci.instituicao_id
      JOIN public.tenant_members tm ON tm.tenant_id = i.tenant_id
      WHERE ci.id = corpo_docente.curso_instituicao_id AND tm.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.cursos_instituicao ci
      JOIN public.instituicoes i ON i.id = ci.instituicao_id
      WHERE ci.id = corpo_docente.curso_instituicao_id AND public.is_admin_for_tenant(i.tenant_id)
    )
    OR EXISTS (
      SELECT 1 FROM public.cursos_instituicao ci
      JOIN public.instituicoes i ON i.id = ci.instituicao_id
      JOIN public.tenant_members tm ON tm.tenant_id = i.tenant_id
      WHERE ci.id = corpo_docente.curso_instituicao_id AND tm.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "corpo_docente delete" ON public.corpo_docente;
CREATE POLICY "corpo_docente delete" ON public.corpo_docente FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.cursos_instituicao ci
      JOIN public.instituicoes i ON i.id = ci.instituicao_id
      WHERE ci.id = corpo_docente.curso_instituicao_id AND public.is_admin_for_tenant(i.tenant_id)
    )
    OR EXISTS (
      SELECT 1 FROM public.cursos_instituicao ci
      JOIN public.instituicoes i ON i.id = ci.instituicao_id
      JOIN public.tenant_members tm ON tm.tenant_id = i.tenant_id
      WHERE ci.id = corpo_docente.curso_instituicao_id
        AND tm.user_id = auth.uid()
        AND tm.role IN ('owner','admin')
    )
  );

-- ===========================================================================
-- mensalidades_concorrentes — tenant via JOIN duplo (idem corpo_docente)
-- ===========================================================================

DROP POLICY IF EXISTS "mensalidades_concorrentes read" ON public.mensalidades_concorrentes;
CREATE POLICY "mensalidades_concorrentes read" ON public.mensalidades_concorrentes FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.cursos_instituicao ci
      JOIN public.instituicoes i ON i.id = ci.instituicao_id
      WHERE ci.id = mensalidades_concorrentes.curso_instituicao_id AND public.is_admin_for_tenant(i.tenant_id)
    )
    OR EXISTS (
      SELECT 1 FROM public.cursos_instituicao ci
      JOIN public.instituicoes i ON i.id = ci.instituicao_id
      JOIN public.tenant_members tm ON tm.tenant_id = i.tenant_id
      WHERE ci.id = mensalidades_concorrentes.curso_instituicao_id AND tm.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "mensalidades_concorrentes insert" ON public.mensalidades_concorrentes;
CREATE POLICY "mensalidades_concorrentes insert" ON public.mensalidades_concorrentes FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.cursos_instituicao ci
      JOIN public.instituicoes i ON i.id = ci.instituicao_id
      WHERE ci.id = mensalidades_concorrentes.curso_instituicao_id AND public.is_admin_for_tenant(i.tenant_id)
    )
    OR EXISTS (
      SELECT 1 FROM public.cursos_instituicao ci
      JOIN public.instituicoes i ON i.id = ci.instituicao_id
      JOIN public.tenant_members tm ON tm.tenant_id = i.tenant_id
      WHERE ci.id = mensalidades_concorrentes.curso_instituicao_id AND tm.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "mensalidades_concorrentes update" ON public.mensalidades_concorrentes;
CREATE POLICY "mensalidades_concorrentes update" ON public.mensalidades_concorrentes FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.cursos_instituicao ci
      JOIN public.instituicoes i ON i.id = ci.instituicao_id
      WHERE ci.id = mensalidades_concorrentes.curso_instituicao_id AND public.is_admin_for_tenant(i.tenant_id)
    )
    OR EXISTS (
      SELECT 1 FROM public.cursos_instituicao ci
      JOIN public.instituicoes i ON i.id = ci.instituicao_id
      JOIN public.tenant_members tm ON tm.tenant_id = i.tenant_id
      WHERE ci.id = mensalidades_concorrentes.curso_instituicao_id AND tm.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.cursos_instituicao ci
      JOIN public.instituicoes i ON i.id = ci.instituicao_id
      WHERE ci.id = mensalidades_concorrentes.curso_instituicao_id AND public.is_admin_for_tenant(i.tenant_id)
    )
    OR EXISTS (
      SELECT 1 FROM public.cursos_instituicao ci
      JOIN public.instituicoes i ON i.id = ci.instituicao_id
      JOIN public.tenant_members tm ON tm.tenant_id = i.tenant_id
      WHERE ci.id = mensalidades_concorrentes.curso_instituicao_id AND tm.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "mensalidades_concorrentes delete" ON public.mensalidades_concorrentes;
CREATE POLICY "mensalidades_concorrentes delete" ON public.mensalidades_concorrentes FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.cursos_instituicao ci
      JOIN public.instituicoes i ON i.id = ci.instituicao_id
      WHERE ci.id = mensalidades_concorrentes.curso_instituicao_id AND public.is_admin_for_tenant(i.tenant_id)
    )
    OR EXISTS (
      SELECT 1 FROM public.cursos_instituicao ci
      JOIN public.instituicoes i ON i.id = ci.instituicao_id
      JOIN public.tenant_members tm ON tm.tenant_id = i.tenant_id
      WHERE ci.id = mensalidades_concorrentes.curso_instituicao_id
        AND tm.user_id = auth.uid()
        AND tm.role IN ('owner','admin')
    )
  );
