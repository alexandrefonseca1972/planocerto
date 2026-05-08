-- Catálogo de domínios extraídos da aba APOIO do modelo Excel.
-- Compartilhados entre módulos (PA, Schools, Companies, Simulator).

CREATE TABLE IF NOT EXISTS public.areas (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT UNIQUE NOT NULL,
  sort_order  INT NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.units (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  area_id     UUID REFERENCES public.areas(id) ON DELETE SET NULL,
  name        TEXT UNIQUE NOT NULL,
  uf          TEXT NOT NULL DEFAULT '',
  sort_order  INT NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.macro_acoes (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT UNIQUE NOT NULL,
  sort_order  INT NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Canais do funil (Empresa, Escola, Site, ...) usados em SIMULADOR.
CREATE TABLE IF NOT EXISTS public.channels (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT UNIQUE NOT NULL,
  sort_order  INT NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Catálogos são compartilhados (read-all). Escrita apenas por admin.
ALTER TABLE public.areas       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.units       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.macro_acoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.channels    ENABLE ROW LEVEL SECURITY;

CREATE POLICY "areas read"  ON public.areas       FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "units read"  ON public.units       FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "macro read"  ON public.macro_acoes FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "chan read"   ON public.channels    FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "areas admin write" ON public.areas       FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "units admin write" ON public.units       FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "macro admin write" ON public.macro_acoes FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "chan admin write"  ON public.channels    FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

-- Seed: áreas
INSERT INTO public.areas (name, sort_order) VALUES
  ('Pará-Amapá', 1), ('Amazônia', 2), ('Cerrado', 3), ('Sul', 4)
ON CONFLICT (name) DO NOTHING;

-- Seed: unidades (com área e UF)
INSERT INTO public.units (area_id, name, uf, sort_order) VALUES
  ((SELECT id FROM public.areas WHERE name='Pará-Amapá'), 'Ananindeua',       'PA', 1),
  ((SELECT id FROM public.areas WHERE name='Pará-Amapá'), 'Belém',            'PA', 2),
  ((SELECT id FROM public.areas WHERE name='Amazônia'),   'Boa Vista',        'RR', 3),
  ((SELECT id FROM public.areas WHERE name='Cerrado'),    'Brasília',         'DF', 4),
  ((SELECT id FROM public.areas WHERE name='Cerrado'),    'Cáceres',          'MT', 5),
  ((SELECT id FROM public.areas WHERE name='Sul'),        'Campo Grande',     'MS', 6),
  ((SELECT id FROM public.areas WHERE name='Pará-Amapá'), 'Castanhal',        'PA', 7),
  ((SELECT id FROM public.areas WHERE name='Sul'),        'Curitiba',         'PR', 8),
  ((SELECT id FROM public.areas WHERE name='Sul'),        'Florianópolis',    'SC', 9),
  ((SELECT id FROM public.areas WHERE name='Cerrado'),    'Goiânia',          'GO', 10),
  ((SELECT id FROM public.areas WHERE name='Amazônia'),   'Ji-Paraná',        'RO', 11),
  ((SELECT id FROM public.areas WHERE name='Sul'),        'Londrina',         'PR', 12),
  ((SELECT id FROM public.areas WHERE name='Pará-Amapá'), 'Macapá',           'AP', 13),
  ((SELECT id FROM public.areas WHERE name='Pará-Amapá'), 'Macapá - SEAMA',   'AP', 14),
  ((SELECT id FROM public.areas WHERE name='Amazônia'),   'Manaus',           'AM', 15),
  ((SELECT id FROM public.areas WHERE name='Amazônia'),   'Pimenta Bueno',    'RO', 16),
  ((SELECT id FROM public.areas WHERE name='Sul'),        'Porto Alegre',     'RS', 17),
  ((SELECT id FROM public.areas WHERE name='Amazônia'),   'Rio Branco',       'AC', 18),
  ((SELECT id FROM public.areas WHERE name='Amazônia'),   'Rolim de Moura',   'RO', 19),
  ((SELECT id FROM public.areas WHERE name='Sul'),        'São José',         'SC', 20)
ON CONFLICT (name) DO NOTHING;

-- Seed: macro-ações (33)
INSERT INTO public.macro_acoes (name, sort_order) VALUES
  ('Afiliados', 1), ('Alimentação', 2), ('Brindes', 3), ('Call Center', 4),
  ('Conversão Funil', 5), ('Demais Canais', 6), ('Empresa - Ação', 7),
  ('Empresa - Ação Virtual', 8), ('Empresa - Visita', 9),
  ('Empresa - Visita Virtual', 10), ('Enem', 11), ('Escola - Ação', 12),
  ('Escola - Ação Virtual', 13), ('Escola - Visita', 14),
  ('Escola - Visita Virtual', 15), ('Eventos', 16), ('Feira de Profissões', 17),
  ('Financiamentos', 18), ('Marketplace', 19), ('Materiais de Apoio', 20),
  ('Parceiros Digitais', 21), ('Patrocínio', 22), ('Polo PDV', 23),
  ('Promotores', 24), ('Redes Sociais', 25), ('Representantes', 26),
  ('Sala de Matrícula', 27), ('Serviços Gráficos', 28), ('Site', 29),
  ('Trade', 30), ('Tráfego Pago', 31)
ON CONFLICT (name) DO NOTHING;

-- Seed: canais do funil (17)
INSERT INTO public.channels (name, sort_order) VALUES
  ('Empresa', 1), ('Escola', 2), ('Feira de Profissões', 3), ('Lead Enem', 4),
  ('Trade', 5), ('Força de Vendas', 6), ('Comunidade', 7), ('Sala de Matrícula', 8),
  ('Site', 9), ('Call Center', 10), ('Afiliados', 11), ('Marketplace', 12),
  ('Parceiros Digitais', 13), ('PDV Polo', 14), ('Representantes', 15)
ON CONFLICT (name) DO NOTHING;
