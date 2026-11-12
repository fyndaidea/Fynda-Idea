import type { PublicProduct } from '@/lib/store/policy';
import Catalog from './Catalog';

export default function Storefront({ products, unavailable }: { products: PublicProduct[]; unavailable: boolean }) {
  return (
    <main className="store-main store-main--spotlight">
      <section className="store-section store-section--open">
        {unavailable ? <div className="store-empty"><h2>We’re getting the store ready.</h2><p>The collection is temporarily unavailable. Please check back soon.</p></div> : <Catalog products={products} />}
      </section>
    </main>
  );
}
