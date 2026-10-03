"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useMemo, useRef, useState } from "react";
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

export function AdminUserMenu() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const close = useCallback(() => setOpen(false), []);

  useClickOutside(rootRef, close, open);

  const label = useMemo(() => {
    if (!user) return "";
    return user.name?.trim() ? user.name.trim() : user.email;
  }, [user]);

  if (!user) return null;

  return (
    <div ref={rootRef} className="relative z-50">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-[color:var(--card-border)] bg-[color:var(--card-muted)] text-[10px] font-semibold text-[color:var(--foreground)] transition hover:bg-[color:var(--card-border)]"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="User menu"
        title={label}
      >
        {initials(label)}
      </button>

      {open ? (
        <div
          role="menu"
          className="absolute right-0 z-50 mt-1.5 w-52 overflow-hidden rounded-md border border-[color:var(--card-border)] bg-[color:var(--card)] text-[color:var(--foreground)] shadow-lg shadow-black/30"
        >
          <div className="px-3 py-2.5">
            <p className="truncate text-[13px] font-medium">{user.name ?? "Signed in"}</p>
            <p className="truncate text-[11px] text-[color:var(--muted)]">{user.email}</p>
          </div>
          <div className="h-px bg-[color:var(--card-border)]" />
          <Link
            role="menuitem"
            href="/dashboard"
            onClick={close}
            className="block px-3 py-2 text-[13px] text-[color:var(--muted)] transition hover:bg-[color:var(--card-muted)] hover:text-[color:var(--foreground)]"
          >
            User dashboard
          </Link>
          <Link
            role="menuitem"
            href="/"
            onClick={close}
            className="block px-3 py-2 text-[13px] text-[color:var(--muted)] transition hover:bg-[color:var(--card-muted)] hover:text-[color:var(--foreground)]"
          >
            View site
          </Link>
          <button
            role="menuitem"
            type="button"
            onClick={async () => {
              close();
              await logout();
              router.replace("/login");
              router.refresh();
            }}
            className="block w-full px-3 py-2 text-left text-[13px] text-[color:var(--muted)] transition hover:bg-[color:var(--card-muted)] hover:text-[color:var(--foreground)]"
          >
            Sign out
          </button>
        </div>
      ) : null}
    </div>
  );
}
