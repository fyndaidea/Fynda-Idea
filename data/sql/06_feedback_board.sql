-- Feedback board + roadmap + release notes
-- Requires: 01_profiles.sql
-- Run: psql $DATABASE_URL -f data/sql/06_feedback_board.sql

-- Feedback posts (publicly visible, created by authenticated users)
CREATE TABLE IF NOT EXISTS public.feedback_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles (id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT,
  status TEXT NOT NULL DEFAULT 'open', -- open | under_review | planned | in_progress | shipped | closed
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS feedback_posts_created_at_idx ON public.feedback_posts (created_at DESC);
CREATE INDEX IF NOT EXISTS feedback_posts_status_idx ON public.feedback_posts (status);
CREATE INDEX IF NOT EXISTS feedback_posts_user_id_idx ON public.feedback_posts (user_id);

-- Per-user votes (one vote per post per user)
CREATE TABLE IF NOT EXISTS public.feedback_votes (
  post_id UUID NOT NULL REFERENCES public.feedback_posts (id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (post_id, user_id)
);

CREATE INDEX IF NOT EXISTS feedback_votes_user_id_idx ON public.feedback_votes (user_id);

-- Roadmap items (publicly visible; only admins should mutate via API)
CREATE TABLE IF NOT EXISTS public.roadmap_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'planned', -- planned | in_progress | shipped
  target_date DATE,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS roadmap_items_status_sort_idx ON public.roadmap_items (status, sort_order, created_at DESC);

-- Release notes (publicly visible; only admins should mutate via API)
CREATE TABLE IF NOT EXISTS public.release_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  body_md TEXT NOT NULL,
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS release_notes_published_at_idx ON public.release_notes (published_at DESC NULLS LAST);

-- RLS (optional). The app uses server-side Kysely for writes, but these policies
-- keep tables safe if someone later enables client-side Supabase access.
ALTER TABLE public.feedback_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feedback_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.roadmap_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.release_notes ENABLE ROW LEVEL SECURITY;

-- Feedback posts: anyone can read; only owner can insert/update/delete own.
DROP POLICY IF EXISTS "Feedback posts are readable by everyone" ON public.feedback_posts;
CREATE POLICY "Feedback posts are readable by everyone"
  ON public.feedback_posts FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Users can create feedback posts" ON public.feedback_posts;
CREATE POLICY "Users can create feedback posts"
  ON public.feedback_posts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own feedback posts" ON public.feedback_posts;
CREATE POLICY "Users can update own feedback posts"
  ON public.feedback_posts FOR UPDATE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own feedback posts" ON public.feedback_posts;
CREATE POLICY "Users can delete own feedback posts"
  ON public.feedback_posts FOR DELETE
  USING (auth.uid() = user_id);

-- Votes: anyone can read; users can vote/unvote for themselves only.
DROP POLICY IF EXISTS "Feedback votes are readable by everyone" ON public.feedback_votes;
CREATE POLICY "Feedback votes are readable by everyone"
  ON public.feedback_votes FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Users can vote for themselves" ON public.feedback_votes;
CREATE POLICY "Users can vote for themselves"
  ON public.feedback_votes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can unvote for themselves" ON public.feedback_votes;
CREATE POLICY "Users can unvote for themselves"
  ON public.feedback_votes FOR DELETE
  USING (auth.uid() = user_id);

-- Roadmap + release notes: readable by everyone.
DROP POLICY IF EXISTS "Roadmap is readable by everyone" ON public.roadmap_items;
CREATE POLICY "Roadmap is readable by everyone"
  ON public.roadmap_items FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Release notes are readable by everyone" ON public.release_notes;
CREATE POLICY "Release notes are readable by everyone"
  ON public.release_notes FOR SELECT
  USING (true);
