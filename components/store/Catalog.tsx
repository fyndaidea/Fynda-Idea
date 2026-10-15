'use client';
import Link from 'next/link';
import { useState } from 'react';
import { money, type PublicProduct } from '@/lib/store/policy';
export default function Catalog({ products }: { products: PublicProduct[] }) {
  const [search, setSearch] = useState(''), [category, setCategory] = useState('');
  const categories = [...new Set(products.map(p => p.category))].sort();
  const visible = products.filter(p => (!category || p.category === category) && `${p.title} ${p.summary} ${p.category}`.toLowerCase().includes(search.toLowerCase()));
  return <><div className="store-filters"><label><span className="store-sr">Search products</span><input placeholder="Search digital products…" type="search" value={search} onChange={e=>setSearch(e.target.value)} /></label><label><span className="store-sr">Category</span><select value={category} onChange={e=>setCategory(e.target.value)}><option value="">All categories</option>{categories.map(c=><option key={c}>{c}</option>)}</select></label><span>{visible.length} {visible.length === 1 ? 'product' : 'products'}</span></div>
    {visible.length ? <div className="store-grid">{visible.map((p,i)=><Link className="store-card" href={`/store/${p.slug}`} key={p.id}><div className={`store-cover store-cover-${i%3}`}><span className="store-cover-grid"/><span className="store-file-mark">{p.format.slice(0, 10)}</span><span className="store-cover-caption">Digital resource <span>↗</span></span></div><div className="store-card-body"><p className="store-eyebrow">{p.category}</p><h2>{p.title}</h2><p>{p.summary}</p><div className="store-card-foot"><strong>{money(p.amount_cents,p.currency)}</strong><span>View product →</span></div></div></Link>)}</div> : <div className="store-empty"><span className="store-empty-icon" aria-hidden>↓</span><h2>{products.length ? 'No matching products' : 'A new collection is on the way.'}</h2><p>{products.length ? 'Try another search or category.' : 'Digital resources for your next project. Check back for the first releases.'}</p>{!products.length && <Link className="store-link" href="/store/purchases">Visit your purchase library →</Link>}</div>}
  </>;
}
