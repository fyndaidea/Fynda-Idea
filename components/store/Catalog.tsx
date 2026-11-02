'use client';
import Link from 'next/link';
import { useMemo, useState } from 'react';
import { money, type PublicProduct } from '@/lib/store/policy';
import type { StoreLayout } from './store-layouts';

function coverClass(index: number) {
  return `store-cover store-cover-${index % 3}`;
}

function ProductCover({ product, index }: { product: PublicProduct; index: number }) {
  return (
    <div className={coverClass(index)}>
      <span className="store-cover-grid" />
      <span className="store-file-mark">{product.format.slice(0, 10)}</span>
      <span className="store-cover-caption">Digital resource <span>↗</span></span>
    </div>
  );
}

export default function Catalog({ products, layout }: { products: PublicProduct[]; layout: StoreLayout }) {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const categories = useMemo(() => [...new Set(products.map((product) => product.category))].sort(), [products]);
  const visible = products.filter((product) => (!category || product.category === category) && `${product.title} ${product.summary} ${product.category}`.toLowerCase().includes(search.toLowerCase()));
  const featured = layout === 'spotlight' ? visible[0] : undefined;
  const rest = featured ? visible.slice(1) : visible;

  const filters = (
    <div className="store-filters">
      <label><span className="store-sr">Search products</span><input placeholder="Search digital products…" type="search" value={search} onChange={(event) => setSearch(event.target.value)} /></label>
      {layout === 'shelf' ? null : <label><span className="store-sr">Category</span><select value={category} onChange={(event) => setCategory(event.target.value)}><option value="">All categories</option>{categories.map((item) => <option key={item}>{item}</option>)}</select></label>}
      <span>{visible.length} {visible.length === 1 ? 'product' : 'products'}</span>
    </div>
  );

  const empty = (
    <div className="store-empty">
      <span className="store-empty-icon" aria-hidden>↓</span>
      <h2>{products.length ? 'No matching products' : 'A new collection is on the way.'}</h2>
      <p>{products.length ? 'Try another search or category.' : 'Digital resources for your next project. Check back for the first releases.'}</p>
      {!products.length ? <Link className="store-link" href="/store/purchases">Visit your purchase library →</Link> : null}
    </div>
  );

  if (layout === 'shelf') {
    return (
      <div className="store-shelf">
        <aside className="store-shelf-rail" aria-label="Product categories">
          <p>Category</p>
          <button type="button" aria-pressed={!category} onClick={() => setCategory('')}>All</button>
          {categories.map((item) => <button type="button" key={item} aria-pressed={category === item} onClick={() => setCategory(item)}>{item}</button>)}
        </aside>
        <div>
          {filters}
          {visible.length ? <div className="store-rows">{visible.map((product, index) => (
            <Link className="store-row" href={`/store/${product.slug}`} key={product.id}>
              <ProductCover product={product} index={index} />
              <div>
                <p className="store-eyebrow">{product.category}</p>
                <h2>{product.title}</h2>
                <p>{product.summary}</p>
              </div>
              <strong>{money(product.amount_cents, product.currency)}</strong>
            </Link>
          ))}</div> : empty}
        </div>
      </div>
    );
  }

  return (
    <>
      {filters}
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
      ) : null}
      {rest.length ? <div className={layout === 'spotlight' ? 'store-grid store-grid--quiet' : 'store-grid'}>{rest.map((product, index) => (
        <Link className="store-card" href={`/store/${product.slug}`} key={product.id}>
          {layout === 'spotlight' ? null : <ProductCover product={product} index={featured ? index + 1 : index} />}
          <div className="store-card-body">
            <p className="store-eyebrow">{product.category}</p>
            <h2>{product.title}</h2>
            <p>{product.summary}</p>
            <div className="store-card-foot"><strong>{money(product.amount_cents, product.currency)}</strong><span>View product →</span></div>
          </div>
        </Link>
      ))}</div> : featured ? null : empty}
    </>
  );
}
