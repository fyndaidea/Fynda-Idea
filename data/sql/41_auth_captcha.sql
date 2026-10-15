-- Shared persistence makes ALTCHA replay protection and rate limits work across replicas.
CREATE TABLE IF NOT EXISTS public.auth_captcha_uses (
  app_key text NOT NULL,
  signature text NOT NULL,
  expires_at timestamptz NOT NULL,
  PRIMARY KEY (app_key, signature)
);
CREATE INDEX IF NOT EXISTS auth_captcha_uses_expiry ON public.auth_captcha_uses (expires_at);
CREATE TABLE IF NOT EXISTS public.auth_captcha_limits (
  app_key text NOT NULL,
  bucket text NOT NULL,
  attempts integer NOT NULL CHECK (attempts > 0),
  expires_at timestamptz NOT NULL,
  PRIMARY KEY (app_key, bucket)
);
CREATE INDEX IF NOT EXISTS auth_captcha_limits_expiry ON public.auth_captcha_limits (expires_at);
ALTER TABLE public.auth_captcha_uses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.auth_captcha_limits ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.auth_captcha_uses, public.auth_captcha_limits FROM anon, authenticated;
