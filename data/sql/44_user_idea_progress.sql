-- Personal workflow stages, separate from the catalog's draft/published visibility.
BEGIN;
CREATE TABLE IF NOT EXISTS public.user_idea_progress (
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  idea_id uuid NOT NULL REFERENCES public.ideas(id) ON DELETE CASCADE,
  status text NOT NULL CHECK (status IN (
    'Raw', 'To Review', 'Under Review', 'Reviewed', 'Analyzed', 'Potential',
    '🔥Ready for build', 'In Progress', 'MVP / Build', 'Live / Launched', 'Paused', 'Killed', 'Archived'
  )),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, idea_id)
);
CREATE INDEX IF NOT EXISTS user_idea_progress_recent_idx ON public.user_idea_progress (user_id, updated_at DESC);
ALTER TABLE public.user_idea_progress ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users manage their own idea progress" ON public.user_idea_progress;
CREATE POLICY "Users manage their own idea progress" ON public.user_idea_progress
  FOR ALL TO authenticated USING (user_id = (SELECT auth.uid()))
  WITH CHECK (user_id = (SELECT auth.uid()));
REVOKE ALL ON public.user_idea_progress FROM anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_idea_progress TO authenticated;
COMMENT ON TABLE public.user_idea_progress IS 'Private per-user idea stages matching Idea Vault status names. No automatic Notion status writes.';
COMMIT;
