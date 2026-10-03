import { ShimmerBlock } from "@/components/ui/Shimmer";

export function DashboardStatsSkeleton() {
  return (
    <section aria-busy="true" aria-label="Loading dashboard stats">
      <ShimmerBlock className="h-4 w-24" />
      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="rounded-2xl border border-[color:var(--card-border)] bg-[color:var(--card)] p-5"
          >
            <div className="flex justify-between">
              <ShimmerBlock className="h-3 w-28" />
              <ShimmerBlock className="h-8 w-8" rounded="rounded-lg" />
            </div>
            <ShimmerBlock className="mt-4 h-9 w-16" />
          </div>
        ))}
      </div>
    </section>
  );
}
