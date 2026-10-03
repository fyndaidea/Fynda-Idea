-- Idea submissions: public intake for idea suggestions.
-- Run: psql $DATABASE_URL -f data/sql/03_idea_submissions.sql

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS public.idea_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  summary TEXT NOT NULL DEFAULT '',
  body TEXT NOT NULL DEFAULT '',
  category TEXT NOT NULL DEFAULT '',
  tags TEXT[] NOT NULL DEFAULT '{}',
  submitter_email TEXT,
  submitter_name TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  reviewed_at TIMESTAMPTZ
);

COMMENT ON TABLE public.idea_submissions IS 'Incoming suggestions from the public submit form';
COMMENT ON COLUMN public.idea_submissions.status IS 'pending | approved | rejected';

ALTER TABLE public.idea_submissions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can insert idea submissions" ON public.idea_submissions;
CREATE POLICY "Public can insert idea submissions"
  ON public.idea_submissions FOR INSERT
  WITH CHECK (true);

DROP POLICY IF EXISTS "Admins can view idea submissions" ON public.idea_submissions;
CREATE POLICY "Admins can view idea submissions"
  ON public.idea_submissions FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid() AND p.role = 'admin'
  ));

DROP POLICY IF EXISTS "Admins can update idea submissions" ON public.idea_submissions;
CREATE POLICY "Admins can update idea submissions"
  ON public.idea_submissions FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid() AND p.role = 'admin'
  ));

DROP POLICY IF EXISTS "Admins can delete idea submissions" ON public.idea_submissions;
CREATE POLICY "Admins can delete idea submissions"
  ON public.idea_submissions FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid() AND p.role = 'admin'
  ));

CREATE INDEX IF NOT EXISTS idea_submissions_status_idx ON public.idea_submissions (status);
CREATE INDEX IF NOT EXISTS idea_submissions_created_at_idx ON public.idea_submissions (created_at DESC);
