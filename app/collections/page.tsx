import { listCollectionSummaries } from "@/lib/db/collections-db";
import { CollectionCard } from "@/components/content/CollectionCard";
import { pageDescClass, pageTitleClass } from "@/lib/ui-classes";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export const metadata = {
  title: "Collections",
  description: "Curated lists of ideas on Fynda Idea.",
};

export default async function CollectionsPage() {
  const collections = await listCollectionSummaries().catch(() => []);

  return (
    <main className="bg-[color:var(--background)]">
      <div className="mx-auto w-full max-w-[1280px] px-4 pb-12 pt-6 sm:pt-8">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className={pageTitleClass}>Collections</h1>
            <p className={`${pageDescClass} max-w-2xl text-[15px] leading-6`}>
              Curated lists of ideas — editorial picks and themed roundups.
            </p>
          </div>
          <p className="text-sm text-[color:var(--muted)]">
            Showing {collections.length} {collections.length === 1 ? "collection" : "collections"}
          </p>
        </div>

        {collections.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {collections.map((collection) => (
              <CollectionCard key={collection.id} collection={collection} />
            ))}
          </div>
        ) : (
          <p className="rounded-xl border border-[color:var(--card-border)] bg-[color:var(--card)] px-5 py-8 text-center text-sm text-[color:var(--muted)]">
            No collections published yet.
          </p>
        )}
      </div>
    </main>
  );
}
