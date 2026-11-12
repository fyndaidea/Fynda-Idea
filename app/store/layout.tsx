import type { Metadata } from 'next';
import { STORE_NAME } from '@/lib/store/config';
import './store.css';

export const metadata: Metadata = { title: 'Digital store', description: `Digital products from ${STORE_NAME}. Purchase resources and access your private download library.` };

export default function StoreLayout({ children }: { children: React.ReactNode }) {
  return <div className="store-shell">{children}</div>;
}
