import { catalog } from '@/lib/store/db';
import { STORE_NAME } from '@/lib/store/config';
import type { PublicProduct } from '@/lib/store/policy';
import Catalog from '@/components/store/Catalog';
export const dynamic = 'force-dynamic';
export default async function StorePage() {
  let products: PublicProduct[] = [], unavailable = false;
  try { products = await catalog(); } catch { unavailable = true; }
  return <main className="store-main"><section className="store-hero"><div><p className="store-eyebrow">{STORE_NAME} / Digital store</p><h1>Resources for<br/>your next <em>idea.</em></h1><p className="store-lead">Discover digital products made to move your work forward. Browse the collection; purchasing is coming soon.</p></div><div className="store-hero-art" aria-hidden><span className="store-art-sheet store-art-back"/><span className="store-art-sheet store-art-front"><span>FYNDA</span><b>MAKE<br/>WHAT’S<br/>NEXT.</b><i>Digital collection ↗</i></span><span className="store-art-dot"/></div></section>
    <div className="store-benefits"><span><b>01</b> Digital delivery</span><span><b>02</b> Curated resources</span><span><b>03</b> Your personal library</span></div>
    <section className="store-section"><div className="store-section-heading"><div><p className="store-eyebrow">The collection</p><h2>Explore digital products</h2></div><p>Made to be put to work.</p></div>{unavailable ? <div className="store-empty"><h2>We’re getting the store ready.</h2><p>The collection is temporarily unavailable. Please check back soon.</p></div> : <Catalog products={products}/>}</section>
    <section className="store-how"><div><p className="store-eyebrow">Simple from start to finish</p><h2>From discovery<br/>to download.</h2></div><ol><li><b>Find your resource</b><p>Explore the collection and check the product details.</p></li><li><b>Make it yours</b><p>Explore the product details. Purchasing will be available soon.</p></li><li><b>Get to work</b><p>Your purchase library will keep your resources together once purchasing is enabled.</p></li></ol></section>
  </main>;
}
