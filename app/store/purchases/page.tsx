import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function PurchasesPage({ searchParams }: { searchParams: Promise<{ cancelled?: string }> }) {
  const cancelled = (await searchParams).cancelled === '1';
  redirect(`/dashboard?section=purchases${cancelled ? '&cancelled=1' : ''}`);
}
