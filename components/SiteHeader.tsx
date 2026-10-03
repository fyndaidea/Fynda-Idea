"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Menu, X } from "lucide-react";
import type { SiteNavVisibility } from "@/lib/site-nav-visibility";
import SiteLogo from "@/components/brand/SiteLogo";
import { HeaderPreferencesButton } from "@/components/HeaderPreferencesButton";
import { cx } from "@/components/ui";
import UserMenu from "./UserMenu";

type NavLeaf = { href: string; label: string; match: (path: string) => boolean };

function buildNav(v: SiteNavVisibility): NavLeaf[] {
  const entries: NavLeaf[] = [];

  if (v.showIdeas) {
    entries.push({
      href: "/ideas",
      label: "Ideas",
      match: (p) => p === "/ideas" || p.startsWith("/ideas/"),
    });
  }
  if (v.showCategories) {
    entries.push({
      href: "/categories",
      label: "Categories",
      match: (p) => p === "/categories" || p.startsWith("/categories/"),
    });
  }
  if (v.showCollections) {
    entries.push({
      href: "/collections",
      label: "Collections",
      match: (p) => p === "/collections" || p.startsWith("/collections/"),
    });
  }

  return entries;
}

function navLinkClass(active: boolean) {
  return cx(
    "relative inline-flex h-9 items-center px-3 text-sm font-medium transition-colors",
    active
      ? "text-[color:var(--foreground)] after:absolute after:bottom-0 after:left-3 after:right-3 after:h-0.5 after:rounded-full after:bg-[color:var(--accent)]"
      : "text-[color:var(--muted)] hover:text-[color:var(--foreground)]"
  );
}

export default function SiteHeader({ navVisibility }: { navVisibility: SiteNavVisibility }) {
  const pathname = usePathname() || "/";
  const [mobileOpen, setMobileOpen] = useState(false);
  const navEntries = buildNav(navVisibility);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!mobileOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMobileOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [mobileOpen]);

  return (
    <header
      className="z-50 shrink-0 border-b border-[color:var(--card-border)] bg-[color:var(--background)]/92 backdrop-blur-md"
      data-site-header
    >
      <div className="relative mx-auto flex h-14 w-full max-w-[1280px] items-center gap-2 px-4 sm:gap-3">
        <Link href="/" className="relative z-10 flex min-w-0 shrink-0 items-center">
          <SiteLogo size={28} wordmark="ynda" className="gap-2 [&_span]:text-[13px] sm:gap-2.5 sm:[&_span]:text-sm" />
        </Link>

        {navEntries.length > 0 ? (
          <nav
            className="absolute left-1/2 hidden -translate-x-1/2 md:flex"
            aria-label="Primary"
          >
            <div className="flex items-center gap-0.5">
              {navEntries.map((entry) => (
                <Link key={entry.href} href={entry.href} className={navLinkClass(entry.match(pathname))}>
                  {entry.label}
                </Link>
              ))}
            </div>
          </nav>
        ) : null}

        <div className="flex-1" />

        <div className="relative z-10 flex shrink-0 items-center gap-1 sm:gap-2">
          <HeaderPreferencesButton />
          <Link
            href="/submit"
            className="hidden h-9 items-center rounded-full bg-[color:var(--accent)] px-4 text-sm font-semibold text-white shadow-[0_1px_6px_var(--accent-glow)] transition hover:bg-[color:var(--accent-hover)] md:inline-flex"
          >
            Submit an idea
          </Link>
          <UserMenu />

          {navEntries.length > 0 ? (
            <button
              type="button"
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-[color:var(--card-border)] text-[color:var(--foreground)] md:hidden"
              aria-expanded={mobileOpen}
              aria-label={mobileOpen ? "Close menu" : "Open menu"}
              onClick={() => setMobileOpen((v) => !v)}
            >
              {mobileOpen ? (
                <X className="h-5 w-5" strokeWidth={2} aria-hidden />
              ) : (
                <Menu className="h-5 w-5" strokeWidth={2} aria-hidden />
              )}
            </button>
          ) : null}
        </div>
      </div>

      {mobileOpen && navEntries.length > 0 ? (
        <nav
          className="border-t border-[color:var(--card-border)] bg-[color:var(--card)] px-4 py-3 md:hidden"
          aria-label="Mobile"
        >
          <div className="flex flex-col gap-0.5">
            <Link
              href="/submit"
              className="mb-1 inline-flex h-10 items-center justify-center rounded-lg bg-[color:var(--accent)] px-3 text-sm font-semibold text-white transition hover:bg-[color:var(--accent-hover)]"
            >
              Submit an idea
            </Link>
            {navEntries.map((entry) => (
              <Link
                key={entry.href}
                href={entry.href}
                className={cx(
                  "rounded-lg px-3 py-2.5 text-sm font-medium",
                  entry.match(pathname)
                    ? "bg-[color:var(--accent-muted)] text-[color:var(--accent)]"
                    : "text-[color:var(--foreground)] hover:bg-[color:var(--card-muted)]"
                )}
              >
                {entry.label}
              </Link>
            ))}
          </div>
        </nav>
      ) : null}
    </header>
  );
}
