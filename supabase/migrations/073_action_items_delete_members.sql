-- DELETE de action_items alinhado ao UPDATE: membro do tenant com acesso à
-- unidade do plano (ou admin do tenant). Sem isto, a app precisava de service
-- role para o editor conseguir apagar uma ação (incluindo cópias).

DROP POLICY IF EXISTS "Tenant admins can delete items" ON public.action_items;
DROP POLICY IF EXISTS "Members can delete items" ON public.action_items;

CREATE POLICY "Members can delete items" ON public.action_items FOR DELETE
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
