'use client';
import Link from 'next/link';
import { useMemo, useState } from 'react';
import { money, type PublicProduct } from '@/lib/store/policy';

function ProductCover({ product, index }: { product: PublicProduct; index: number }) {
  return (
    <div className={`store-cover store-cover-${index % 3}`}>
      <span className="store-cover-grid" />
      <span className="store-file-mark">{product.format.slice(0, 10)}</span>
      <span className="store-cover-caption">Digital resource <span>↗</span></span>
    </div>
  );
}

export default function Catalog({ products }: { products: PublicProduct[] }) {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const categories = useMemo(() => [...new Set(products.map((product) => product.category))].sort(), [products]);
  const visible = products.filter((product) => (!category || product.category === category) && `${product.title} ${product.summary} ${product.category}`.toLowerCase().includes(search.toLowerCase()));
  const featured = visible[0];
  const rest = visible.slice(1);

  return (
    <>
      <div className="store-filters">
        <label><span className="store-sr">Search products</span><input placeholder="Search digital products…" type="search" value={search} onChange={(event) => setSearch(event.target.value)} /></label>
        <label><span className="store-sr">Category</span><select value={category} onChange={(event) => setCategory(event.target.value)}><option value="">All categories</option>{categories.map((item) => <option key={item}>{item}</option>)}</select></label>
        <span>{visible.length} {visible.length === 1 ? 'product' : 'products'}</span>
      </div>
      {featured ? (
        <Link className="store-feature" href={`/store/${featured.slug}`}>
          <ProductCover product={featured} index={0} />
          <div>
            <p className="store-eyebrow">Featured · {featured.category}</p>
            <h2>{featured.title}</h2>
            <p>{featured.summary}</p>
            <div className="store-card-foot"><strong>{money(featured.amount_cents, featured.currency)}</strong><span>View product →</span></div>
          </div>
        </Link>
      ) : (
        <div className="store-empty">
          <span className="store-empty-icon" aria-hidden>↓</span>
          <h2>{products.length ? 'No matching products' : 'A new collection is on the way.'}</h2>
          <p>{products.length ? 'Try another search or category.' : 'Digital resources for your next project. Check back for the first releases.'}</p>
          {!products.length ? <Link className="store-link" href="/dashboard?section=purchases">Visit your purchases →</Link> : null}
        </div>
      )}
      {rest.length ? <div className="store-grid store-grid--quiet">{rest.map((product) => (
        <Link className="store-card" href={`/store/${product.slug}`} key={product.id}>
          <div className="store-card-body">
            <p className="store-eyebrow">{product.category}</p>
            <h2>{product.title}</h2>
            <p>{product.summary}</p>
            <div className="store-card-foot"><strong>{money(product.amount_cents, product.currency)}</strong><span>View product →</span></div>
          </div>
        </Link>
      ))}</div> : null}
    </>
  );
}
