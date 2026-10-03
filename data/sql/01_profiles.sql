-- Profiles: extends Supabase auth.users with app-specific fields (role).
-- Requires: Supabase Auth (auth.users exists).
-- Run: psql $DATABASE_URL -f data/sql/01_profiles.sql

CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users (id) ON DELETE CASCADE PRIMARY KEY,
  full_name TEXT,
  avatar_url TEXT,
  role TEXT NOT NULL DEFAULT 'user',     -- 'user' | 'admin'
  favorites JSONB NOT NULL DEFAULT '{"idea":[]}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.profiles IS 'User profiles extending auth.users; includes role for admin access';
COMMENT ON COLUMN public.profiles.role IS 'user | admin';
COMMENT ON COLUMN public.profiles.favorites IS 'Saved items: { "idea": [{ id, title, subtitle, savedAt }] }';

-- Existing installs: align favorites default to idea-only shape.
ALTER TABLE public.profiles
  ALTER COLUMN favorites SET DEFAULT '{"idea":[]}'::jsonb;

-- RLS: users can read/write only their own profile row.
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Trigger: create profile row when auth.users receives a new user.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name'),
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
