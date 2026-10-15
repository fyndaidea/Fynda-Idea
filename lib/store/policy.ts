export class StoreError extends Error {
  constructor(message: string, public status = 400) { super(message); }
}
export type Product = {
  id: string; app_key: string; slug: string; title: string; summary: string;
  description: string; category: string; format: string; amount_cents: number;
  currency: string; published: boolean; asset_path: string; file_name: string;
  file_bytes: number; created_at: string; updated_at: string;
};
export type Order = {
  id: string; app_key: string; user_id: string; product_id: string; title: string;
  amount_cents: number; currency: string; asset_path: string; file_name: string;
  status: 'pending' | 'paid' | 'failed' | 'expired' | 'refunded' | 'disputed';
  created_at: string;
};
export function publicProduct(p: Product) {
  const { id, slug, title, summary, description, category, format, amount_cents, currency, file_name, file_bytes } = p;
  return { id, slug, title, summary, description, category, format, amount_cents, currency, file_name, file_bytes: Number(file_bytes) };
}
export type PublicProduct = ReturnType<typeof publicProduct>;
export function money(amount: number, currency: string) {
  return new Intl.NumberFormat('en', { style: 'currency', currency: currency.toUpperCase() }).format(amount / 100);
}
export function assertAssetPath(path: string, app: string) {
  if (!path.startsWith(`${app}/`) || path.includes('..') || !/^[a-zA-Z0-9._/-]+$/.test(path))
    throw new StoreError('Choose a file uploaded to this app’s private store.');
}
export function assertPrivateBucket(bucket: string, isPublic: boolean, mediaBucket: string) {
  if (!bucket || isPublic || bucket === mediaBucket) throw new StoreError('Store downloads need a separate private storage bucket.', 503);
}
export function assertOrigin(origin: string | null, site: string) {
  if (!origin || origin !== new URL(site).origin) throw new StoreError('This request must come from this app.', 403);
}
export function validSiteUrl(raw: string, production: boolean) {
  let url: URL;
  try { url = new URL(raw); } catch { throw new StoreError('The store’s site URL needs configuration.', 503); }
  if (url.username || url.password || url.pathname !== '/' || url.search || url.hash ||
      (url.protocol !== 'https:' && !(url.protocol === 'http:' && !production && ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname))))
    throw new StoreError('The store’s site URL must be an HTTPS origin (localhost is allowed in development).', 503);
  return url.origin;
}
export function productInput(value: unknown, app: string) {
  if (!value || typeof value !== 'object') throw new StoreError('Enter the product details.');
  const input = value as Record<string, unknown>;
  const text = (key: string, max: number, required = true) => {
    const s = typeof input[key] === 'string' ? (input[key] as string).trim() : '';
    if ((required && !s) || s.length > max) throw new StoreError(`Check the ${key.replaceAll('_', ' ')} field.`);
    return s;
  };
  const title = text('title', 150), slug = text('slug', 100), summary = text('summary', 300);
  const description = text('description', 20000), category = text('category', 80), format = text('format', 40);
  const currency = text('currency', 3).toLowerCase();
  if (['purchases'].includes(slug)) throw new StoreError('Choose another product URL; this one is reserved for the store.');
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) throw new StoreError('Use lowercase words separated by hyphens for the URL.');
  if (!['usd', 'cad', 'eur', 'gbp', 'aud'].includes(currency)) throw new StoreError('Choose a supported currency.');
  const amount_cents = input.amount_cents;
  if (typeof amount_cents !== 'number' || !Number.isSafeInteger(amount_cents) || amount_cents < 100 || amount_cents > 10000000)
    throw new StoreError('Enter a price between 1.00 and 100,000.00.');
  const asset_path = text('asset_path', 500, false), file_name = text('file_name', 200, false);
  if (asset_path) assertAssetPath(asset_path, app);
  if (file_name && /[\x00-\x1f\x7f/\\]/.test(file_name)) throw new StoreError('Choose a valid download filename.');
  const file_bytes = input.file_bytes ?? 0;
  if (typeof file_bytes !== 'number' || !Number.isSafeInteger(file_bytes) || file_bytes < 0 || file_bytes > 50 * 1024 * 1024)
    throw new StoreError('Files can be up to 50 MB.');
  const published = input.published === true;
  if (published && (!asset_path || !file_name || !file_bytes)) throw new StoreError('Upload a download file before publishing.');
  return { title, slug, summary, description, category, format, currency, amount_cents, asset_path, file_name, file_bytes, published };
}
export function canDownload(order: Order, userId: string, app: string) {
  return order.app_key === app && order.user_id === userId && order.status === 'paid';
}
