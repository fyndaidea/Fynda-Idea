-- Curated idea collections. Run: psql $DATABASE_URL -f data/sql/05_collections.sql

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS public.collections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT NOT NULL DEFAULT '',
  published BOOLEAN NOT NULL DEFAULT false,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.collection_ideas (
  collection_id UUID NOT NULL REFERENCES public.collections (id) ON DELETE CASCADE,
  idea_slug TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (collection_id, idea_slug)
);

COMMENT ON TABLE public.collections IS 'Curated lists of ideas';
COMMENT ON TABLE public.collection_ideas IS 'Ideas belonging to a collection, ordered by sort_order';

ALTER TABLE public.collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.collection_ideas ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can view published collections" ON public.collections;
CREATE POLICY "Public can view published collections"
  ON public.collections FOR SELECT
  USING (published = true);

DROP POLICY IF EXISTS "Public can view ideas in published collections" ON public.collection_ideas;
CREATE POLICY "Public can view ideas in published collections"
  ON public.collection_ideas FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.collections c
    WHERE c.id = collection_id AND c.published = true
  ));

DROP POLICY IF EXISTS "Admins can manage collections" ON public.collections;
CREATE POLICY "Admins can manage collections"
  ON public.collections FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid() AND p.role = 'admin'
  ));

DROP POLICY IF EXISTS "Admins can manage collection ideas" ON public.collection_ideas;
CREATE POLICY "Admins can manage collection ideas"
  ON public.collection_ideas FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid() AND p.role = 'admin'
  ));

CREATE INDEX IF NOT EXISTS collections_published_sort_idx ON public.collections (published, sort_order, updated_at DESC);
CREATE INDEX IF NOT EXISTS collection_ideas_slug_idx ON public.collection_ideas (idea_slug);
