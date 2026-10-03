"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Menu, Moon, Sun } from "lucide-react";
import { useAdminTheme } from "@/components/admin/admin-theme-context";
import { getAdminHeaderMeta } from "@/lib/admin/header-meta";
import { ADMIN_NAV_FLAT } from "@/lib/admin/nav";
import { AdminUserMenu } from "./AdminUserMenu";

function AdminThemeSwitcher() {
  const ctx = useAdminTheme();
  if (!ctx) return null;
  const { theme, toggleTheme } = ctx;
  const isDark = theme === "dark";

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className="inline-flex h-8 w-8 items-center justify-center rounded-md text-[color:var(--muted)] transition hover:bg-[color:var(--card-muted)] hover:text-[color:var(--foreground)]"
      aria-label={isDark ? "Switch to light theme" : "Switch to dark theme"}
      title={isDark ? "Light theme" : "Dark theme"}
    >
      {isDark ? (
        <Sun className="h-4 w-4" strokeWidth={1.75} aria-hidden />
      ) : (
        <Moon className="h-4 w-4" strokeWidth={1.75} aria-hidden />
      )}
    </button>
  );
}

export function AdminTopBar() {
  const pathname = usePathname() ?? "/admin";
  const { title, titleHref, subtitle } = getAdminHeaderMeta(pathname);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const titleEl =
    titleHref != null ? (
      <Link
        href={titleHref}
        className="block min-w-0 truncate text-[14px] font-medium text-[color:var(--foreground)] transition hover:text-[color:var(--accent)]"
      >
        {title}
      </Link>
    ) : (
      <span className="block truncate text-[14px] font-medium text-[color:var(--foreground)]">{title}</span>
    );

  return (
    <header className="relative z-40 shrink-0 border-b border-[color:var(--card-border)] bg-[color:var(--card)]">
      <div className="flex h-[var(--admin-topbar-h)] items-center gap-3 px-3 sm:px-4 lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(20rem,28rem)_minmax(0,1fr)]">
        <button
          type="button"
          onClick={() => setMobileNavOpen((open) => !open)}
          className="inline-flex h-8 w-8 items-center justify-center rounded-md text-[color:var(--muted)] transition hover:bg-[color:var(--card-muted)] hover:text-[color:var(--foreground)] lg:hidden"
          aria-label="Toggle navigation"
          aria-expanded={mobileNavOpen}
        >
          <Menu className="h-4 w-4" strokeWidth={1.75} aria-hidden />
        </button>

        <div className="min-w-0 shrink-0 leading-tight lg:justify-self-start">
          {titleEl}
          {subtitle ? (
            <p className="truncate text-[10px] text-[color:var(--muted-2)]">{subtitle}</p>
          ) : null}
        </div>

        <div className="flex min-w-0 flex-1 lg:w-full" />

        <div className="flex shrink-0 items-center gap-1.5 lg:justify-self-end">
          <AdminThemeSwitcher />
          <AdminUserMenu />
        </div>
      </div>

      {mobileNavOpen ? (
        <div className="admin-scrollbar max-h-[50vh] overflow-y-auto border-t border-[color:var(--card-border)] px-3 py-2 lg:hidden">
          <div className="grid grid-cols-2 gap-1 sm:grid-cols-3">
            {ADMIN_NAV_FLAT.map((item) => {
              const active = pathname === item.href || (item.href !== "/admin" && pathname.startsWith(`${item.href}/`));
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileNavOpen(false)}
                  className={[
                    "rounded-md px-2.5 py-2 text-[13px] font-medium transition",
                    active
                      ? "bg-[color:var(--accent-muted)] text-[color:var(--foreground)]"
                      : "text-[color:var(--muted)] hover:bg-[color:var(--card-muted)] hover:text-[color:var(--foreground)]",
                  ].join(" ")}
                >
                  <span className="block truncate">{item.label}</span>
                  {item.secondary ? (
                    <span className="mt-0.5 block truncate text-[10px] font-normal text-[color:var(--muted-2)]">
                      {item.secondary}
                    </span>
                  ) : null}
                </Link>
              );
            })}
          </div>
        </div>
      ) : null}
    </header>
  );
}
