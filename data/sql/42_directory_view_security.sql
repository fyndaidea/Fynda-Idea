-- Legacy directory views must respect the caller's base-table RLS.
-- Requires PostgreSQL 15+ when either view exists. Safe to reapply.
-- Public reads retain the published-only policies on companies / people;
-- writes go through the existing authenticated admin server routes.
DO $migration$
DECLARE
  view_name text;
  relation_kind "char";
BEGIN
  FOREACH view_name IN ARRAY ARRAY['agencies', 'influencers'] LOOP
    SELECT c.relkind INTO relation_kind
    FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public' AND c.relname = view_name;

    IF relation_kind IS NULL THEN
      CONTINUE; -- Current installations use companies / people directly.
    END IF;
    IF relation_kind <> 'v' THEN
      RAISE EXCEPTION 'Expected public.% to be a view; review its policies manually', view_name;
    END IF;
    IF current_setting('server_version_num')::integer < 150000 THEN
      RAISE EXCEPTION 'Directory view security requires PostgreSQL 15 or later';
    END IF;

    EXECUTE format('ALTER VIEW public.%I SET (security_invoker = true)', view_name);
    EXECUTE format('REVOKE ALL PRIVILEGES ON public.%I FROM PUBLIC, anon, authenticated', view_name);
    EXECUTE format('GRANT SELECT ON public.%I TO anon, authenticated', view_name);
  END LOOP;
END
$migration$;
