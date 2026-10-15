-- Apply to each Fynda product database before accepting launch waitlist signups.
CREATE TABLE IF NOT EXISTS public.waitlist_entries (
  email TEXT PRIMARY KEY,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT waitlist_email_normalized CHECK (email = lower(trim(email)))
);
COMMENT ON TABLE public.waitlist_entries IS 'Launch waitlist only; not newsletter consent';
ALTER TABLE public.waitlist_entries ENABLE ROW LEVEL SECURITY;
-- Browser roles have no direct access. Only the server database connection inserts signups.
REVOKE ALL ON public.waitlist_entries FROM anon, authenticated;
