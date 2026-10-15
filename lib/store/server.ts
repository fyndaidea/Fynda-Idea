import 'server-only';
import { createClient as createStorageClient } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/server';
import { canUseAuthSession } from '@/lib/auth/social-login';
import { getSupabaseUrl, isSupabaseConfigured } from '@/lib/supabase/env';
import { query } from './db';
import { STORE_APP_KEY, STORE_PRIVATE_BUCKET } from './config';
import { StoreError, assertOrigin, validSiteUrl, assertPrivateBucket, assertAssetPath } from './policy';
export async function storeUser(admin = false) {
  if (!isSupabaseConfigured()) throw new StoreError('Sign-in is being set up. Please check back soon.', 503);
  const client = await createClient();
  const { data: { user }, error } = await client.auth.getUser();
  if (error || !user || !(await canUseAuthSession(client, user))) throw new StoreError('Please sign in to continue.', 401);
  if (admin) {
    const [profile] = await query<{ role: string }>('SELECT role FROM profiles WHERE id=$1', [user.id]);
    if (profile?.role !== 'admin') throw new StoreError('Administrator access is required.', 403);
  }
  return user;
}
export function siteUrl(request: Request) {
  const configured = process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_APP_URL;
  return configured ? validSiteUrl(configured, process.env.NODE_ENV === 'production') : new URL(request.url).origin;
}
export function checkOrigin(request: Request) { assertOrigin(request.headers.get('origin'), siteUrl(request)); }
export function errorResponse(error: unknown) {
  return Response.json({ error: error instanceof StoreError ? error.message : 'The store could not complete this request. Please try again.' }, { status: error instanceof StoreError ? error.status : 503, headers: { 'Cache-Control': 'private, no-store' } });
}
export async function privateStorage() {
  const bucket = STORE_PRIVATE_BUCKET;
  const key = process.env.SUPABASE_SECRET_KEY?.trim() || process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!key || !getSupabaseUrl()) throw new StoreError('Private downloads are being set up.', 503);
  const client = createStorageClient(getSupabaseUrl(), key, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data, error } = await client.storage.getBucket(bucket);
  if (error || !data) throw new StoreError('The private download bucket is not available.', 503);
  assertPrivateBucket(bucket, data.public, process.env.SUPABASE_DOCUMENTS_BUCKET?.trim() || process.env.SUPABASE_STORAGE_BUCKET?.trim() || 'documents');
  return client.storage.from(bucket);
}
export async function verifyAsset(path: string, bytes?: number) {
  assertAssetPath(path, STORE_APP_KEY);
  const storage = await privateStorage();
  const { data, error } = await storage.info(path);
  if (error || !data || (bytes !== undefined && Number(data.size) !== Number(bytes))) throw new StoreError('Upload a valid file before publishing.');
  return storage;
}
