"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useMemo, useRef, useState } from "react";
import { User } from "lucide-react";
import { useClickOutside } from "@/lib/hooks/use-click-outside";
import { useAuth } from "@/lib/auth-context";

function initials(nameOrEmail: string) {
  const s = nameOrEmail.trim();
  if (!s) return "?";
  const parts = s.split(/\s+/).filter(Boolean);
  const letters =
    parts.length >= 2
      ? `${parts[0]![0] ?? ""}${parts[1]![0] ?? ""}`
      : `${s[0] ?? ""}${s[1] ?? ""}`;
  return letters.toUpperCase();
}

export default function UserMenu() {
  const router = useRouter();
  const { user, loading, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const close = useCallback(() => setOpen(false), []);

  useClickOutside(rootRef, close, open);

  const label = useMemo(() => {
    if (!user) return "Account";
    return user.name?.trim() ? user.name.trim() : user.email;
  }, [user]);

  if (loading) {
    return (
      <span
        className="avatar-shimmer h-9 w-9 shrink-0 rounded-full border border-[color:var(--card-border)] shadow-sm"
        role="status"
        aria-label="Loading account"
      >
        <span className="avatar-shimmer__sweep" aria-hidden />
      </span>
    );
  }

  const isAdmin = user?.role === "admin";

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-[color:var(--card-border)] bg-[color:var(--card)] text-xs font-bold text-[color:var(--foreground)] shadow-sm transition hover:bg-[color:var(--card-muted)]"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Account menu"
        title={label}
      >
        {user ? initials(label) : <User className="h-4 w-4" strokeWidth={1.75} aria-hidden />}
      </button>

      {open ? (
        <div
          role="menu"
          className="absolute right-0 mt-2 w-56 overflow-hidden rounded-2xl border border-[color:var(--card-border)] bg-[color:var(--card)] text-[color:var(--foreground)] shadow-[var(--card-shadow)]"
        >
          {user ? (
            <>
              <div className="px-4 py-3">
                <p className="truncate text-sm font-semibold">{user.name ?? "Signed in"}</p>
                <p className="truncate text-xs text-[color:var(--muted)]">{user.email}</p>
              </div>
              <div className="h-px bg-[color:var(--card-border)]" />
              <Link
                role="menuitem"
                href="/dashboard"
                onClick={close}
                className="block px-4 py-2 text-sm font-medium text-[color:var(--muted)] hover:bg-[color:var(--card-muted)] hover:text-[color:var(--foreground)]"
              >
                Dashboard
              </Link>
              {isAdmin ? (
                <Link
                  role="menuitem"
                  href="/admin"
                  onClick={close}
                  className="block px-4 py-2 text-sm font-medium text-[color:var(--muted)] hover:bg-[color:var(--card-muted)] hover:text-[color:var(--foreground)]"
                >
                  Admin dashboard
                </Link>
              ) : null}
              <button
                role="menuitem"
                type="button"
                onClick={async () => {
                  close();
                  await logout();
                  router.replace("/");
                  router.refresh();
                }}
                className="block w-full px-4 py-2 text-left text-sm font-medium text-[color:var(--muted)] hover:bg-[color:var(--card-muted)] hover:text-[color:var(--foreground)]"
              >
                Sign out
              </button>
            </>
          ) : (
            <>
              <Link
                role="menuitem"
                href="/login"
                onClick={close}
                className="block px-4 py-2 text-sm font-medium text-[color:var(--muted)] hover:bg-[color:var(--card-muted)] hover:text-[color:var(--foreground)]"
              >
                Sign in
              </Link>
              <Link
                role="menuitem"
                href="/register"
                onClick={close}
                className="block px-4 py-2 text-sm font-medium text-[color:var(--muted)] hover:bg-[color:var(--card-muted)] hover:text-[color:var(--foreground)]"
              >
                Create account
              </Link>
            </>
          )}
        </div>
      ) : null}
    </div>
  );
}
