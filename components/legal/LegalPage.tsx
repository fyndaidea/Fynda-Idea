import type { ReactNode } from "react";
import Link from "next/link";
import { Container } from "@/components/ui";
import { pageDescClass, pageTitleClass } from "@/lib/ui-classes";

const LAST_UPDATED = "August 29, 2026";

export function LegalSection({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="space-y-2">
      <h2 className="text-base font-semibold text-[color:var(--foreground)]">{title}</h2>
      <div className="space-y-2 text-sm leading-relaxed text-[color:var(--muted)]">{children}</div>
    </section>
  );
}

export default function LegalPage({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <Container className="py-10 sm:py-12">
      <article className="max-w-3xl">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-[color:var(--muted)] transition hover:text-[color:var(--foreground)]"
        >
          <span aria-hidden>←</span> Back to home
        </Link>

        <p className="mt-6 text-xs font-semibold uppercase tracking-[0.22em] text-[color:var(--muted)]">Legal</p>
        <h1 className={`${pageTitleClass} mt-3 text-3xl sm:text-4xl`}>{title}</h1>
        <p className={`${pageDescClass} leading-7`}>{description}</p>
        <p className="mt-2 text-xs text-[color:var(--muted)]">Last updated: {LAST_UPDATED}</p>

        <div className="mt-10 space-y-8">{children}</div>
      </article>
    </Container>
  );
}
