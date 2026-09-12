-- Performance da tela de Planos/Dashboard/Calendário.
--
-- 1) Índices que faltavam nos caminhos de leitura mais frequentes
--    (advisor: unindexed_foreign_keys).
-- 2) Policies de action_plans / action_items / plan_audit_log reescritas sem
--    reavaliar auth.uid()/is_admin() por linha (advisor: auth_rls_initplan) e,
--    em action_items/plan_audit_log, com o conjunto de planos acessíveis
--    calculado UMA vez por statement (subquery não correlacionada) em vez de
--    um EXISTS por linha. Semântica idêntica às policies anteriores.

-- ===========================================================================
-- 1) Índices
-- ===========================================================================
CREATE INDEX IF NOT EXISTS idx_action_items_plan_sort
  ON public.action_items (plan_id, sort_order);
CREATE INDEX IF NOT EXISTS idx_action_items_parent
  ON public.action_items (parent_id);
CREATE INDEX IF NOT EXISTS idx_action_plans_tenant_created
  ON public.action_plans (tenant_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_plan_audit_log_plan_created
  ON public.plan_audit_log (plan_id, created_at DESC);

-- ===========================================================================
-- 2) action_plans
-- ===========================================================================
DROP POLICY IF EXISTS "Members can read plans" ON public.action_plans;
CREATE POLICY "Members can read plans" ON public.action_plans FOR SELECT
  USING (
    public.is_admin_for_tenant(tenant_id)
    OR (
      EXISTS (
        SELECT 1 FROM public.tenant_members tm
        WHERE tm.tenant_id = action_plans.tenant_id
          AND tm.user_id = (SELECT auth.uid())
      )
      AND public.can_access_unit(unit_id)
    )
  );

DROP POLICY IF EXISTS "Members can insert plans" ON public.action_plans;
CREATE POLICY "Members can insert plans" ON public.action_plans FOR INSERT
  WITH CHECK (
    public.is_admin_for_tenant(tenant_id)
    OR (
      EXISTS (
        SELECT 1 FROM public.tenant_members tm
        WHERE tm.tenant_id = action_plans.tenant_id
          AND tm.user_id = (SELECT auth.uid())
      )
      AND public.can_access_unit(unit_id)
    )
  );

DROP POLICY IF EXISTS "Members can update plans" ON public.action_plans;
CREATE POLICY "Members can update plans" ON public.action_plans FOR UPDATE
  USING (
    public.is_admin_for_tenant(tenant_id)
    OR (
      EXISTS (
        SELECT 1 FROM public.tenant_members tm
        WHERE tm.tenant_id = action_plans.tenant_id
          AND tm.user_id = (SELECT auth.uid())
      )
      AND public.can_access_unit(unit_id)
    )
  );

DROP POLICY IF EXISTS "Tenant admins can delete plans" ON public.action_plans;
CREATE POLICY "Tenant admins can delete plans" ON public.action_plans FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.tenant_members tm
      WHERE tm.tenant_id = action_plans.tenant_id
        AND tm.user_id = (SELECT auth.uid())
        AND tm.role IN ('owner', 'admin')
    )
    OR (SELECT public.is_admin())
  );

-- ===========================================================================
-- 3) action_items — "planos acessíveis" calculado uma vez por statement
-- ===========================================================================
-- Mesma regra de leitura de action_plans (admin do tenant OU membro com
-- acesso à unidade), mas como subquery não correlacionada: o planner avalia
-- o conjunto uma vez e faz hash lookup por linha.
DROP POLICY IF EXISTS "Members can read items" ON public.action_items;
CREATE POLICY "Members can read items" ON public.action_items FOR SELECT
  USING (
    plan_id IN (
      SELECT p.id FROM public.action_plans p
      WHERE public.is_admin_for_tenant(p.tenant_id)
         OR (
           EXISTS (
             SELECT 1 FROM public.tenant_members tm
             WHERE tm.tenant_id = p.tenant_id AND tm.user_id = (SELECT auth.uid())
           )
           AND public.can_access_unit(p.unit_id)
         )
    )
  );

DROP POLICY IF EXISTS "Members can insert items" ON public.action_items;
CREATE POLICY "Members can insert items" ON public.action_items FOR INSERT
  WITH CHECK (
    plan_id IN (
      SELECT p.id FROM public.action_plans p
      WHERE public.is_admin_for_tenant(p.tenant_id)
         OR (
           EXISTS (
             SELECT 1 FROM public.tenant_members tm
             WHERE tm.tenant_id = p.tenant_id AND tm.user_id = (SELECT auth.uid())
           )
           AND public.can_access_unit(p.unit_id)
         )
    )
  );

DROP POLICY IF EXISTS "Members can update items" ON public.action_items;
CREATE POLICY "Members can update items" ON public.action_items FOR UPDATE
  USING (
    plan_id IN (
      SELECT p.id FROM public.action_plans p
      WHERE public.is_admin_for_tenant(p.tenant_id)
         OR (
           EXISTS (
             SELECT 1 FROM public.tenant_members tm
             WHERE tm.tenant_id = p.tenant_id AND tm.user_id = (SELECT auth.uid())
           )
           AND public.can_access_unit(p.unit_id)
         )
    )
  );

DROP POLICY IF EXISTS "Members can delete items" ON public.action_items;
CREATE POLICY "Members can delete items" ON public.action_items FOR DELETE
  USING (
    plan_id IN (
      SELECT p.id FROM public.action_plans p
      WHERE public.is_admin_for_tenant(p.tenant_id)
         OR (
           EXISTS (
             SELECT 1 FROM public.tenant_members tm
             WHERE tm.tenant_id = p.tenant_id AND tm.user_id = (SELECT auth.uid())
           )
           AND public.can_access_unit(p.unit_id)
         )
    )
  );

-- ===========================================================================
-- 4) plan_audit_log — membro do tenant do plano OU admin (regra original,
--    sem escopo de unidade), também como subquery não correlacionada.
-- ===========================================================================
DROP POLICY IF EXISTS "Members can read audit logs" ON public.plan_audit_log;
CREATE POLICY "Members can read audit logs" ON public.plan_audit_log FOR SELECT
  USING (
    plan_id IN (
      SELECT p.id FROM public.action_plans p
      JOIN public.tenant_members tm ON tm.tenant_id = p.tenant_id
      WHERE tm.user_id = (SELECT auth.uid())
    )
    OR (SELECT public.is_admin())
  );

DROP POLICY IF EXISTS "Members can insert audit logs" ON public.plan_audit_log;
CREATE POLICY "Members can insert audit logs" ON public.plan_audit_log FOR INSERT
  WITH CHECK (
    plan_id IN (
      SELECT p.id FROM public.action_plans p
      JOIN public.tenant_members tm ON tm.tenant_id = p.tenant_id
      WHERE tm.user_id = (SELECT auth.uid())
    )
    OR (SELECT public.is_admin())
  );
