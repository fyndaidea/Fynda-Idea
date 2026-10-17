-- Existing catalog starts as synchronized; new ideas and content edits enter the queue.
BEGIN;
ALTER TABLE public.ideas
  ADD COLUMN IF NOT EXISTS content_revision integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS notion_synced_revision integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS notion_synced_at timestamptz;
ALTER TABLE public.ideas ALTER COLUMN content_revision SET DEFAULT 1;

CREATE OR REPLACE FUNCTION public.track_idea_content_revision()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF ROW(NEW.title, NEW.slug, NEW.summary, NEW.body, NEW.status, NEW.featured,
         NEW.score, NEW.category_ids, NEW.tags, NEW.highlights, NEW.author_name)
     IS DISTINCT FROM
     ROW(OLD.title, OLD.slug, OLD.summary, OLD.body, OLD.status, OLD.featured,
         OLD.score, OLD.category_ids, OLD.tags, OLD.highlights, OLD.author_name) THEN
    NEW.content_revision := OLD.content_revision + 1;
    NEW.updated_at := clock_timestamp();
  ELSE
    NEW.content_revision := OLD.content_revision;
  END IF;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS ideas_content_revision ON public.ideas;
CREATE TRIGGER ideas_content_revision BEFORE UPDATE ON public.ideas
  FOR EACH ROW EXECUTE FUNCTION public.track_idea_content_revision();
CREATE INDEX IF NOT EXISTS ideas_pending_notion_sync_idx ON public.ideas (updated_at DESC, id)
  WHERE content_revision > notion_synced_revision;
COMMIT;
