import { ShimmerBlock } from "@/components/ui/Shimmer";

type Variant = "home" | "grid" | "detail" | "feed" | "list" | "admin";

function CardSkeleton() {
  return (
    <div className="flex h-full flex-col rounded-2xl border border-[color:var(--card-border)] bg-[color:var(--card)] p-5">
      <div className="mb-4 flex gap-1.5">
        <ShimmerBlock className="h-7 w-7" rounded="rounded-md" />
        <ShimmerBlock className="h-7 w-7" rounded="rounded-md" />
        <ShimmerBlock className="h-7 w-7" rounded="rounded-md" />
      </div>
      <ShimmerBlock className="h-4 w-[72%]" />
      <ShimmerBlock className="mt-3 h-3 w-full" />
      <ShimmerBlock className="mt-2 h-3 w-[88%]" />
      <div className="mt-auto border-t border-[color:var(--card-border)] pt-3">
        <ShimmerBlock className="h-3 w-24" />
      </div>
    </div>
  );
}

function FeaturedSkeleton() {
  return (
    <div className="flex flex-col overflow-hidden rounded-2xl border border-[color:var(--card-border)] bg-[color:var(--card)] sm:flex-row">
      <ShimmerBlock className="min-h-[140px] w-full sm:w-[220px] sm:min-h-[180px]" rounded="rounded-none" />
      <div className="flex flex-1 flex-col p-5 sm:p-6">
        <ShimmerBlock className="h-5 w-20" rounded="rounded-full" />
        <ShimmerBlock className="mt-3 h-7 w-[85%]" />
        <ShimmerBlock className="mt-3 h-3 w-full" />
        <ShimmerBlock className="mt-2 h-3 w-[70%]" />
      </div>
    </div>
  );
}

function HeaderSkeleton() {
  return (
    <div className="border-b border-[color:var(--card-border)] bg-[color:var(--card)]">
      <div className="mx-auto w-full max-w-[1280px] px-4 py-8 sm:px-6 sm:py-10">
        <ShimmerBlock className="h-3 w-24" />
        <ShimmerBlock className="mt-3 h-9 w-[min(100%,20rem)]" />
        <ShimmerBlock className="mt-3 h-4 w-[min(100%,36rem)]" />
        <ShimmerBlock className="mt-2 h-4 w-[min(100%,28rem)]" />
      </div>
    </div>
  );
}

export function PageShimmer({
  variant = "grid",
  label = "Loading",
}: {
  variant?: Variant;
  label?: string;
}) {
  return (
    <main
      className="min-h-[calc(100dvh-var(--site-header-h,56px)-4rem)] bg-[color:var(--background)]"
      aria-busy="true"
      aria-label={label}
    >
      {variant === "home" ? (
        <div
          className="home-loader--bounce flex min-h-[calc(100dvh-var(--site-header-h,56px))] items-center justify-center bg-[color:var(--background)]"
          aria-hidden
        >
          <div className="home-loader__stage">
            <span className="home-loader__dot home-loader__dot--a" />
            <span className="home-loader__dot home-loader__dot--b" />
            <span className="home-loader__dot home-loader__dot--c" />
          </div>
        </div>
      ) : null}

      {variant === "grid" ? (
        <>
          <HeaderSkeleton />
          <div className="mx-auto w-full max-w-[1280px] px-4 py-8 sm:px-6">
            <FeaturedSkeleton />
            <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <CardSkeleton key={i} />
              ))}
            </div>
          </div>
        </>
      ) : null}

      {variant === "detail" ? (
        <>
          <HeaderSkeleton />
          <div className="mx-auto w-full max-w-[1280px] px-4 py-8 sm:px-6">
            <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_300px]">
              <div className="rounded-2xl border border-[color:var(--card-border)] bg-[color:var(--card)] px-5 py-6 sm:px-8 sm:py-8">
                <ShimmerBlock className="h-5 w-40" />
                <ShimmerBlock className="mt-6 h-3 w-full" />
                <ShimmerBlock className="mt-2 h-3 w-full" />
                <ShimmerBlock className="mt-2 h-3 w-[92%]" />
                <ShimmerBlock className="mt-2 h-3 w-[88%]" />
                <ShimmerBlock className="mt-8 h-5 w-48" />
                <ShimmerBlock className="mt-4 h-3 w-full" />
                <ShimmerBlock className="mt-2 h-3 w-[90%]" />
                <ShimmerBlock className="mt-2 h-3 w-[84%]" />
                <ShimmerBlock className="mt-8 h-40 w-full" rounded="rounded-xl" />
              </div>
              <div className="space-y-4">
                <div className="rounded-2xl border border-[color:var(--card-border)] bg-[color:var(--card)] p-4">
                  <ShimmerBlock className="h-3 w-32" />
                  <div className="mt-4 space-y-3">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <div key={i} className="flex gap-3">
                        <ShimmerBlock className="h-8 w-8" rounded="rounded-lg" />
                        <div className="min-w-0 flex-1">
                          <ShimmerBlock className="h-3 w-[60%]" />
                          <ShimmerBlock className="mt-2 h-2.5 w-full" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      ) : null}

      {variant === "feed" ? (
        <div className="mx-auto grid w-full max-w-6xl gap-6 px-5 py-8 lg:grid-cols-[240px_minmax(0,1fr)]">
          <div className="space-y-2">
            {Array.from({ length: 8 }).map((_, i) => (
              <ShimmerBlock key={i} className="h-10 w-full" rounded="rounded-xl" />
            ))}
          </div>
          <div className="rounded-2xl border border-[color:var(--card-border)] bg-[color:var(--card)] p-6">
            <ShimmerBlock className="h-3 w-24" />
            <ShimmerBlock className="mt-3 h-8 w-[80%]" />
            <ShimmerBlock className="mt-4 h-3 w-full" />
            <ShimmerBlock className="mt-2 h-3 w-full" />
            <ShimmerBlock className="mt-2 h-3 w-[70%]" />
          </div>
        </div>
      ) : null}

      {variant === "list" ? (
        <>
          <HeaderSkeleton />
          <div className="mx-auto w-full max-w-[1280px] space-y-3 px-4 py-8 sm:px-6">
            {Array.from({ length: 8 }).map((_, i) => (
              <div
                key={i}
                className="flex items-start gap-3 rounded-xl border border-[color:var(--card-border)] bg-[color:var(--card)] p-4"
              >
                <ShimmerBlock className="h-10 w-10" rounded="rounded-md" />
                <div className="min-w-0 flex-1 space-y-2">
                  <ShimmerBlock className="h-4 w-[40%]" />
                  <ShimmerBlock className="h-3 w-[80%]" />
                  <ShimmerBlock className="h-3 w-[30%]" />
                </div>
              </div>
            ))}
          </div>
        </>
      ) : null}

      {variant === "admin" ? (
        <div className="flex h-full min-h-[min(24rem,50dvh)] flex-col gap-4 p-1">
          <div className="flex items-center justify-between gap-3">
            <ShimmerBlock className="h-8 w-48" />
            <ShimmerBlock className="h-9 w-28" rounded="rounded-lg" />
          </div>
          <div className="overflow-hidden rounded-xl border border-[color:var(--card-border)] bg-[color:var(--card)]">
            <div className="border-b border-[color:var(--card-border)] px-4 py-3">
              <ShimmerBlock className="h-8 w-full max-w-sm" rounded="rounded-lg" />
            </div>
            <div className="divide-y divide-[color:var(--card-border)]">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="flex items-center gap-4 px-4 py-3.5">
                  <ShimmerBlock className="h-8 w-8" rounded="rounded-lg" />
                  <ShimmerBlock className="h-3 w-[28%]" />
                  <ShimmerBlock className="ml-auto h-3 w-[18%]" />
                  <ShimmerBlock className="h-3 w-[12%]" />
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : null}
    </main>
  );
}
