import 'server-only';
import { query } from './db';
import { STORE_APP_KEY } from './config';
import { productInput, StoreError, type Product } from './policy';
import { verifyAsset } from './server';
export async function saveProduct(body: unknown, id?: string) {
  const p = productInput(body, STORE_APP_KEY);
  if (p.asset_path) await verifyAsset(p.asset_path, p.file_bytes);
  const keys = Object.keys(p) as (keyof typeof p)[], values = keys.map(k => p[k]);
  try {
    if (id) {
      if (!/^[0-9a-f-]{36}$/i.test(id)) throw new StoreError('Product not found.', 404);
      const [product] = await query<Product>(`UPDATE store_products SET ${keys.map((k,i) => `${k}=$${i+3}`).join(',')},updated_at=now() WHERE app_key=$1 AND id=$2 RETURNING *`, [STORE_APP_KEY, id, ...values]);
      if (!product) throw new StoreError('Product not found.', 404);
      return product;
    }
    const [product] = await query<Product>(`INSERT INTO store_products(app_key,${keys.join(',')}) VALUES($1,${keys.map((_,i)=>`$${i+2}`).join(',')}) RETURNING *`, [STORE_APP_KEY,...values]);
    return product;
  } catch (error) {
    if ((error as { code?: string }).code === '23505') throw new StoreError('A product already uses this URL.', 409);
    throw error;
  }
}
