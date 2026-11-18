-- Achado #11 (ACHADOS-AUDITORIA.md): visibility = 'restricted' existia na
-- tabela e na interface, mas as policies ignoravam o campo.
-- Regra: plano restrito só aparece para quem o criou (user_id) e para
-- admin/manager da empresa. Itens, anexos, comentários e histórico seguem
-- o plano, porque suas policies consultam action_plans sob RLS.
-- O link público (/s/[token]) continua valendo: é concessão explícita.

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
      AND (visibility IS DISTINCT FROM 'restricted' OR user_id = (SELECT auth.uid()))
    )
  );

COMMENT ON COLUMN public.action_plans.visibility IS
  'public: todos da empresa com acesso à unidade. restricted: só o criador (user_id) e admin/manager da empresa.';
