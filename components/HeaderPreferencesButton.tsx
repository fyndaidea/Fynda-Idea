"use client";

import Link from "next/link";
import { Settings } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { PREFERENCES_DASHBOARD_QUERY } from "@/lib/auth/subscription-paths";

export function HeaderPreferencesButton() {
  const { user, loading } = useAuth();

  if (loading || !user) return null;

  return (
    <Link
      href={`/dashboard?${PREFERENCES_DASHBOARD_QUERY}`}
      className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-[color:var(--card-border)] text-[color:var(--muted)] transition hover:bg-[color:var(--card-muted)] hover:text-[color:var(--foreground)]"
      aria-label="Preferences"
      title="Preferences"
    >
      <Settings className="h-[18px] w-[18px]" strokeWidth={1.75} aria-hidden />
    </Link>
  );
}
