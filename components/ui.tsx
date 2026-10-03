import type { ComponentProps } from "react";
import { twMerge } from "tailwind-merge";

export function cx(...parts: Array<string | false | null | undefined>) {
  return twMerge(parts.filter(Boolean) as string[]);
}

export function Container({
  className,
  ...props
}: ComponentProps<"div">) {
  return (
    <div
      className={cx("mx-auto w-full max-w-6xl px-5 sm:px-8 lg:px-10", className)}
      {...props}
    />
  );
}

export function Section({
  className,
  ...props
}: ComponentProps<"section">) {
  return (
    <section
      className={twMerge("py-16 sm:py-20 lg:py-24", className)}
      {...props}
    />
  );
}

export function Badge({
  variant = "neutral",
  className,
  ...props
}: ComponentProps<"span"> & { variant?: "neutral" | "brand" | "success" }) {
  const styles =
    variant === "brand"
      ? "border-[color:var(--accent-border)] bg-[color:var(--accent-muted)] text-[color:var(--accent)]"
      : variant === "success"
        ? "border-emerald-200 bg-emerald-50 text-emerald-700"
        : "border-[color:var(--card-border)] bg-[color:var(--card)] text-[color:var(--muted)]";
  return (
    <span
      className={cx(
        "inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold tracking-wide",
        styles,
        className
      )}
      {...props}
    />
  );
}

export function Button({
  variant = "primary",
  className,
  ...props
}: ComponentProps<"a"> & { variant?: "primary" | "secondary" | "ghost" }) {
  const styles =
    variant === "primary"
      ? "bg-[color:var(--accent)] text-white shadow-[0_2px_8px_var(--accent-glow)] hover:bg-[color:var(--accent-hover)]"
      : variant === "secondary"
        ? "border border-[color:var(--card-border)] bg-[color:var(--card)] text-[color:var(--foreground)] shadow-sm hover:bg-[color:var(--card-muted)]"
        : "text-[color:var(--muted)] hover:text-[color:var(--foreground)]";

  return (
    <a
      className={cx(
        "inline-flex h-12 items-center justify-center rounded-full px-6 text-sm font-semibold tracking-tight transition duration-200",
        variant === "ghost" ? "h-auto rounded-none px-0 shadow-none" : "",
        styles,
        className
      )}
      {...props}
    />
  );
}
