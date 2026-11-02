'use client';

import { Columns2, LayoutTemplate, Rows3 } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { STORE_NAME } from '@/lib/store/config';
import type { PublicProduct } from '@/lib/store/policy';
import Catalog from './Catalog';
import { STORE_LAYOUTS, parseStoreLayout, type StoreLayout } from './store-layouts';

const icons = { editorial: LayoutTemplate, shelf: Rows3, spotlight: Columns2 };

export default function Storefront({ products, unavailable }: { products: PublicProduct[]; unavailable: boolean }) {
  const params = useSearchParams();
  const [layout, setLayout] = useState<StoreLayout>(() => parseStoreLayout(params.get('layout')));
  const choose = (next: StoreLayout) => {
    setLayout(next);
    const url = new URL(window.location.href);
    if (next === 'editorial') url.searchParams.delete('layout');
    else url.searchParams.set('layout', next);
    window.history.replaceState(null, '', `${url.pathname}${url.search}`);
  };
  const description = STORE_LAYOUTS.find((item) => item.id === layout)?.description;

  return (
    <main className={`store-main store-main--${layout}`}>
      <div className="store-layout-bar">
        <span>Store layout</span>
        <div role="group" aria-label="Store layout">
          {STORE_LAYOUTS.map((item) => {
            const Icon = icons[item.id];
            return (
              <button key={item.id} type="button" title={item.description} aria-pressed={layout === item.id} onClick={() => choose(item.id)}>
                <Icon size={14} aria-hidden />
                {item.name}
              </button>
            );
          })}
        </div>
      </div>
      <p className="sr-only" role="status">{description}</p>
      {layout === 'editorial' ? (
        <section className="store-hero">
          <div>
            <p className="store-eyebrow">{STORE_NAME} / Digital store</p>
            <h1>Resources for<br />your next <em>idea.</em></h1>
            <p className="store-lead">Discover digital products made to move your work forward. Browse the collection; purchasing is coming soon.</p>
          </div>
          <div className="store-hero-art" aria-hidden>
            <span className="store-art-sheet store-art-back" />
            <span className="store-art-sheet store-art-front"><span>FYNDA</span><b>MAKE<br />WHAT’S<br />NEXT.</b><i>Digital collection ↗</i></span>
            <span className="store-art-dot" />
          </div>
        </section>
      ) : (
        <header className="store-compact-hero">
          <p className="store-eyebrow">{STORE_NAME} / Digital store</p>
          <h1>{layout === 'shelf' ? 'The shelf' : 'In the spotlight'}</h1>
          <p className="store-lead">{description}</p>
        </header>
      )}
      {layout === 'editorial' ? <div className="store-benefits"><span><b>01</b> Digital delivery</span><span><b>02</b> Curated resources</span><span><b>03</b> Your personal library</span></div> : null}
      <section className="store-section">
        {layout === 'editorial' ? <div className="store-section-heading"><div><p className="store-eyebrow">The collection</p><h2>Explore digital products</h2></div><p>Made to be put to work.</p></div> : null}
        {unavailable ? <div className="store-empty"><h2>We’re getting the store ready.</h2><p>The collection is temporarily unavailable. Please check back soon.</p></div> : <Catalog products={products} layout={layout} />}
      </section>
      {layout === 'editorial' ? (
        <section className="store-how">
          <div><p className="store-eyebrow">Simple from start to finish</p><h2>From discovery<br />to download.</h2></div>
          <ol>
            <li><b>Find your resource</b><p>Explore the collection and check the product details.</p></li>
            <li><b>Make it yours</b><p>Explore the product details. Purchasing will be available soon.</p></li>
            <li><b>Get to work</b><p>Your purchase library will keep your resources together once purchasing is enabled.</p></li>
          </ol>
        </section>
      ) : null}
    </main>
  );
}
