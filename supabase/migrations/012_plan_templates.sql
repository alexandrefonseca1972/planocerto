-- Migration: Plan templates for 5W2H action plans
CREATE TABLE IF NOT EXISTS public.plan_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  title TEXT NOT NULL DEFAULT '',
  unit TEXT DEFAULT '',
  director TEXT DEFAULT '',
  goal TEXT DEFAULT '',
  is_system BOOLEAN NOT NULL DEFAULT false,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.plan_template_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID NOT NULL REFERENCES public.plan_templates(id) ON DELETE CASCADE,
  number TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  parent_id UUID REFERENCES public.plan_template_items(id) ON DELETE SET NULL,
  action TEXT NOT NULL DEFAULT '',
  why TEXT DEFAULT '',
  where_field TEXT DEFAULT '',
  responsible TEXT DEFAULT '',
  cost TEXT DEFAULT '',
  expected_result TEXT DEFAULT ''
);

ALTER TABLE public.plan_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plan_template_items ENABLE ROW LEVEL SECURITY;

-- Templates visible to all authenticated users
CREATE POLICY "Authenticated users can read templates"
  ON public.plan_templates FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can read template items"
  ON public.plan_template_items FOR SELECT
  USING (auth.role() = 'authenticated');

-- Only admins can manage templates
CREATE POLICY "Admins can manage templates"
  ON public.plan_templates FOR ALL
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "Admins can manage template items"
  ON public.plan_template_items FOR ALL
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));
