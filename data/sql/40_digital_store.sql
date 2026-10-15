-- Run through the Supabase SQL editor or your migration runner before enabling the store.
-- App keys isolate catalogs even when multiple Fynda apps share a Postgres database.
CREATE TABLE IF NOT EXISTS public.store_products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), app_key text NOT NULL,
  slug text NOT NULL, title text NOT NULL, summary text NOT NULL, description text NOT NULL,
  category text NOT NULL, format text NOT NULL, amount_cents integer NOT NULL CHECK(amount_cents BETWEEN 100 AND 10000000),
  currency text NOT NULL CHECK(currency IN ('usd','cad','eur','gbp','aud')),
  published boolean NOT NULL DEFAULT false, asset_path text NOT NULL DEFAULT '',
  file_name text NOT NULL DEFAULT '', file_bytes bigint NOT NULL DEFAULT 0 CHECK(file_bytes BETWEEN 0 AND 52428800),
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(app_key,slug), UNIQUE(app_key,id),
  CHECK(NOT published OR (asset_path <> '' AND file_name <> '' AND file_bytes > 0))
);
CREATE TABLE IF NOT EXISTS public.store_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), app_key text NOT NULL,
  user_id uuid NOT NULL REFERENCES auth.users(id), product_id uuid NOT NULL,
  title text NOT NULL, amount_cents integer NOT NULL, currency text NOT NULL,
  asset_path text NOT NULL, file_name text NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','paid','failed','expired','refunded','disputed')),
  paid_at timestamptz, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(),
  FOREIGN KEY(app_key,product_id) REFERENCES public.store_products(app_key,id)
);
CREATE UNIQUE INDEX IF NOT EXISTS store_one_active_purchase ON public.store_orders(app_key,user_id,product_id) WHERE status IN ('pending','paid');
CREATE INDEX IF NOT EXISTS store_library ON public.store_orders(app_key,user_id,created_at DESC);
CREATE INDEX IF NOT EXISTS store_catalog ON public.store_products(app_key,published,created_at DESC);
ALTER TABLE public.store_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.store_orders ENABLE ROW LEVEL SECURITY;
-- No browser policies: routes expose safe DTOs, purchases require verified auth, writes require admin.
REVOKE ALL ON public.store_products, public.store_orders FROM anon, authenticated;
-- Storage is managed server-side. No browser upload/download policies are created.
INSERT INTO storage.buckets(id,name,public,file_size_limit)
VALUES ('fynda-store-downloads','fynda-store-downloads',false,52428800) ON CONFLICT(id) DO NOTHING;
-- Protect the authoritative admin role from self-service profile UPDATE policies.
-- Service-role connections / SQL editor can still assign administrator roles.
CREATE OR REPLACE FUNCTION public.store_protect_profile_role() RETURNS trigger LANGUAGE plpgsql SET search_path=public AS $$
BEGIN
  IF current_user IN ('anon','authenticated') AND
     ((TG_OP='INSERT' AND NEW.role <> 'user') OR (TG_OP='UPDATE' AND NEW.role IS DISTINCT FROM OLD.role)) THEN
    RAISE EXCEPTION 'Only administrators using a trusted server connection can assign roles';
  END IF;
  RETURN NEW;
END $$;
-- Existing apps already have profiles; Research uses the same minimal role contract.
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id), role text NOT NULL DEFAULT 'user',
  full_name text, avatar_url text, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
DROP TRIGGER IF EXISTS store_protect_profile_role ON public.profiles;
CREATE TRIGGER store_protect_profile_role BEFORE INSERT OR UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.store_protect_profile_role();
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
