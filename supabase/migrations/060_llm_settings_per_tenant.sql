-- Torna llm_settings por-tenant: cada empresa tem sua própria configuração de IA.
-- Apaga a linha singleton criada em 059 (era placeholder sem tenant).
DELETE FROM public.llm_settings;

ALTER TABLE public.llm_settings
  ADD COLUMN tenant_id uuid REFERENCES public.tenants(id) ON DELETE CASCADE;

ALTER TABLE public.llm_settings
  ALTER COLUMN tenant_id SET NOT NULL;

ALTER TABLE public.llm_settings
  ADD CONSTRAINT llm_settings_tenant_id_key UNIQUE (tenant_id);
