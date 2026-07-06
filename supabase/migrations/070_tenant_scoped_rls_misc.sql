-- Rollout de RLS por-tenant (fase 1, domínio 4/4): schools, companies,
-- simulator_scenarios, simulator_channel_metrics, e as policies de escrita de
-- areas/units que ficaram pendentes em 067 (só a leitura foi migrada lá).
-- Diff mínimo: mesmas policies vigentes, só troca is_admin() -> is_admin_for_tenant(tenant_id).
--
-- Fora de escopo (não usam is_admin()/has_perm(), ou não têm tenant_id
-- próprio na condição): plan_templates, plan_template_items, plan_attachments,
-- macro_acoes, channels, llm_settings, simulator_channel_metrics (tenant só
-- via JOIN — tratado abaixo mesmo assim, seguindo o padrão de action_items).

-- ===========================================================================
-- areas / units — completar a escrita (leitura já migrada em 067)
-- ===========================================================================

DROP POLICY IF EXISTS "areas write admin" ON public.areas;
CREATE POLICY "areas write admin" ON public.areas FOR ALL
  USING (
    (areas.tenant_id IS NOT NULL AND public.is_admin_for_tenant(areas.tenant_id))
    OR (areas.tenant_id IS NULL AND public.is_admin())
  )
  WITH CHECK (
    (areas.tenant_id IS NOT NULL AND public.is_admin_for_tenant(areas.tenant_id))
    OR (areas.tenant_id IS NULL AND public.is_admin())
  );

DROP POLICY IF EXISTS "units write admin" ON public.units;
CREATE POLICY "units write admin" ON public.units FOR ALL
  USING (
    (units.tenant_id IS NOT NULL AND public.is_admin_for_tenant(units.tenant_id))
    OR (units.tenant_id IS NULL AND public.is_admin())
  )
  WITH CHECK (
    (units.tenant_id IS NOT NULL AND public.is_admin_for_tenant(units.tenant_id))
    OR (units.tenant_id IS NULL AND public.is_admin())
  );

-- ===========================================================================
-- schools — tenant_id NOT NULL
-- ===========================================================================

DROP POLICY IF EXISTS "schools read" ON public.schools;
CREATE POLICY "schools read" ON public.schools FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM public.tenant_members WHERE tenant_id = schools.tenant_id AND user_id = auth.uid())
    OR public.is_admin_for_tenant(schools.tenant_id)
  );

DROP POLICY IF EXISTS "schools insert" ON public.schools;
CREATE POLICY "schools insert" ON public.schools FOR INSERT
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.tenant_members WHERE tenant_id = schools.tenant_id AND user_id = auth.uid())
    OR public.is_admin_for_tenant(schools.tenant_id)
  );

DROP POLICY IF EXISTS "schools update" ON public.schools;
CREATE POLICY "schools update" ON public.schools FOR UPDATE
  USING (
    EXISTS (SELECT 1 FROM public.tenant_members WHERE tenant_id = schools.tenant_id AND user_id = auth.uid())
    OR public.is_admin_for_tenant(schools.tenant_id)
  );

DROP POLICY IF EXISTS "schools delete" ON public.schools;
CREATE POLICY "schools delete" ON public.schools FOR DELETE
  USING (
    EXISTS (SELECT 1 FROM public.tenant_members WHERE tenant_id = schools.tenant_id AND user_id = auth.uid() AND role IN ('owner','admin'))
    OR public.is_admin_for_tenant(schools.tenant_id)
  );

-- ===========================================================================
-- companies — tenant_id NOT NULL
-- ===========================================================================

DROP POLICY IF EXISTS "companies read" ON public.companies;
CREATE POLICY "companies read" ON public.companies FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM public.tenant_members WHERE tenant_id = companies.tenant_id AND user_id = auth.uid())
    OR public.is_admin_for_tenant(companies.tenant_id)
  );

DROP POLICY IF EXISTS "companies insert" ON public.companies;
CREATE POLICY "companies insert" ON public.companies FOR INSERT
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.tenant_members WHERE tenant_id = companies.tenant_id AND user_id = auth.uid())
    OR public.is_admin_for_tenant(companies.tenant_id)
  );

DROP POLICY IF EXISTS "companies update" ON public.companies;
CREATE POLICY "companies update" ON public.companies FOR UPDATE
  USING (
    EXISTS (SELECT 1 FROM public.tenant_members WHERE tenant_id = companies.tenant_id AND user_id = auth.uid())
    OR public.is_admin_for_tenant(companies.tenant_id)
  );

DROP POLICY IF EXISTS "companies delete" ON public.companies;
CREATE POLICY "companies delete" ON public.companies FOR DELETE
  USING (
    EXISTS (SELECT 1 FROM public.tenant_members WHERE tenant_id = companies.tenant_id AND user_id = auth.uid() AND role IN ('owner','admin'))
    OR public.is_admin_for_tenant(companies.tenant_id)
  );

-- ===========================================================================
-- simulator_scenarios — tenant_id NOT NULL
-- ===========================================================================

DROP POLICY IF EXISTS "sim scenarios read" ON public.simulator_scenarios;
CREATE POLICY "sim scenarios read" ON public.simulator_scenarios FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM public.tenant_members WHERE tenant_id = simulator_scenarios.tenant_id AND user_id = auth.uid())
    OR public.is_admin_for_tenant(simulator_scenarios.tenant_id)
  );

DROP POLICY IF EXISTS "sim scenarios insert" ON public.simulator_scenarios;
CREATE POLICY "sim scenarios insert" ON public.simulator_scenarios FOR INSERT
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.tenant_members WHERE tenant_id = simulator_scenarios.tenant_id AND user_id = auth.uid())
    OR public.is_admin_for_tenant(simulator_scenarios.tenant_id)
  );

DROP POLICY IF EXISTS "sim scenarios update" ON public.simulator_scenarios;
CREATE POLICY "sim scenarios update" ON public.simulator_scenarios FOR UPDATE
  USING (
    EXISTS (SELECT 1 FROM public.tenant_members WHERE tenant_id = simulator_scenarios.tenant_id AND user_id = auth.uid())
    OR public.is_admin_for_tenant(simulator_scenarios.tenant_id)
  );

DROP POLICY IF EXISTS "sim scenarios delete" ON public.simulator_scenarios;
CREATE POLICY "sim scenarios delete" ON public.simulator_scenarios FOR DELETE
  USING (
    EXISTS (SELECT 1 FROM public.tenant_members WHERE tenant_id = simulator_scenarios.tenant_id AND user_id = auth.uid() AND role IN ('owner','admin'))
    OR public.is_admin_for_tenant(simulator_scenarios.tenant_id)
  );

-- ===========================================================================
-- simulator_channel_metrics — tenant só via JOIN em simulator_scenarios
-- ===========================================================================

DROP POLICY IF EXISTS "sim metrics read" ON public.simulator_channel_metrics;
CREATE POLICY "sim metrics read" ON public.simulator_channel_metrics FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.simulator_scenarios s
      WHERE s.id = simulator_channel_metrics.scenario_id AND public.is_admin_for_tenant(s.tenant_id)
    )
    OR EXISTS (
      SELECT 1 FROM public.simulator_scenarios s
      JOIN public.tenant_members tm ON tm.tenant_id = s.tenant_id
      WHERE s.id = simulator_channel_metrics.scenario_id AND tm.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "sim metrics insert" ON public.simulator_channel_metrics;
CREATE POLICY "sim metrics insert" ON public.simulator_channel_metrics FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.simulator_scenarios s
      WHERE s.id = simulator_channel_metrics.scenario_id AND public.is_admin_for_tenant(s.tenant_id)
    )
    OR EXISTS (
      SELECT 1 FROM public.simulator_scenarios s
      JOIN public.tenant_members tm ON tm.tenant_id = s.tenant_id
      WHERE s.id = simulator_channel_metrics.scenario_id AND tm.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "sim metrics update" ON public.simulator_channel_metrics;
CREATE POLICY "sim metrics update" ON public.simulator_channel_metrics FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.simulator_scenarios s
      WHERE s.id = simulator_channel_metrics.scenario_id AND public.is_admin_for_tenant(s.tenant_id)
    )
    OR EXISTS (
      SELECT 1 FROM public.simulator_scenarios s
      JOIN public.tenant_members tm ON tm.tenant_id = s.tenant_id
      WHERE s.id = simulator_channel_metrics.scenario_id AND tm.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "sim metrics delete" ON public.simulator_channel_metrics;
CREATE POLICY "sim metrics delete" ON public.simulator_channel_metrics FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.simulator_scenarios s
      WHERE s.id = simulator_channel_metrics.scenario_id AND public.is_admin_for_tenant(s.tenant_id)
    )
    OR EXISTS (
      SELECT 1 FROM public.simulator_scenarios s
      JOIN public.tenant_members tm ON tm.tenant_id = s.tenant_id
      WHERE s.id = simulator_channel_metrics.scenario_id AND tm.user_id = auth.uid()
    )
  );
