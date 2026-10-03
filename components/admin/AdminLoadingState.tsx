import { ShimmerBlock } from "@/components/ui/Shimmer";

type Props = {
  label?: string;
  /** When true, expands to fill the parent flex column (admin list/editor pages). */
  fillHeight?: boolean;
};

export function AdminLoadingState({ label = "Loading…", fillHeight = true }: Props) {
  return (
    <div
      className={[
        "flex flex-col gap-4",
        fillHeight ? "min-h-[min(24rem,50dvh)] flex-1" : "py-4",
      ].join(" ")}
      aria-busy="true"
      aria-label={label}
    >
      <div className="flex items-center justify-between gap-3">
        <ShimmerBlock className="h-7 w-44" />
        <ShimmerBlock className="h-9 w-28" rounded="rounded-lg" />
      </div>
      <div className="overflow-hidden rounded-xl border border-[color:var(--card-border)] bg-[color:var(--card)]">
        <div className="border-b border-[color:var(--card-border)] px-4 py-3">
          <ShimmerBlock className="h-8 w-full max-w-sm" rounded="rounded-lg" />
        </div>
        <div className="divide-y divide-[color:var(--card-border)]">
          {Array.from({ length: fillHeight ? 8 : 4 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4 px-4 py-3.5">
              <ShimmerBlock className="h-8 w-8" rounded="rounded-lg" />
              <ShimmerBlock className="h-3 w-[30%]" />
              <ShimmerBlock className="ml-auto h-3 w-[16%]" />
              <ShimmerBlock className="h-3 w-[12%]" />
            </div>
          ))}
        </div>
      </div>
      <p className="sr-only">{label}</p>
    </div>
  );
}
