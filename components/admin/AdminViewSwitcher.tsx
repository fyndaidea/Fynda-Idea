"use client";

import { LayoutGrid, List } from "lucide-react";
import type { AdminViewMode } from "./useAdminViewMode";

const btnClass =
  "inline-flex h-7 w-7 items-center justify-center rounded-md transition focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[color:var(--ring)]";

export function AdminViewSwitcher({
  value,
  onChange,
}: {
  value: AdminViewMode;
  onChange: (mode: AdminViewMode) => void;
}) {
  return (
    <div
      className="inline-flex shrink-0 items-center gap-0.5 rounded-md border border-[color:var(--card-border)] bg-[color:var(--card-muted)] p-0.5"
      role="group"
      aria-label="View mode"
    >
      <button
        type="button"
        onClick={() => onChange("table")}
        className={[
          btnClass,
          value === "table"
            ? "bg-[color:var(--card)] text-[color:var(--foreground)]"
            : "text-[color:var(--muted)] hover:text-[color:var(--foreground)]",
        ].join(" ")}
        aria-pressed={value === "table"}
        aria-label="Table view"
      >
        <List className="h-3.5 w-3.5" strokeWidth={1.75} aria-hidden />
      </button>
      <button
        type="button"
        onClick={() => onChange("grid")}
        className={[
          btnClass,
          value === "grid"
            ? "bg-[color:var(--card)] text-[color:var(--foreground)]"
            : "text-[color:var(--muted)] hover:text-[color:var(--foreground)]",
        ].join(" ")}
        aria-pressed={value === "grid"}
        aria-label="Grid view"
      >
        <LayoutGrid className="h-3.5 w-3.5" strokeWidth={1.75} aria-hidden />
      </button>
    </div>
  );
}
