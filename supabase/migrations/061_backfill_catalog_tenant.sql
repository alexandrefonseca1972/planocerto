-- Escopa o catálogo de áreas/unidades por empresa (tenant).
-- O seed da 017 cadastrou áreas/unidades antes do multi-tenant; a 027 adicionou
-- tenant_id (nullable) mas nunca preencheu. Aqui atribuímos cada registro órfão
-- (tenant_id NULL) à empresa correta e trocamos a unicidade global de "name" por
-- unicidade por empresa (padrão das migrations 032_fornecedores e 033_contas_pagar).

-- 1. Unidades sem empresa (seed legado / instalações antigas) -> empresa primária.
UPDATE public.units
  SET tenant_id = COALESCE(
    (SELECT id FROM public.tenants WHERE slug = 'planocerto' LIMIT 1),
    (SELECT id FROM public.tenants ORDER BY created_at LIMIT 1))
  WHERE tenant_id IS NULL;

-- 2. Áreas sem empresa -> a empresa dona das unidades que as referenciam
--    (em caso de empate, a empresa com mais unidades na área). Mantém área e
--    unidades sob o mesmo tenant.
UPDATE public.areas a
  SET tenant_id = sub.tenant_id
  FROM (
    SELECT DISTINCT ON (area_id) area_id, tenant_id
    FROM public.units
    WHERE area_id IS NOT NULL AND tenant_id IS NOT NULL
    GROUP BY area_id, tenant_id
    ORDER BY area_id, count(*) DESC
  ) sub
  WHERE a.id = sub.area_id AND a.tenant_id IS NULL;

-- 3. Áreas órfãs (sem unidades) -> empresa primária.
UPDATE public.areas
  SET tenant_id = COALESCE(
    (SELECT id FROM public.tenants WHERE slug = 'planocerto' LIMIT 1),
    (SELECT id FROM public.tenants ORDER BY created_at LIMIT 1))
  WHERE tenant_id IS NULL;

-- Unicidade global -> por empresa (permite que outras empresas tenham "Belém" etc.).
ALTER TABLE public.areas DROP CONSTRAINT IF EXISTS areas_name_key;
ALTER TABLE public.units DROP CONSTRAINT IF EXISTS units_name_key;

ALTER TABLE public.areas ADD CONSTRAINT areas_name_tenant_unique UNIQUE (tenant_id, name);
ALTER TABLE public.units ADD CONSTRAINT units_name_tenant_unique UNIQUE (tenant_id, name);
