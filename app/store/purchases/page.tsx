import Link from 'next/link';
import { redirect } from 'next/navigation';
import { storeUser } from '@/lib/store/server';
import { myOrders } from '@/lib/store/db';
import { StoreError, money } from '@/lib/store/policy';
export const dynamic = 'force-dynamic';
export const metadata = { title: 'My purchases', robots: { index: false, follow: false } };
export default async function PurchasesPage({ searchParams }: { searchParams: Promise<{ cancelled?: string }> }) {
  const user = await storeUser().catch(error=>{ if (error instanceof StoreError && error.status === 401) redirect('/login?next=%2Fstore%2Fpurchases'); return null; });
  if (!user) return <main className="store-main"><h1>Your purchase library</h1><p>Sign-in is temporarily unavailable. Please check back soon.</p></main>;
  const orders = await myOrders(user.id);
  const cancelled = (await searchParams).cancelled === '1';
  return <main className="store-main"><p className="store-eyebrow">Your collection</p><h1>My purchases</h1><p className="store-lead">Everything you’ve bought, ready when you are.</p>{cancelled && <p className="store-notice" role="status">Purchasing is currently unavailable.</p>}{orders.length ? <div className="store-orders">{orders.map(o=><article className="store-order" key={o.id}><div><span className={`store-status store-status-${o.status}`}>{o.status === 'paid' ? 'Ready to download' : o.status}</span><h2>{o.title}</h2><p>{money(o.amount_cents,o.currency)} · {new Date(o.created_at).toLocaleDateString('en', { timeZone: 'UTC', year: 'numeric', month: 'short', day: 'numeric' })}</p><small>Order {o.id}</small></div><div>{o.status === 'paid' ? <a className="store-button" href={`/api/store/orders/${o.id}/download`}>Download ↓</a> : o.status === 'pending' ? <><span className="store-status">Purchasing paused</span><p className="store-note">This order is pending. New payments are not enabled.</p></> : <p className="store-note">{o.status === 'refunded' ? 'This purchase was refunded.' : o.status === 'disputed' ? 'Access is paused while this payment is reviewed.' : 'This payment did not complete.'}</p>}</div></article>)}</div> : <div className="store-empty"><span className="store-empty-icon" aria-hidden>↓</span><h2>Your library starts here.</h2><p>Your purchased products will appear here with private download links.</p><Link className="store-button" href="/store">Explore the store →</Link></div>}</main>;
}
