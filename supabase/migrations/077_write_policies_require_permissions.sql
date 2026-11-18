-- Achado #3 (ACHADOS-AUDITORIA.md): as policies de escrita de planos, itens e
-- financeiro autorizavam por participação na empresa, sem as permissões que
-- as Server Actions exigem. Um viewer gravava direto pelo PostgREST.
--
-- 1) role_has_perm(): espelho SQL de ROLES em src/lib/permissions.ts (papéis
--    embutidos) + tabela `roles` (papéis customizados). Manter em sincronia;
--    src/__tests__/lib/role-perms-sql-parity.test.ts compara as duas listas.
-- 2) has_perm_for_tenant(): passa a espelhar hasPermission() do app. Override
--    individual (profiles.permissions) vence o papel, inclusive negando.
--    Exige vínculo com a empresa (076), exceto super_admin.
-- 3) Policies de escrita exigem a mesma permissão que a action correspondente.
--    Leitura não muda. Escopo de unidade mantido (admin da empresa ignora).
--
-- Exceção deliberada: plans.create permite UPDATE em plano criado pelo próprio
-- usuário (action_plans.user_id) e nos seus itens. As actions de cópia e
-- importação criam o plano e depois ajustam parent_id/updated_at só com
-- plans.create.

CREATE OR REPLACE FUNCTION public.role_has_perm(p_role text, p_perm text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT CASE p_role
    WHEN 'super_admin' THEN true
    WHEN 'admin'       THEN true
    WHEN 'manager'     THEN p_perm <> ALL (ARRAY['users.delete', 'tenants.delete', 'settings.manage'])
    WHEN 'user'        THEN p_perm = ANY (ARRAY['plans.create', 'plans.read', 'plans.update', 'finance.read', 'competitor.read'])
    WHEN 'viewer'      THEN p_perm = ANY (ARRAY['plans.read', 'reports.view', 'finance.read', 'competitor.read'])
    ELSE COALESCE((SELECT (r.permissions -> p_perm) = 'true'::jsonb FROM public.roles r WHERE r.name = p_role), false)
  END;
$$;

CREATE OR REPLACE FUNCTION public.has_perm_for_tenant(required_perm text, p_tenant_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT CASE
    WHEN er.role IS NULL THEN false
    WHEN p.permissions ? required_perm THEN (p.permissions -> required_perm) = 'true'::jsonb
    ELSE public.role_has_perm(er.role, required_perm)
  END
  FROM (SELECT public.effective_role_for_tenant(auth.uid(), p_tenant_id) AS role) er
  LEFT JOIN public.profiles p ON p.id = auth.uid();
$$;

COMMENT ON FUNCTION public.has_perm_for_tenant(text, uuid) IS
  'Espelho de hasPermission() (src/lib/permissions.ts) no papel efetivo da empresa: override individual vence o papel.';

-- ===========================================================================
-- action_plans
-- ===========================================================================
DROP POLICY IF EXISTS "Members can insert plans" ON public.action_plans;
CREATE POLICY "Members can insert plans" ON public.action_plans FOR INSERT
  WITH CHECK (
    public.has_perm_for_tenant('plans.create', tenant_id)
    AND (public.is_admin_for_tenant(tenant_id) OR public.can_access_unit(unit_id))
  );

DROP POLICY IF EXISTS "Members can update plans" ON public.action_plans;
CREATE POLICY "Members can update plans" ON public.action_plans FOR UPDATE
  USING (
    (
      public.has_perm_for_tenant('plans.update', tenant_id)
      OR (user_id = (SELECT auth.uid()) AND public.has_perm_for_tenant('plans.create', tenant_id))
    )
    AND (public.is_admin_for_tenant(tenant_id) OR public.can_access_unit(unit_id))
  );

DROP POLICY IF EXISTS "Tenant admins can delete plans" ON public.action_plans;
CREATE POLICY "Tenant admins can delete plans" ON public.action_plans FOR DELETE
  USING (
    public.has_perm_for_tenant('plans.delete', tenant_id)
    AND (public.is_admin_for_tenant(tenant_id) OR public.can_access_unit(unit_id))
  );

-- ===========================================================================
-- action_items — conjunto de planos calculado uma vez por statement (074)
-- ===========================================================================
DROP POLICY IF EXISTS "Members can insert items" ON public.action_items;
CREATE POLICY "Members can insert items" ON public.action_items FOR INSERT
  WITH CHECK (
    plan_id IN (
      SELECT p.id FROM public.action_plans p
      WHERE (public.has_perm_for_tenant('plans.create', p.tenant_id)
             OR public.has_perm_for_tenant('plans.update', p.tenant_id))
        AND (public.is_admin_for_tenant(p.tenant_id) OR public.can_access_unit(p.unit_id))
    )
  );

DROP POLICY IF EXISTS "Members can update items" ON public.action_items;
CREATE POLICY "Members can update items" ON public.action_items FOR UPDATE
  USING (
    plan_id IN (
      SELECT p.id FROM public.action_plans p
      WHERE (
              public.has_perm_for_tenant('plans.update', p.tenant_id)
              OR (p.user_id = (SELECT auth.uid()) AND public.has_perm_for_tenant('plans.create', p.tenant_id))
            )
        AND (public.is_admin_for_tenant(p.tenant_id) OR public.can_access_unit(p.unit_id))
    )
  );

-- deleteItem aceita plans.update ou plans.delete (action-plan.ts).
DROP POLICY IF EXISTS "Members can delete items" ON public.action_items;
CREATE POLICY "Members can delete items" ON public.action_items FOR DELETE
  USING (
    plan_id IN (
      SELECT p.id FROM public.action_plans p
      WHERE (public.has_perm_for_tenant('plans.update', p.tenant_id)
             OR public.has_perm_for_tenant('plans.delete', p.tenant_id))
        AND (public.is_admin_for_tenant(p.tenant_id) OR public.can_access_unit(p.unit_id))
    )
  );

-- ===========================================================================
-- contas_pagar
-- ===========================================================================
DROP POLICY IF EXISTS "contas_pagar insert" ON public.contas_pagar;
CREATE POLICY "contas_pagar insert" ON public.contas_pagar FOR INSERT
  WITH CHECK (public.has_perm_for_tenant('finance.create', tenant_id));

DROP POLICY IF EXISTS "contas_pagar update" ON public.contas_pagar;
CREATE POLICY "contas_pagar update" ON public.contas_pagar FOR UPDATE
  USING (public.has_perm_for_tenant('finance.update', tenant_id))
  WITH CHECK (public.has_perm_for_tenant('finance.update', tenant_id));

DROP POLICY IF EXISTS "contas_pagar delete" ON public.contas_pagar;
CREATE POLICY "contas_pagar delete" ON public.contas_pagar FOR DELETE
  USING (public.has_perm_for_tenant('finance.delete', tenant_id));

-- ===========================================================================
-- parcelas_pagar — create_conta_with_parcelas insere (finance.create);
-- update_conta_with_parcelas apaga e recria (finance.update). Exclusão da
-- conta remove parcelas por ON DELETE CASCADE, que não passa por RLS.
-- ===========================================================================
DROP POLICY IF EXISTS "parcelas insert" ON public.parcelas_pagar;
CREATE POLICY "parcelas insert" ON public.parcelas_pagar FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.contas_pagar c
      WHERE c.id = parcelas_pagar.conta_id
        AND (public.has_perm_for_tenant('finance.create', c.tenant_id)
             OR public.has_perm_for_tenant('finance.update', c.tenant_id))
    )
  );

DROP POLICY IF EXISTS "parcelas update" ON public.parcelas_pagar;
CREATE POLICY "parcelas update" ON public.parcelas_pagar FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.contas_pagar c
      WHERE c.id = parcelas_pagar.conta_id AND public.has_perm_for_tenant('finance.update', c.tenant_id)
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.contas_pagar c
      WHERE c.id = parcelas_pagar.conta_id AND public.has_perm_for_tenant('finance.update', c.tenant_id)
    )
  );

DROP POLICY IF EXISTS "parcelas delete" ON public.parcelas_pagar;
CREATE POLICY "parcelas delete" ON public.parcelas_pagar FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.contas_pagar c
      WHERE c.id = parcelas_pagar.conta_id AND public.has_perm_for_tenant('finance.update', c.tenant_id)
    )
  );

-- ===========================================================================
-- conta_attachments — upload e exclusão exigem finance.update (contas-pagar.ts)
-- ===========================================================================
DROP POLICY IF EXISTS "conta_attachments insert" ON public.conta_attachments;
CREATE POLICY "conta_attachments insert" ON public.conta_attachments FOR INSERT
  WITH CHECK (
    uploaded_by = (SELECT auth.uid())
    AND EXISTS (
      SELECT 1 FROM public.contas_pagar c
      WHERE c.id = conta_attachments.conta_id AND public.has_perm_for_tenant('finance.update', c.tenant_id)
    )
  );

DROP POLICY IF EXISTS "conta_attachments delete" ON public.conta_attachments;
CREATE POLICY "conta_attachments delete" ON public.conta_attachments FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.contas_pagar c
      WHERE c.id = conta_attachments.conta_id AND public.has_perm_for_tenant('finance.update', c.tenant_id)
    )
  );
