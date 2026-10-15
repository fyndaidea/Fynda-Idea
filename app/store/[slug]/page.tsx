import Link from 'next/link';
import { notFound } from 'next/navigation';
import { productBySlug } from '@/lib/store/db';
import { money } from '@/lib/store/policy';
import PurchaseButton from '@/components/store/PurchaseButton';
export const dynamic = 'force-dynamic';
export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const p = await productBySlug((await params).slug);
  if (!p) notFound();
  return <main className="store-main"><Link className="store-link" href="/store">← All products</Link><div className="store-detail"><article><div className="store-cover store-cover-0 store-detail-cover"><span className="store-cover-grid"/><span className="store-file-mark">{p.format}</span><span className="store-cover-caption">Digital resource <span>↗</span></span></div><p className="store-eyebrow">{p.category}</p><h1>{p.title}</h1><p className="store-lead">{p.summary}</p><h2>About this product</h2><p className="store-description">{p.description}</p></article><aside className="store-buy"><p className="store-eyebrow">Yours to put to work</p><strong className="store-price">{money(p.amount_cents,p.currency)}</strong><p>One-time purchase · {p.currency.toUpperCase()}</p><PurchaseButton/><dl><div><dt>Format</dt><dd>{p.format}</dd></div><div><dt>File</dt><dd>{p.file_name}</dd></div><div><dt>Size</dt><dd>{(p.file_bytes/1024/1024).toFixed(1)} MB</dd></div><div><dt>Delivery</dt><dd>Private download</dd></div></dl><p className="store-note">Purchasing is coming soon. Browse the product details now; payments are not enabled yet.</p></aside></div></main>;
}
