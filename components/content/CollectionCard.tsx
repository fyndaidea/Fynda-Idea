import Link from "next/link";
import type { CollectionSummary } from "@/lib/db/collections-db";

export function CollectionCard({ collection }: { collection: CollectionSummary }) {
  return (
    <Link
      href={`/collections/${collection.slug}`}
      className="group flex h-full flex-col rounded-xl border border-[color:var(--card-border)] bg-[color:var(--card)] p-5 transition hover:border-[color:var(--foreground)]/15"
    >
      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[color:var(--muted-2)]">
        Collection
      </p>
      <h2 className="mt-2 text-[15px] font-semibold leading-snug text-[color:var(--foreground)] group-hover:text-[color:var(--accent)]">
        {collection.title}
      </h2>
      {collection.description ? (
        <p className="mt-2 line-clamp-2 flex-1 text-[13px] leading-5 text-[color:var(--muted)]">
          {collection.description}
        </p>
      ) : (
        <div className="flex-1" />
      )}
      <p className="mt-4 text-right text-[12px] text-[color:var(--muted-2)]">
        {collection.idea_count} {collection.idea_count === 1 ? "idea" : "ideas"}
      </p>
    </Link>
  );
}
