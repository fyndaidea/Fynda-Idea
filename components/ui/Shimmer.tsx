/** Shared shimmer primitives — uses `.media-shimmer` from globals.css. */

type ClassProps = { className?: string };

export function ShimmerFill({ className = "" }: ClassProps) {
  return (
    <div
      className={["media-shimmer pointer-events-none absolute inset-0", className].join(" ")}
      aria-hidden
    >
      <span className="media-shimmer__sweep" aria-hidden />
    </div>
  );
}

/** Relative shimmer block (bars, cards, avatars). */
export function ShimmerBlock({
  className = "",
  rounded = "rounded-md",
  label,
}: ClassProps & { rounded?: string; label?: string }) {
  return (
    <div
      className={["relative overflow-hidden", rounded, className].join(" ")}
      aria-hidden={label ? undefined : true}
      role={label ? "status" : undefined}
      aria-label={label}
    >
      <ShimmerFill />
    </div>
  );
}
