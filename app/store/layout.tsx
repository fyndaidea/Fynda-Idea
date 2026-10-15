import Link from 'next/link';
import type { Metadata } from 'next';
import { STORE_NAME } from '@/lib/store/config';
import './store.css';
export const metadata: Metadata = { title: 'Digital store', description: `Digital products from ${STORE_NAME}. Purchase resources and access your private download library.` };
export default function StoreLayout({ children }: { children: React.ReactNode }) {
  return <div className="store-shell"><nav className="store-subnav" aria-label="Digital store"><Link href="/store">Digital store</Link><Link href="/store/purchases">My purchases</Link><Link href="/dashboard">My account</Link></nav>{children}</div>;
}
