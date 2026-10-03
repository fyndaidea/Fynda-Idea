import Link from "next/link";
import { CollectionCard } from "@/components/content/CollectionCard";
import { listCollectionSummaries } from "@/lib/db/collections-db";

export default async function HomeCollectionsStrip() {
  const collections = await listCollectionSummaries({ limit: 6 }).catch(() => []);
  if (collections.length === 0) return null;

  return (
    <section className="border-t border-[color:var(--card-border)] bg-[color:var(--background)] py-14 sm:py-16">
      <div className="mx-auto w-full max-w-6xl px-5 sm:px-8 lg:px-10">
        <div className="mb-6 flex items-end justify-between gap-4">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[color:var(--muted)]">
              Curated lists
            </p>
            <h2 className="mt-1 text-lg font-semibold text-[color:var(--foreground)]">
              Collections worth browsing
            </h2>
          </div>
          <Link
            href="/collections"
            className="shrink-0 text-sm font-medium text-[color:var(--accent)] hover:underline"
          >
            All collections →
          </Link>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {collections.map((collection) => (
            <CollectionCard key={collection.id} collection={collection} />
          ))}
        </div>
      </div>
    </section>
  );
}
