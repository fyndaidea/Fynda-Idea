-- Idea categories (admin-managed). Run: psql $DATABASE_URL -f data/sql/04_categories.sql

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS public.categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  description TEXT NOT NULL DEFAULT '',
  sort_order INTEGER NOT NULL DEFAULT 0,
  published BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.categories IS 'Admin-managed categories for ideas directory';

-- Existing installs may lack description.
ALTER TABLE public.categories
  ADD COLUMN IF NOT EXISTS description TEXT NOT NULL DEFAULT '';

ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can view published categories" ON public.categories;
CREATE POLICY "Public can view published categories"
  ON public.categories FOR SELECT
  USING (published = true);

DROP POLICY IF EXISTS "Admins can manage categories" ON public.categories;
CREATE POLICY "Admins can manage categories"
  ON public.categories FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid() AND p.role = 'admin'
  ));

CREATE INDEX IF NOT EXISTS categories_sort_idx ON public.categories (sort_order, name);

INSERT INTO public.categories (name, slug, description, sort_order) VALUES
  ('SaaS', 'saas', 'Software-as-a-service and B2B platforms', 1),
  ('Marketplace', 'marketplace', 'Two-sided markets and platforms', 2),
  ('Consumer', 'consumer', 'Consumer apps and lifestyle products', 3),
  ('AI', 'ai', 'AI-native products and infrastructure', 4),
  ('Climate', 'climate', 'Climate tech and sustainability', 5),
  ('Health', 'health', 'Health, wellness, and biotech', 6),
  ('Fintech', 'fintech', 'Finance, banking, and payments', 7),
  ('Education', 'education', 'Learning, edtech, and training', 8),
  ('DevTools', 'devtools', 'Developer tools and infrastructure', 9),
  ('Other', 'other', 'Ideas that do not fit other categories', 10)
ON CONFLICT (slug) DO NOTHING;
