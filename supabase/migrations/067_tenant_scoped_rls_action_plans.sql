-- Rollout de RLS por-tenant (fase 1, domínio 1/5): action_plans, action_items,
-- units, areas. Troca is_admin() -> is_admin_for_tenant(tenant_id) nas
-- policies de leitura/escrita que já tinham a linha ligada a uma empresa.
-- Diff mínimo: mesmas policies de 064_user_scope_rls.sql, só a função muda.
-- has_perm() não é usado nessas tabelas hoje, então não há troca de has_perm.

-- ===========================================================================
-- units — leitura com escopo
-- ===========================================================================

DROP POLICY IF EXISTS "units read tenant" ON public.units;
CREATE POLICY "units read tenant" ON public.units FOR SELECT
  USING (
    (units.tenant_id IS NOT NULL AND public.is_admin_for_tenant(units.tenant_id))
    OR (units.tenant_id IS NULL AND public.is_admin())
    OR (
      (
        units.tenant_id IS NULL
        OR EXISTS (
          SELECT 1 FROM public.tenant_members tm
          WHERE tm.tenant_id = units.tenant_id AND tm.user_id = auth.uid()
        )
      )
      AND public.can_access_unit(units.id)
    )
  );

-- ===========================================================================
-- areas — leitura com escopo
-- ===========================================================================

DROP POLICY IF EXISTS "areas read tenant" ON public.areas;
CREATE POLICY "areas read tenant" ON public.areas FOR SELECT
  USING (
    (areas.tenant_id IS NOT NULL AND public.is_admin_for_tenant(areas.tenant_id))
    OR (areas.tenant_id IS NULL AND public.is_admin())
    OR (
      (
        areas.tenant_id IS NULL
        OR EXISTS (
          SELECT 1 FROM public.tenant_members tm
          WHERE tm.tenant_id = areas.tenant_id AND tm.user_id = auth.uid()
        )
      )
      AND public.can_access_area(areas.id)
    )
  );

-- ===========================================================================
-- action_plans — leitura/escrita com escopo de unidade
-- ===========================================================================

DROP POLICY IF EXISTS "Members can read plans" ON public.action_plans;
CREATE POLICY "Members can read plans" ON public.action_plans FOR SELECT
  USING (
    public.is_admin_for_tenant(action_plans.tenant_id)
    OR (
      EXISTS (
        SELECT 1 FROM public.tenant_members tm
        WHERE tm.tenant_id = action_plans.tenant_id AND tm.user_id = auth.uid()
      )
      AND public.can_access_unit(action_plans.unit_id)
    )
  );

DROP POLICY IF EXISTS "Members can insert plans" ON public.action_plans;
CREATE POLICY "Members can insert plans" ON public.action_plans FOR INSERT
  WITH CHECK (
    public.is_admin_for_tenant(action_plans.tenant_id)
    OR (
      EXISTS (
        SELECT 1 FROM public.tenant_members tm
        WHERE tm.tenant_id = action_plans.tenant_id AND tm.user_id = auth.uid()
      )
      AND public.can_access_unit(action_plans.unit_id)
    )
  );

DROP POLICY IF EXISTS "Members can update plans" ON public.action_plans;
CREATE POLICY "Members can update plans" ON public.action_plans FOR UPDATE
  USING (
    public.is_admin_for_tenant(action_plans.tenant_id)
    OR (
      EXISTS (
        SELECT 1 FROM public.tenant_members tm
        WHERE tm.tenant_id = action_plans.tenant_id AND tm.user_id = auth.uid()
      )
      AND public.can_access_unit(action_plans.unit_id)
    )
  );

-- DELETE permanece restrito a owner/admin do tenant (sem escopo de unidade) —
-- policy original não usa is_admin()/has_perm(), não precisa de troca aqui.

-- ===========================================================================
-- action_items — leitura/escrita com escopo via plano -> unidade
-- ===========================================================================

DROP POLICY IF EXISTS "Members can read items" ON public.action_items;
CREATE POLICY "Members can read items" ON public.action_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM public.action_plans p
      WHERE p.id = action_items.plan_id
        AND public.is_admin_for_tenant(p.tenant_id)
    )
    OR EXISTS (
      SELECT 1
      FROM public.action_plans p
      JOIN public.tenant_members tm ON tm.tenant_id = p.tenant_id
      WHERE p.id = action_items.plan_id
        AND tm.user_id = auth.uid()
        AND public.can_access_unit(p.unit_id)
    )
  );

DROP POLICY IF EXISTS "Members can insert items" ON public.action_items;
CREATE POLICY "Members can insert items" ON public.action_items FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.action_plans p
      WHERE p.id = action_items.plan_id
        AND public.is_admin_for_tenant(p.tenant_id)
    )
    OR EXISTS (
      SELECT 1
      FROM public.action_plans p
      JOIN public.tenant_members tm ON tm.tenant_id = p.tenant_id
      WHERE p.id = action_items.plan_id
        AND tm.user_id = auth.uid()
        AND public.can_access_unit(p.unit_id)
    )
  );

DROP POLICY IF EXISTS "Members can update items" ON public.action_items;
CREATE POLICY "Members can update items" ON public.action_items FOR UPDATE
  USING (
    EXISTS (
      SELECT 1
      FROM public.action_plans p
      WHERE p.id = action_items.plan_id
        AND public.is_admin_for_tenant(p.tenant_id)
    )
    OR EXISTS (
      SELECT 1
      FROM public.action_plans p
      JOIN public.tenant_members tm ON tm.tenant_id = p.tenant_id
      WHERE p.id = action_items.plan_id
        AND tm.user_id = auth.uid()
        AND public.can_access_unit(p.unit_id)
    )
  );

-- DELETE permanece restrito a owner/admin do tenant (sem escopo de unidade) —
-- policy original não usa is_admin()/has_perm(), não precisa de troca aqui.
