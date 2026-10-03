/** Inline loading indicator — use inside a page/section that is already visible. */
export function Spinner({
  className = "h-5 w-5",
  label = "Loading",
}: {
  className?: string;
  label?: string;
}) {
  return (
    <span
      className={`inline-block rounded-full border-2 border-zinc-400/50 border-t-zinc-200 animate-spin dark:border-zinc-600 dark:border-t-zinc-300 ${className}`}
      role="status"
      aria-live="polite"
      aria-label={label}
    />
  );
}
