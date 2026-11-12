import Storefront from '@/components/store/Storefront';
import { catalog } from '@/lib/store/db';
import type { PublicProduct } from '@/lib/store/policy';

export const dynamic = 'force-dynamic';

export default async function StorePage() {
  let products: PublicProduct[] = [];
  let unavailable = false;
  try { products = await catalog(); } catch { unavailable = true; }
  return <Storefront products={products} unavailable={unavailable} />;
}
