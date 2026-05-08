-- Super admin role + escopo de áreas e unidades por usuário.
--
-- 1) Adiciona o role `super_admin` ao constraint de profiles.role.
-- 2) Cria tabelas user_areas e user_units (associação usuário → áreas/unidades).
-- 3) Atualiza is_admin() para considerar super_admin.
-- 4) Cria helpers is_super_admin(), user_area_ids(), user_unit_ids().
-- 5) Promove alexandre.fonseca@live.com a super_admin (idempotente).

-- ===========================================================================
-- 1) Role super_admin
-- ===========================================================================

ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS profiles_role_check;

ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_role_check
  CHECK (role IN ('super_admin', 'admin', 'manager', 'user', 'viewer'));

-- ===========================================================================
-- 2) user_areas e user_units
-- ===========================================================================

CREATE TABLE IF NOT EXISTS public.user_areas (
  user_id    UUID NOT NULL REFERENCES auth.users(id)    ON DELETE CASCADE,
  area_id    UUID NOT NULL REFERENCES public.areas(id)  ON DELETE CASCADE,
  tenant_id  UUID          REFERENCES public.tenants(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, area_id)
);

CREATE INDEX IF NOT EXISTS idx_user_areas_user   ON public.user_areas(user_id);
CREATE INDEX IF NOT EXISTS idx_user_areas_area   ON public.user_areas(area_id);
CREATE INDEX IF NOT EXISTS idx_user_areas_tenant ON public.user_areas(tenant_id);

CREATE TABLE IF NOT EXISTS public.user_units (
  user_id    UUID NOT NULL REFERENCES auth.users(id)    ON DELETE CASCADE,
  unit_id    UUID NOT NULL REFERENCES public.units(id)  ON DELETE CASCADE,
  tenant_id  UUID          REFERENCES public.tenants(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, unit_id)
);

CREATE INDEX IF NOT EXISTS idx_user_units_user   ON public.user_units(user_id);
CREATE INDEX IF NOT EXISTS idx_user_units_unit   ON public.user_units(unit_id);
CREATE INDEX IF NOT EXISTS idx_user_units_tenant ON public.user_units(tenant_id);

-- ===========================================================================
-- 3) Funções helper
-- ===========================================================================

CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT COALESCE(
    (SELECT role = 'super_admin' FROM public.profiles WHERE id = auth.uid()),
    false
  );
$$;

-- is_admin agora também aceita super_admin (que tem todos os privilégios).
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT COALESCE(
    (SELECT role IN ('super_admin', 'admin', 'manager') FROM public.profiles WHERE id = auth.uid()),
    false
  );
$$;

-- has_perm também precisa aceitar super_admin como super-usuário.
CREATE OR REPLACE FUNCTION public.has_perm(required_perm TEXT)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
    AND (
      role IN ('super_admin', 'admin', 'manager')
      OR (permissions ? required_perm AND (permissions->>required_perm)::boolean IS TRUE)
    )
  );
$$;

-- Lista de áreas que o usuário corrente pode acessar (vazia = sem restrição).
CREATE OR REPLACE FUNCTION public.user_area_ids()
RETURNS SETOF UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT area_id FROM public.user_areas WHERE user_id = auth.uid();
$$;

-- Lista de unidades que o usuário corrente pode acessar (vazia = sem restrição).
CREATE OR REPLACE FUNCTION public.user_unit_ids()
RETURNS SETOF UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT unit_id FROM public.user_units WHERE user_id = auth.uid();
$$;

-- ===========================================================================
-- 4) RLS — só admin/super_admin gerencia; usuário lê o próprio.
-- ===========================================================================

ALTER TABLE public.user_areas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_units ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "user_areas read self"  ON public.user_areas;
DROP POLICY IF EXISTS "user_areas admin all"  ON public.user_areas;
DROP POLICY IF EXISTS "user_units read self"  ON public.user_units;
DROP POLICY IF EXISTS "user_units admin all"  ON public.user_units;

CREATE POLICY "user_areas read self" ON public.user_areas FOR SELECT
  USING (user_id = auth.uid() OR public.is_admin());

CREATE POLICY "user_areas admin all" ON public.user_areas FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "user_units read self" ON public.user_units FOR SELECT
  USING (user_id = auth.uid() OR public.is_admin());

CREATE POLICY "user_units admin all" ON public.user_units FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ===========================================================================
-- 5) Promove o super admin
-- ===========================================================================

UPDATE public.profiles p
SET    role = 'super_admin', updated_at = now()
FROM   auth.users u
WHERE  p.id = u.id
  AND  u.email = 'alexandre.fonseca@live.com';

COMMENT ON TABLE public.user_areas IS 'Escopo de áreas que cada usuário pode acessar. Vazio = sem restrição.';
COMMENT ON TABLE public.user_units IS 'Escopo de unidades que cada usuário pode acessar. Vazio = sem restrição.';
COMMENT ON FUNCTION public.is_super_admin() IS 'Verifica se o usuário corrente possui o role super_admin (gerencia tenants/empresas SaaS).';
