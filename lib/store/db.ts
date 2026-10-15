import 'server-only';
import { Pool, type PoolClient, type QueryResultRow } from 'pg';
import { STORE_APP_KEY } from './config';
import { StoreError, publicProduct, type Product, type Order } from './policy';
const pools = globalThis as typeof globalThis & { fyndaStorePools?: Map<string, Pool> };
export function storeDb() {
  const connectionString = process.env.DATABASE_URL || process.env.SUPABASE_DB_URL || process.env.SUPABASE_DATABASE_URL;
  if (!connectionString) throw new StoreError('The store is being set up. Please check back soon.', 503);
  pools.fyndaStorePools ??= new Map();
  if (!pools.fyndaStorePools.has(STORE_APP_KEY)) pools.fyndaStorePools.set(STORE_APP_KEY, new Pool({ connectionString, max: 3 }));
  return pools.fyndaStorePools.get(STORE_APP_KEY)!;
}
export async function query<T extends QueryResultRow>(sql: string, values: unknown[] = [], client?: PoolClient) {
  return (await (client ?? storeDb()).query<T>(sql, values)).rows;
}
export async function transaction<T>(work: (client: PoolClient) => Promise<T>) {
  const client = await storeDb().connect();
  try { await client.query('BEGIN'); const result = await work(client); await client.query('COMMIT'); return result; }
  catch (error) { await client.query('ROLLBACK'); throw error; }
  finally { client.release(); }
}
export async function catalog() {
  return (await query<Product>('SELECT * FROM store_products WHERE app_key=$1 AND published=true ORDER BY created_at DESC', [STORE_APP_KEY])).map(publicProduct);
}
export async function productBySlug(slug: string) {
  const [product] = await query<Product>('SELECT * FROM store_products WHERE app_key=$1 AND slug=$2 AND published=true', [STORE_APP_KEY, slug]);
  return product ? publicProduct(product) : null;
}
export async function myOrders(user: string) {
  // Never return private asset locations or payment credentials to the browser.
  return query<Omit<Order, 'asset_path'>>('SELECT id,app_key,user_id,product_id,title,amount_cents,currency,file_name,status,created_at FROM store_orders WHERE app_key=$1 AND user_id=$2 ORDER BY created_at DESC', [STORE_APP_KEY, user]);
}
