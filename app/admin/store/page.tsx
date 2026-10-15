import Link from 'next/link';
import { redirect } from 'next/navigation';
import { storeUser } from '@/lib/store/server';
import { query } from '@/lib/store/db';
import { STORE_APP_KEY, STORE_NAME } from '@/lib/store/config';
import { StoreError, money, type Product } from '@/lib/store/policy';
import StoreAdmin from '@/components/store/StoreAdmin';
import '../../store/store.css';
export const dynamic = 'force-dynamic';
export default async function StoreAdminPage() {
  const user = await storeUser(true).catch(error=>{ if (error instanceof StoreError && error.status===401) redirect('/admin/login?next=%2Fadmin%2Fstore'); if (error instanceof StoreError && error.status===403) redirect('/store'); return null; });
  if (!user) return <main className="store-main"><h1>Digital store setup</h1><p>Configure authentication, the database, payments and private storage using docs/digital-store.md.</p></main>;
  let products: Product[] = [], orders: { id:string; title:string; user_id:string; amount_cents:number;currency:string;status:string;created_at:string }[] = [], unavailable = false;
  try {
    products = await query<Product>('SELECT * FROM store_products WHERE app_key=$1 ORDER BY created_at DESC', [STORE_APP_KEY]);
    orders = await query('SELECT id,title,user_id,amount_cents,currency,status,created_at FROM store_orders WHERE app_key=$1 ORDER BY created_at DESC LIMIT 100', [STORE_APP_KEY]);
  } catch { unavailable = true; }
  // Dates and bigint fields are serialized deliberately before crossing the client boundary.
  products = products.map(p=>({...p,created_at:String(p.created_at),updated_at:String(p.updated_at),file_bytes:Number(p.file_bytes)}));
  return <main className="store-main store-admin"><p className="store-eyebrow">{STORE_NAME} / Admin</p><h1>Digital store</h1><p className="store-lead">Manage this app’s products, files and purchases.</p><Link className="store-link" href="/store">Open storefront ↗</Link>{unavailable ? <p className="store-notice">Apply data/sql/40_digital_store.sql to set up the store tables.</p> : <><StoreAdmin products={products}/><section className="store-section"><h2>Recent orders</h2><p className="store-note">Latest 100 orders for this app. Purchasing is currently disabled.</p><div className="store-table-wrap"><table><thead><tr><th>Product / order</th><th>Customer ID</th><th>Amount</th><th>Status</th><th>Date</th></tr></thead><tbody>{orders.map(o=><tr key={o.id}><td>{o.title}<small>{o.id}</small></td><td>{o.user_id}</td><td>{money(o.amount_cents,o.currency)}</td><td>{o.status}</td><td>{new Date(o.created_at).toLocaleDateString('en',{timeZone:'UTC'})}</td></tr>)}</tbody></table>{!orders.length && <p>No purchases yet.</p>}</div></section></>}</main>;
}
