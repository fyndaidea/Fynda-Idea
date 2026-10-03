-- Ideas: curated startup/product ideas.
-- Run: psql $DATABASE_URL -f data/sql/02_ideas.sql

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS public.ideas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  summary TEXT NOT NULL DEFAULT '',
  body TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published')),
  featured BOOLEAN NOT NULL DEFAULT false,
  score INTEGER NOT NULL DEFAULT 50,
  category_ids UUID[] NOT NULL DEFAULT '{}',
  tags TEXT[] NOT NULL DEFAULT '{}',
  highlights TEXT[] NOT NULL DEFAULT '{}',
  author_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.ideas IS 'Curated startup/product ideas directory';
COMMENT ON COLUMN public.ideas.status IS 'draft | published';
COMMENT ON COLUMN public.ideas.score IS '0-100 score used for recommended sorting';
COMMENT ON COLUMN public.ideas.category_ids IS 'Admin-managed category UUIDs (ordered; first = primary)';
COMMENT ON COLUMN public.ideas.tags IS 'Freeform tags for filtering and display';
COMMENT ON COLUMN public.ideas.highlights IS 'Short bullet highlights shown on cards/detail';

ALTER TABLE public.ideas ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can view published ideas" ON public.ideas;
CREATE POLICY "Public can view published ideas"
  ON public.ideas FOR SELECT
  USING (status = 'published');

DROP POLICY IF EXISTS "Admins can insert ideas" ON public.ideas;
CREATE POLICY "Admins can insert ideas"
  ON public.ideas FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid() AND p.role = 'admin'
  ));

DROP POLICY IF EXISTS "Admins can update ideas" ON public.ideas;
CREATE POLICY "Admins can update ideas"
  ON public.ideas FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid() AND p.role = 'admin'
  ));

DROP POLICY IF EXISTS "Admins can delete ideas" ON public.ideas;
CREATE POLICY "Admins can delete ideas"
  ON public.ideas FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid() AND p.role = 'admin'
  ));

-- Admins can also read drafts via service role / server Kysely; RLS SELECT for admin:
DROP POLICY IF EXISTS "Admins can view all ideas" ON public.ideas;
CREATE POLICY "Admins can view all ideas"
  ON public.ideas FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid() AND p.role = 'admin'
  ));

CREATE INDEX IF NOT EXISTS ideas_status_idx ON public.ideas (status);
CREATE INDEX IF NOT EXISTS ideas_featured_idx ON public.ideas (featured);
CREATE INDEX IF NOT EXISTS ideas_score_idx ON public.ideas (score DESC);
CREATE INDEX IF NOT EXISTS ideas_category_ids_gin_idx ON public.ideas USING GIN (category_ids);
CREATE INDEX IF NOT EXISTS ideas_tags_gin_idx ON public.ideas USING GIN (tags);
