"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "@/lib/toast";
import { useAuth } from "@/lib/auth-context";

export function AdminSignOutButton() {
  const router = useRouter();
  const { logout } = useAuth();
  const [busy, setBusy] = useState(false);

  return (
    <button
      type="button"
      disabled={busy}
      onClick={async () => {
        setBusy(true);
        try {
          await logout();
        } catch {
          toast.error("Failed to sign out. Try again.");
          setBusy(false);
          return;
        }
        router.replace("/login");
      }}
      className="rounded-full border border-[color:var(--card-border)] bg-[color:var(--card-muted)] px-3 py-1.5 text-sm font-semibold text-[color:var(--foreground)]/90 transition hover:bg-[color:var(--card-muted)] hover:text-[color:var(--foreground)] disabled:opacity-60"
    >
      {busy ? "Signing out…" : "Sign out"}
    </button>
  );
}

