-- Catálogo de TIPO PA (modelo Excel APOIO coluna B).

CREATE TABLE IF NOT EXISTS public.tipos_pa (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT UNIQUE NOT NULL,
  sort_order  INT NOT NULL DEFAULT 0,
  active      BOOLEAN NOT NULL DEFAULT true,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.tipos_pa ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tipos_pa read"        ON public.tipos_pa FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "tipos_pa admin write" ON public.tipos_pa FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

INSERT INTO public.tipos_pa (name, sort_order) VALUES
  ('Graduação', 1),
  ('Pós-Graduação', 2),
  ('Cursos Técnicos', 3),
  ('High School', 4)
ON CONFLICT (name) DO NOTHING;
