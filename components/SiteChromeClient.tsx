"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { SiteNavVisibility } from "@/lib/site-nav-visibility";
import { SiteSearchProvider } from "@/components/search/SiteSearch";
import { PRODUCT_CONTACT_EMAIL } from "@/lib/brand/product";
import AppBackground from "./AppBackground";
import HeaderHeightCSSVar from "./HeaderHeightCSSVar";
import SiteHeader from "./SiteHeader";
import { Container } from "./ui";

const HIDE_CHROME_PREFIXES = [
  "/admin",
  "/docs",
  "/login",
  "/register",
  "/forgot-password",
  "/reset-password",
];

function shouldHideChrome(pathname: string) {
  return HIDE_CHROME_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

type Props = {
  children: React.ReactNode;
  navVisibility: SiteNavVisibility;
};

export default function SiteChromeClient({ children, navVisibility }: Props) {
  const pathname = usePathname() || "/";
  const hide = shouldHideChrome(pathname);

  if (hide) return <>{children}</>;

  return (
    <SiteSearchProvider>
      <div className="flex h-dvh max-h-dvh flex-col overflow-hidden">
        <AppBackground />
        <HeaderHeightCSSVar />
        <SiteHeader navVisibility={navVisibility} />

        <div
          data-site-scroll
          className="site-scrollbar min-h-0 flex-1 overflow-y-auto overscroll-y-contain"
        >
          <div className="flex min-h-full flex-col">
            <div className="flex-1">{children}</div>

            <footer className="shrink-0 border-t border-[color:var(--card-border)] bg-[color:var(--background-warm)] py-5 sm:py-6">
              <Container className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
                <p className="text-xs text-[color:var(--muted)]">
                  © {new Date().getFullYear()}{" "}
                  <span className="font-semibold text-[color:var(--foreground)]">Fynda</span>. All rights
                  reserved.
                </p>
                <nav className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs" aria-label="Footer">
                  <a
                    href={`mailto:${PRODUCT_CONTACT_EMAIL}`}
                    className="font-medium text-[color:var(--muted)] transition hover:text-[color:var(--foreground)]"
                  >
                    Contact
                  </a>
                  <Link
                    href="/docs"
                    className="font-medium text-[color:var(--muted)] transition hover:text-[color:var(--foreground)]"
                  >
                    Docs
                  </Link>
                  <Link
                    href="/feedback"
                    className="font-medium text-[color:var(--muted)] transition hover:text-[color:var(--foreground)]"
                  >
                    Feedback
                  </Link>
                  <Link
                    href="/terms"
                    className="font-medium text-[color:var(--muted)] transition hover:text-[color:var(--foreground)]"
                  >
                    Terms
                  </Link>
                  <Link
                    href="/privacy"
                    className="font-medium text-[color:var(--muted)] transition hover:text-[color:var(--foreground)]"
                  >
                    Privacy
                  </Link>
                </nav>
              </Container>
            </footer>
          </div>
        </div>
      </div>
    </SiteSearchProvider>
  );
}
