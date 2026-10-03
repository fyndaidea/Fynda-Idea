"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import type { DocManifest } from "@/lib/docs/types";
import { slugToHref } from "@/lib/docs/slug-href";
import { useAuth } from "@/lib/auth-context";
import { adminBackHref, docsHref, isDocsFromAdmin } from "@/lib/docs/return-nav";

function parseActive(pathname: string): { activeAdmin: boolean; activeSlugKey: string } {
  if (!pathname.startsWith("/docs")) {
    return { activeAdmin: false, activeSlugKey: "" };
  }
  const rest = pathname.replace(/^\/docs\/?/, "").replace(/\/$/, "");
  if (!rest) {
    return { activeAdmin: false, activeSlugKey: "" };
  }
  if (rest === "admin" || rest.startsWith("admin/")) {
    const inner = rest === "admin" ? "" : rest.slice("admin/".length);
    return { activeAdmin: true, activeSlugKey: inner };
  }
  return { activeAdmin: false, activeSlugKey: rest };
}

type DocsNavProps = {
  manifest: DocManifest;
  showAdmin: boolean;
  activeAdmin: boolean;
  activeSlugKey: string;
  fromAdmin: boolean;
  className?: string;
};

function DocsNav({
  manifest,
  showAdmin,
  activeAdmin,
  activeSlugKey,
  fromAdmin,
  className,
}: DocsNavProps) {
  const linkHref = (realm: "user" | "admin", slug: string) =>
    docsHref(slugToHref(realm, slug), fromAdmin);

  return (
    <nav className={className} aria-label="Documentation">
      <div>
        <p className="mb-2 text-[0.65rem] font-bold uppercase tracking-[0.14em] text-[color:var(--muted)]">
          User guide
        </p>
        <ul className="space-y-0.5">
          {manifest.user.map((item) => {
            const active = !activeAdmin && item.slug === activeSlugKey;
            return (
              <li key={item.slug || "__root__"}>
                <Link
                  href={linkHref("user", item.slug)}
                  className={[
                    "block rounded-lg px-2 py-1.5 text-sm font-medium transition",
                    active
                      ? "bg-[color:var(--card-muted)] font-semibold text-[color:var(--accent)]"
                      : "text-[color:var(--muted)] hover:bg-[color:var(--card-muted)] hover:text-[color:var(--foreground)]",
                  ].join(" ")}
                >
                  {item.title}
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
      {showAdmin ? (
        <div>
          <p className="mb-2 text-[0.65rem] font-bold uppercase tracking-[0.14em] text-[color:var(--accent)]">
            Internal · Admin
          </p>
          <ul className="space-y-0.5">
            {manifest.admin.map((item) => {
              const active = activeAdmin && item.slug === activeSlugKey;
              return (
                <li key={item.slug || "__admin_root__"}>
                  <Link
                    href={linkHref("admin", item.slug)}
                    className={[
                      "block rounded-lg px-2 py-1.5 text-sm font-medium transition",
                      active
                        ? "bg-[color:var(--card-muted)] font-semibold text-[color:var(--accent)]"
                        : "text-[color:var(--muted)] hover:bg-[color:var(--card-muted)] hover:text-[color:var(--foreground)]",
                    ].join(" ")}
                  >
                    {item.title}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ) : null}
    </nav>
  );
}

type DocsShellProps = {
  children: React.ReactNode;
  manifest: DocManifest;
  showAdmin: boolean;
};

export function DocsShell({ children, manifest, showAdmin }: DocsShellProps) {
  const pathname = usePathname() || "/docs";
  const searchParams = useSearchParams();
  const { user, loading: authLoading } = useAuth();
  const { activeAdmin, activeSlugKey } = parseActive(pathname);

  const isAdmin = user?.role?.toLowerCase() === "admin";
  const fromAdmin =
    isDocsFromAdmin(searchParams) || (!authLoading && Boolean(user) && isAdmin);
  const backHref = fromAdmin ? adminBackHref(isAdmin) : "/";
  const backLabel = fromAdmin ? "Admin" : "Home";
  const docsHomeHref = docsHref("/docs", fromAdmin);

  const navProps = {
    manifest,
    showAdmin,
    activeAdmin,
    activeSlugKey,
    fromAdmin,
  };

  return (
    <div className="min-h-dvh bg-[color:var(--background)] text-[color:var(--foreground)]">
      <header className="sticky top-0 z-40 border-b border-[color:var(--card-border)] bg-[color:var(--background)]/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-3.5">
          <Link
            href={backHref}
            className="text-sm font-semibold text-[color:var(--muted)] transition hover:text-[color:var(--foreground)]"
          >
            ← {backLabel}
          </Link>
          <span className="text-[color:var(--card-border)]">/</span>
          <Link href={docsHomeHref} className="text-sm font-bold tracking-tight text-[color:var(--foreground)]">
            Documentation
          </Link>
        </div>
      </header>

      <div className="mx-auto flex max-w-6xl flex-col gap-8 px-4 py-8 lg:flex-row lg:gap-12 lg:py-10">
        <aside className="lg:w-64 lg:shrink-0">
          <details className="group rounded-xl border border-[color:var(--card-border)] bg-[color:var(--card)] p-3 shadow-sm lg:hidden [&_summary::-webkit-details-marker]:hidden">
            <summary className="flex cursor-pointer list-none items-center justify-between font-semibold text-[color:var(--foreground)]">
              Browse docs
              <span className="text-xs text-[color:var(--muted)] transition group-open:rotate-180">▼</span>
            </summary>
            <DocsNav {...navProps} className="mt-3 space-y-6" />
          </details>

          <div className="hidden lg:sticky lg:top-24 lg:block">
            <DocsNav {...navProps} className="space-y-6" />
          </div>
        </aside>

        <div className="min-w-0 flex-1">{children}</div>
      </div>
    </div>
  );
}
