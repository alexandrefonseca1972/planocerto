-- 086: RLS de planos/ações/histórico avaliada por conjunto, uma vez por consulta.
--
-- Antes: is_admin_for_tenant(), can_access_unit() e has_perm_for_tenant() eram chamadas por
-- LINHA de action_plans — e de novo no RLS aninhado (as políticas de action_items e
-- plan_audit_log leem action_plans, que aplica a própria política). ~0,3 ms por chamada:
-- 10–18 ms por leitura de ações, ~18 ms por UPDATE de ação.
--
-- Agora: cada função vira um conjunto (tenants onde sou admin / tenho a permissão; unidades
-- do meu escopo) calculado UMA vez por consulta em subconsulta não correlacionada.
-- Semântica idêntica por construção:
--   is_admin_for_tenant(t)          ≡ t IN (rls_admin_tenant_ids())
--   has_perm_for_tenant(perm, t)    ≡ t IN (rls_perm_tenant_ids(perm))
--   can_access_unit(u)              ≡ rls_unit_unrestricted() OR u IN (rls_scope_unit_ids())
-- (os conjuntos aplicam as próprias funções originais a cada tenant/unidade candidato).
-- As funções originais continuam existindo e são usadas por outras tabelas.

CREATE OR REPLACE FUNCTION public.rls_admin_tenant_ids()
RETURNS SETOF uuid LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT t.id FROM public.tenants t WHERE public.is_admin_for_tenant(t.id);
$$;

CREATE OR REPLACE FUNCTION public.rls_perm_tenant_ids(required_perm text)
RETURNS SETOF uuid LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT t.id FROM public.tenants t WHERE public.has_perm_for_tenant(required_perm, t.id);
$$;

-- Sem escopo de área/unidade: acesso a qualquer unidade (inclusive plano sem unidade).
CREATE OR REPLACE FUNCTION public.rls_unit_unrestricted()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT NOT public.has_scope();
$$;

-- Com escopo: unidades atribuídas + unidades das áreas atribuídas (mesma regra de can_access_unit).
CREATE OR REPLACE FUNCTION public.rls_scope_unit_ids()
RETURNS SETOF uuid LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT public.user_unit_ids()
  UNION
  SELECT u.id FROM public.units u
  WHERE u.area_id IS NOT NULL AND u.area_id IN (SELECT public.user_area_ids());
$$;

REVOKE ALL ON FUNCTION public.rls_admin_tenant_ids() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.rls_perm_tenant_ids(text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.rls_unit_unrestricted() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.rls_scope_unit_ids() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.rls_admin_tenant_ids() TO authenticated;
GRANT EXECUTE ON FUNCTION public.rls_perm_tenant_ids(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.rls_unit_unrestricted() TO authenticated;
GRANT EXECUTE ON FUNCTION public.rls_scope_unit_ids() TO authenticated;

-- ── action_plans ─────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Members can read plans" ON public.action_plans;
CREATE POLICY "Members can read plans" ON public.action_plans FOR SELECT USING (
  tenant_id IN (SELECT public.rls_admin_tenant_ids())
  OR (
    EXISTS (SELECT 1 FROM public.tenant_members tm
            WHERE tm.tenant_id = action_plans.tenant_id AND tm.user_id = (SELECT auth.uid()))
    AND ((SELECT public.rls_unit_unrestricted()) OR unit_id IN (SELECT public.rls_scope_unit_ids()))
    AND (visibility IS DISTINCT FROM 'restricted' OR user_id = (SELECT auth.uid()))
  )
);

DROP POLICY IF EXISTS "Members can insert plans" ON public.action_plans;
CREATE POLICY "Members can insert plans" ON public.action_plans FOR INSERT WITH CHECK (
  tenant_id IN (SELECT public.rls_perm_tenant_ids('plans.create'))
  AND (tenant_id IN (SELECT public.rls_admin_tenant_ids())
       OR (SELECT public.rls_unit_unrestricted()) OR unit_id IN (SELECT public.rls_scope_unit_ids()))
);

DROP POLICY IF EXISTS "Members can update plans" ON public.action_plans;
CREATE POLICY "Members can update plans" ON public.action_plans FOR UPDATE USING (
  (tenant_id IN (SELECT public.rls_perm_tenant_ids('plans.update'))
   OR (user_id = (SELECT auth.uid()) AND tenant_id IN (SELECT public.rls_perm_tenant_ids('plans.create'))))
  AND (tenant_id IN (SELECT public.rls_admin_tenant_ids())
       OR (SELECT public.rls_unit_unrestricted()) OR unit_id IN (SELECT public.rls_scope_unit_ids()))
);

DROP POLICY IF EXISTS "Tenant admins can delete plans" ON public.action_plans;
CREATE POLICY "Tenant admins can delete plans" ON public.action_plans FOR DELETE USING (
  tenant_id IN (SELECT public.rls_perm_tenant_ids('plans.delete'))
  AND (tenant_id IN (SELECT public.rls_admin_tenant_ids())
       OR (SELECT public.rls_unit_unrestricted()) OR unit_id IN (SELECT public.rls_scope_unit_ids()))
);

-- ── action_items ─────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Members can read items" ON public.action_items;
CREATE POLICY "Members can read items" ON public.action_items FOR SELECT USING (
  plan_id IN (
    SELECT p.id FROM public.action_plans p
    WHERE p.tenant_id IN (SELECT public.rls_admin_tenant_ids())
       OR (EXISTS (SELECT 1 FROM public.tenant_members tm
                   WHERE tm.tenant_id = p.tenant_id AND tm.user_id = (SELECT auth.uid()))
           AND ((SELECT public.rls_unit_unrestricted()) OR p.unit_id IN (SELECT public.rls_scope_unit_ids())))
  )
);

DROP POLICY IF EXISTS "Members can insert items" ON public.action_items;
CREATE POLICY "Members can insert items" ON public.action_items FOR INSERT WITH CHECK (
  plan_id IN (
    SELECT p.id FROM public.action_plans p
    WHERE (p.tenant_id IN (SELECT public.rls_perm_tenant_ids('plans.create'))
           OR p.tenant_id IN (SELECT public.rls_perm_tenant_ids('plans.update')))
      AND (p.tenant_id IN (SELECT public.rls_admin_tenant_ids())
           OR (SELECT public.rls_unit_unrestricted()) OR p.unit_id IN (SELECT public.rls_scope_unit_ids()))
  )
);

DROP POLICY IF EXISTS "Members can update items" ON public.action_items;
CREATE POLICY "Members can update items" ON public.action_items FOR UPDATE USING (
  plan_id IN (
    SELECT p.id FROM public.action_plans p
    WHERE (p.tenant_id IN (SELECT public.rls_perm_tenant_ids('plans.update'))
           OR (p.user_id = (SELECT auth.uid()) AND p.tenant_id IN (SELECT public.rls_perm_tenant_ids('plans.create'))))
      AND (p.tenant_id IN (SELECT public.rls_admin_tenant_ids())
           OR (SELECT public.rls_unit_unrestricted()) OR p.unit_id IN (SELECT public.rls_scope_unit_ids()))
  )
);

DROP POLICY IF EXISTS "Members can delete items" ON public.action_items;
CREATE POLICY "Members can delete items" ON public.action_items FOR DELETE USING (
  plan_id IN (
    SELECT p.id FROM public.action_plans p
    WHERE (p.tenant_id IN (SELECT public.rls_perm_tenant_ids('plans.update'))
           OR p.tenant_id IN (SELECT public.rls_perm_tenant_ids('plans.delete')))
      AND (p.tenant_id IN (SELECT public.rls_admin_tenant_ids())
           OR (SELECT public.rls_unit_unrestricted()) OR p.unit_id IN (SELECT public.rls_scope_unit_ids()))
  )
);

-- ── plan_audit_log ───────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Members can read audit logs" ON public.plan_audit_log;
CREATE POLICY "Members can read audit logs" ON public.plan_audit_log FOR SELECT USING (
  plan_id IN (
    SELECT p.id FROM public.action_plans p
    WHERE p.tenant_id IN (SELECT public.rls_admin_tenant_ids())
       OR EXISTS (SELECT 1 FROM public.tenant_members tm
                  WHERE tm.tenant_id = p.tenant_id AND tm.user_id = (SELECT auth.uid()))
  )
);

DROP POLICY IF EXISTS "Members can insert audit logs" ON public.plan_audit_log;
CREATE POLICY "Members can insert audit logs" ON public.plan_audit_log FOR INSERT WITH CHECK (
  plan_id IN (
    SELECT p.id FROM public.action_plans p
    WHERE p.tenant_id IN (SELECT public.rls_admin_tenant_ids())
       OR EXISTS (SELECT 1 FROM public.tenant_members tm
                  WHERE tm.tenant_id = p.tenant_id AND tm.user_id = (SELECT auth.uid()))
  )
);

-- REVOKE FROM PUBLIC não remove o EXECUTE que os default privileges dão ao anon.
REVOKE EXECUTE ON FUNCTION public.rls_admin_tenant_ids(), public.rls_perm_tenant_ids(text),
  public.rls_unit_unrestricted(), public.rls_scope_unit_ids() FROM anon;
