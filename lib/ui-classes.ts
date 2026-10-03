/** Shared Tailwind class strings for the light design system */

export const panelClass =
  "rounded-2xl border border-[color:var(--card-border)] bg-[color:var(--card)] shadow-[var(--card-shadow)]";

export const inputClass =
  "h-10 w-full rounded-xl border border-[color:var(--card-border)] bg-[color:var(--background)] px-3 text-sm text-[color:var(--foreground)] placeholder:text-[color:var(--muted-2)] outline-none transition focus:border-[color:var(--accent-border)] focus:ring-2 focus:ring-[color:var(--ring)]";

/** Table/toolbar search fields — border-only focus (no accent ring). */
export const searchInputClass =
  "h-10 w-full rounded-xl border border-[color:var(--card-border)] bg-[color:var(--card-muted)] px-3 text-sm text-[color:var(--foreground)] placeholder:text-[color:var(--muted)] outline-none transition focus:border-[color:var(--muted-2)] focus:ring-0";

export const textareaClass =
  "w-full rounded-xl border border-[color:var(--card-border)] bg-[color:var(--background)] px-3 py-2 text-sm text-[color:var(--foreground)] placeholder:text-[color:var(--muted-2)] outline-none transition focus:border-[color:var(--accent-border)] focus:ring-2 focus:ring-[color:var(--ring)]";

export const btnPrimaryClass =
  "inline-flex h-10 items-center justify-center rounded-full bg-[color:var(--accent)] px-4 text-sm font-semibold text-white shadow-[0_2px_8px_var(--accent-glow)] transition hover:bg-[color:var(--accent-hover)] disabled:opacity-50";

export const btnSecondaryClass =
  "inline-flex h-10 items-center justify-center rounded-full border border-[color:var(--card-border)] bg-[color:var(--card)] px-4 text-sm font-semibold text-[color:var(--foreground)] transition hover:bg-[color:var(--card-muted)] disabled:opacity-50";

export const labelClass =
  "text-xs font-semibold uppercase tracking-[0.14em] text-[color:var(--muted)]";

export const pageTitleClass =
  "text-2xl font-bold tracking-tight text-[color:var(--foreground)]";

export const pageDescClass = "mt-2 text-sm text-[color:var(--muted)]";

/** Overflow scroll with hidden scrollbar (see `.site-scrollbar` in globals.css). */
export const siteScrollbarClass = "site-scrollbar overflow-auto overscroll-y-contain";

/** Split-layout pages (News, Research): lighter left column than heavy card-muted blocks. */
export const appSidebarAsideClass =
  "flex min-h-0 flex-col border-[color:var(--card-border)]/60 bg-[color:var(--background)] lg:border-r";

export const appSidebarToolbarClass =
  "shrink-0 border-b border-[color:var(--card-border)]/50 bg-[color:var(--card)]/50 backdrop-blur-sm";

export function appSidebarRowClass(active: boolean) {
  return [
    "grid w-full grid-cols-[2px_minmax(0,1fr)] text-left transition",
    active
      ? "bg-[color:var(--accent-muted)]/40"
      : "hover:bg-[color:var(--background-warm)]/55",
  ].join(" ");
}
