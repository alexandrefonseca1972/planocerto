-- Empresas (tenants) ficam 1 nível acima de Áreas e Unidades.
-- Adiciona tenant_id em ambas as tabelas. Mantém nullable para permitir
-- migração de dados existentes; um seed posterior preenche todas as linhas.

ALTER TABLE public.areas
  ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE;

ALTER TABLE public.units
  ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_areas_tenant ON public.areas(tenant_id);
CREATE INDEX IF NOT EXISTS idx_units_tenant ON public.units(tenant_id);

-- Atualiza políticas RLS para escopar por tenant (mantém leitura global por
-- compatibilidade — admin/teste — mas escrita exige pertencer ao tenant).
DROP POLICY IF EXISTS "areas read"        ON public.areas;
DROP POLICY IF EXISTS "areas admin write" ON public.areas;
DROP POLICY IF EXISTS "units read"        ON public.units;
DROP POLICY IF EXISTS "units admin write" ON public.units;

-- Áreas
CREATE POLICY "areas read tenant" ON public.areas FOR SELECT
  USING (
    tenant_id IS NULL
    OR public.is_admin()
    OR EXISTS (
      SELECT 1 FROM public.tenant_members
      WHERE tenant_id = areas.tenant_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "areas write admin" ON public.areas FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Unidades
CREATE POLICY "units read tenant" ON public.units FOR SELECT
  USING (
    tenant_id IS NULL
    OR public.is_admin()
    OR EXISTS (
      SELECT 1 FROM public.tenant_members
      WHERE tenant_id = units.tenant_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "units write admin" ON public.units FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());
