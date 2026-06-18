-- Aplica o escopo de acesso por usuário (user_units / user_areas) no RLS.
--
-- Até aqui o escopo só era aplicado na UI (Dashboard/Planos). As policies de
-- leitura de `units`, `areas`, `action_plans` e `action_items` filtravam apenas
-- por `tenant_id`, então um usuário restrito a algumas unidades ainda conseguia
-- ler dados de outras unidades da mesma empresa via chamada direta de API/URL.
--
-- Semântica (igual à da UI):
--   • Escopo vazio (sem linhas em user_units E user_areas) = SEM restrição.
--   • Caso contrário, UNIÃO: o usuário acessa uma unidade se ela estiver
--     liberada explicitamente (user_units) OU se sua área estiver liberada
--     (user_areas).
--   • is_admin() (super_admin/admin/manager) sempre ignora o escopo.
--
-- Observação: planos sem unidade (action_plans.unit_id IS NULL) ficam invisíveis
-- para usuários COM escopo — comportamento conservador e seguro. Hoje todos os
-- planos possuem unit_id; admins/usuários sem escopo não são afetados.

-- ===========================================================================
-- 1) Funções auxiliares de escopo
-- ===========================================================================

-- O usuário corrente possui alguma restrição de escopo?
CREATE OR REPLACE FUNCTION public.has_scope()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_units WHERE user_id = auth.uid())
      OR EXISTS (SELECT 1 FROM public.user_areas WHERE user_id = auth.uid());
$$;

-- O usuário corrente pode acessar a unidade informada?
CREATE OR REPLACE FUNCTION public.can_access_unit(p_unit_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT
    NOT public.has_scope()
    OR p_unit_id IN (SELECT public.user_unit_ids())
    OR EXISTS (
      SELECT 1 FROM public.units u
      WHERE u.id = p_unit_id
        AND u.area_id IS NOT NULL
        AND u.area_id IN (SELECT public.user_area_ids())
    );
$$;

-- O usuário corrente pode enxergar a área informada?
-- (área liberada diretamente OU área que contém alguma unidade liberada)
CREATE OR REPLACE FUNCTION public.can_access_area(p_area_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT
    NOT public.has_scope()
    OR p_area_id IN (SELECT public.user_area_ids())
    OR EXISTS (
      SELECT 1 FROM public.units u
      WHERE u.area_id = p_area_id
        AND u.id IN (SELECT public.user_unit_ids())
    );
$$;

-- ===========================================================================
-- 2) units — leitura com escopo
-- ===========================================================================

DROP POLICY IF EXISTS "units read tenant" ON public.units;
CREATE POLICY "units read tenant" ON public.units FOR SELECT
  USING (
    is_admin()
    OR (
      (
        tenant_id IS NULL
        OR EXISTS (
          SELECT 1 FROM public.tenant_members tm
          WHERE tm.tenant_id = units.tenant_id AND tm.user_id = auth.uid()
        )
      )
      AND public.can_access_unit(units.id)
    )
  );

-- ===========================================================================
-- 3) areas — leitura com escopo
-- ===========================================================================

DROP POLICY IF EXISTS "areas read tenant" ON public.areas;
CREATE POLICY "areas read tenant" ON public.areas FOR SELECT
  USING (
    is_admin()
    OR (
      (
        tenant_id IS NULL
        OR EXISTS (
          SELECT 1 FROM public.tenant_members tm
          WHERE tm.tenant_id = areas.tenant_id AND tm.user_id = auth.uid()
        )
      )
      AND public.can_access_area(areas.id)
    )
  );

-- ===========================================================================
-- 4) action_plans — leitura/escrita com escopo de unidade
-- ===========================================================================

DROP POLICY IF EXISTS "Members can read plans" ON public.action_plans;
CREATE POLICY "Members can read plans" ON public.action_plans FOR SELECT
  USING (
    is_admin()
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
    is_admin()
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
    is_admin()
    OR (
      EXISTS (
        SELECT 1 FROM public.tenant_members tm
        WHERE tm.tenant_id = action_plans.tenant_id AND tm.user_id = auth.uid()
      )
      AND public.can_access_unit(action_plans.unit_id)
    )
  );

-- DELETE permanece restrito a owner/admin do tenant (sem escopo de unidade).

-- ===========================================================================
-- 5) action_items — leitura/escrita com escopo via plano → unidade
-- ===========================================================================

DROP POLICY IF EXISTS "Members can read items" ON public.action_items;
CREATE POLICY "Members can read items" ON public.action_items FOR SELECT
  USING (
    is_admin()
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
    is_admin()
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
    is_admin()
    OR EXISTS (
      SELECT 1
      FROM public.action_plans p
      JOIN public.tenant_members tm ON tm.tenant_id = p.tenant_id
      WHERE p.id = action_items.plan_id
        AND tm.user_id = auth.uid()
        AND public.can_access_unit(p.unit_id)
    )
  );

-- DELETE permanece restrito a owner/admin do tenant (sem escopo de unidade).
