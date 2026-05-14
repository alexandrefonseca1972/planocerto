-- FASE 1: Metadados Regionais (Infraestrutura)
ALTER TABLE public.units 
  ADD COLUMN IF NOT EXISTS regional_context JSONB DEFAULT '{}';

ALTER TABLE public.areas 
  ADD COLUMN IF NOT EXISTS regional_context JSONB DEFAULT '{}';

-- Comentários para documentação
COMMENT ON COLUMN public.units.regional_context IS 'Metadados contextuais da região: perfil_persona, eventos_locais, concorrentes, sazonalidade.';
COMMENT ON COLUMN public.areas.regional_context IS 'Metadados contextuais da área: comportamento de mercado regional, KPIs históricos da região.';

-- FASE 2: Segmentação da Base de Conhecimento
ALTER TABLE public.knowledge_base 
  ADD COLUMN IF NOT EXISTS unit_id UUID REFERENCES public.units(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS area_id UUID REFERENCES public.areas(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_knowledge_base_unit ON public.knowledge_base(unit_id);
CREATE INDEX IF NOT EXISTS idx_knowledge_base_area ON public.knowledge_base(area_id);
