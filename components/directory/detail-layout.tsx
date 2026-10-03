import { ChevronLeft, ExternalLink } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";

/* ── Page shell ───────────────────────────────────────── */

export function DetailPageShell({
  hero,
  rail,
  children,
  footer,
}: {
  hero: ReactNode;
  rail: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <article className="scroll-pt-[calc(var(--site-header-h,56px)+1rem)]">
      <DetailBackLink />

      <div className="mt-5 lg:mt-6 lg:grid lg:grid-cols-[minmax(0,1fr)_280px] lg:items-start lg:gap-14 xl:gap-16">
        <div className="min-w-0">
          {hero}
          <div className="mt-10 lg:mt-12">{children}</div>
          {footer ? <div className="mt-12 border-t border-[color:var(--card-border)] pt-10">{footer}</div> : null}
        </div>

        <aside
          className={[
            "mt-8 space-y-4 lg:mt-0 lg:sticky lg:z-20 lg:self-start",
            "lg:top-[calc(var(--site-header-h,56px)+1.5rem)]",
            "lg:max-h-[calc(100dvh-var(--site-header-h,56px)-2rem)]",
            "site-scrollbar lg:overflow-y-auto lg:overscroll-y-contain",
          ].join(" ")}
        >
          {rail}
        </aside>
      </div>
    </article>
  );
}

export function DetailBackLink({
  href = "/ideas",
  label = "Back to ideas",
}: {
  href?: string;
  label?: string;
} = {}) {
  return (
    <Link
      href={href}
      className="inline-flex items-center gap-1.5 text-sm font-medium text-[color:var(--muted)] transition hover:text-[color:var(--foreground)]"
    >
      <ChevronLeft className="h-4 w-4" strokeWidth={1.5} aria-hidden />
      {label}
    </Link>
  );
}

/* ── Hero ───────────────────────────────────────────── */

export type DetailChip = { label: string; accent?: boolean };

export type DetailStat = { label: string; value: string; hint?: string };

export function DetailProfileHero({
  initials,
  avatar,
  chips,
  badge,
  title,
  tagline,
  footnote,
  stats,
  actions,
  highlights,
}: {
  initials: string;
  avatar?: ReactNode;
  chips: DetailChip[];
  badge?: ReactNode;
  title: string;
  tagline: string;
  footnote?: ReactNode;
  stats?: DetailStat[];
  actions?: ReactNode;
  highlights?: string[];
}) {
  return (
    <header className="border-b border-[color:var(--card-border)] pb-8 sm:pb-10">
      <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:gap-6">
        {avatar ? (
          avatar
        ) : (
          <div
            className="grid h-[4.5rem] w-[4.5rem] shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-[color:var(--accent)] to-[#e82b2b] text-xl font-bold text-white shadow-[0_4px_14px_var(--accent-glow)]"
            aria-hidden="true"
          >
            {initials}
          </div>
        )}

        <div className="min-w-0 flex-1">
          {chips.length > 0 ? (
            <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-[color:var(--muted)]">
              {chips.map((chip, i) => (
                <span key={chip.label} className="inline-flex items-center gap-2">
                  {i > 0 ? <span className="text-[color:var(--muted-2)]">·</span> : null}
                  <span className={chip.accent ? "font-medium text-[color:var(--accent)]" : undefined}>
                    {chip.label}
                  </span>
                </span>
              ))}
            </p>
          ) : null}

          {badge ? <div className="mt-3">{badge}</div> : null}

          <h1 className="mt-2 text-balance text-3xl font-bold tracking-tight text-[color:var(--foreground)] sm:text-4xl">
            {title}
          </h1>
          <p className="mt-3 max-w-2xl text-pretty text-lg leading-relaxed text-[color:var(--muted)]">
            {tagline}
          </p>
          {highlights && highlights.length > 0 ? (
            <ul className="mt-5 max-w-2xl space-y-2">
              {highlights.slice(0, 4).map((item) => (
                <li key={item} className="flex gap-2.5 text-sm leading-6 text-[color:var(--foreground)]/85">
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[color:var(--accent)]" aria-hidden />
                  {item}
                </li>
              ))}
            </ul>
          ) : null}
          {footnote ? <p className="mt-4 text-sm text-[color:var(--muted-2)]">{footnote}</p> : null}
        </div>
      </div>

      {actions ? <div className="mt-6 flex flex-col gap-2 sm:flex-row lg:hidden">{actions}</div> : null}

      {stats && stats.length > 0 ? (
        <dl className="mt-8 grid grid-cols-2 gap-6 sm:grid-cols-4">
          {stats.map((stat) => (
            <div key={stat.label}>
              <dt className="text-xs text-[color:var(--muted-2)]">{stat.label}</dt>
              <dd className="mt-1 text-base font-semibold text-[color:var(--foreground)]">{stat.value}</dd>
              {stat.hint ? <dd className="mt-0.5 text-xs text-[color:var(--muted)]">{stat.hint}</dd> : null}
            </div>
          ))}
        </dl>
      ) : null}
    </header>
  );
}

/* ── Rail cards ─────────────────────────────────────── */

export function DetailRailCard({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={[
        "border-b border-[color:var(--card-border)] pb-5 last:border-b-0",
        className,
      ].join(" ")}
    >
      {children}
    </div>
  );
}

export function DetailRailActions({ children }: { children: ReactNode }) {
  return (
    <DetailRailCard className="hidden space-y-2 lg:block">
      {children}
    </DetailRailCard>
  );
}

export function DetailRailSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <DetailRailCard>
      <h2 className="text-xs font-semibold uppercase tracking-wider text-[color:var(--muted-2)]">{title}</h2>
      <div className="mt-3">{children}</div>
    </DetailRailCard>
  );
}

export function DetailFactList({ items }: { items: { label: string; value: ReactNode }[] }) {
  return (
    <dl className="space-y-3.5">
      {items.map((item) => (
        <div key={item.label}>
          <dt className="text-xs text-[color:var(--muted-2)]">{item.label}</dt>
          <dd className="mt-0.5 text-sm font-medium text-[color:var(--foreground)]">{item.value}</dd>
        </div>
      ))}
    </dl>
  );
}

export function DetailSectionNav({ items }: { items: { href: string; label: string }[] }) {
  if (items.length === 0) return null;
  return (
    <nav aria-label="On this page">
      <ul className="space-y-0.5">
        {items.map((item) => (
          <li key={item.href}>
            <a
              href={item.href}
              className="block rounded-lg px-2 py-1.5 text-sm text-[color:var(--muted)] transition hover:bg-[color:var(--card-muted)] hover:text-[color:var(--foreground)]"
            >
              {item.label}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}

export function DetailRelatedList({
  items,
}: {
  items: { href: string; name: string; tagline: string; meta?: string }[];
}) {
  return (
    <ul className="space-y-3">
      {items.map((item) => (
        <li key={item.href}>
          <Link
            href={item.href}
            className="group block rounded-lg border border-transparent p-2 -mx-2 transition hover:border-[color:var(--card-border)] hover:bg-[color:var(--card-muted)]"
          >
            <p className="text-sm font-semibold text-[color:var(--foreground)] group-hover:text-[color:var(--accent)]">
              {item.name}
            </p>
            <p className="mt-0.5 line-clamp-2 text-xs leading-5 text-[color:var(--muted)]">{item.tagline}</p>
            {item.meta ? <p className="mt-1 text-[11px] text-[color:var(--muted-2)]">{item.meta}</p> : null}
          </Link>
        </li>
      ))}
    </ul>
  );
}

export function DetailInlineLinks({
  items,
}: {
  items: { label: string; href: string; external?: boolean }[];
}) {
  return (
    <ul className="space-y-2">
      {items.map((item) => (
        <li key={item.label}>
          <a
            href={item.href}
            target={item.external ? "_blank" : undefined}
            rel={item.external ? "noreferrer" : undefined}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-[color:var(--accent)] hover:underline"
          >
            {item.label}
            {item.external ? (
              <ExternalLink className="h-3 w-3 opacity-70" strokeWidth={1.4} aria-hidden />
            ) : null}
          </a>
        </li>
      ))}
    </ul>
  );
}

/* ── Body sections ──────────────────────────────────── */

export function DetailBodySection({
  id,
  title,
  lead,
  children,
}: {
  id?: string;
  title: string;
  lead?: string;
  children: ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-[calc(var(--site-header-h,56px)+1.5rem)]">
      <h2 className="text-xl font-bold tracking-tight text-[color:var(--foreground)]">{title}</h2>
      {lead ? <p className="mt-2 max-w-2xl text-sm leading-relaxed text-[color:var(--muted)]">{lead}</p> : null}
      <div className="mt-6">{children}</div>
    </section>
  );
}

export function DetailBodyStack({ children }: { children: ReactNode }) {
  return <div className="space-y-14 lg:space-y-16">{children}</div>;
}

export function DetailProse({ children }: { children: ReactNode }) {
  return (
    <div className="max-w-[68ch] text-[17px] leading-[1.75] text-[color:var(--foreground)]/85 whitespace-pre-wrap">
      {children}
    </div>
  );
}

export function DetailHighlightList({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="mt-8">
      <p className="text-sm font-semibold text-[color:var(--foreground)]">{title}</p>
      <ul className="mt-3 space-y-2">
        {items.map((item) => (
          <li key={item} className="flex gap-2 text-sm text-[color:var(--muted)]">
            <span className="text-[color:var(--accent)]">·</span>
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}

export function DetailFeatureList({ items }: { items: { title: string; description: string }[] }) {
  return (
    <ul className="grid gap-x-10 gap-y-7 sm:grid-cols-2">
      {items.map((item) => (
        <li key={item.title}>
          <h3 className="font-semibold text-[color:var(--foreground)]">{item.title}</h3>
          <p className="mt-1.5 text-sm leading-relaxed text-[color:var(--muted)]">{item.description}</p>
        </li>
      ))}
    </ul>
  );
}

export function DetailUseCaseList({
  items,
}: {
  items: { audience: string; title: string; description: string }[];
}) {
  return (
    <ul className="grid gap-6 sm:grid-cols-2">
      {items.map((item) => (
        <li key={item.title} className="border-l-2 border-[color:var(--accent-border)] pl-4">
          <p className="text-xs font-medium text-[color:var(--accent)]">{item.audience}</p>
          <h3 className="mt-1 font-semibold text-[color:var(--foreground)]">{item.title}</h3>
          <p className="mt-2 text-sm leading-relaxed text-[color:var(--muted)]">{item.description}</p>
        </li>
      ))}
    </ul>
  );
}

export function DetailPricingPlans({
  tiers,
}: {
  tiers: {
    name: string;
    price: string;
    period: string;
    description: string;
    features: string[];
    highlighted?: boolean;
  }[];
}) {
  return (
    <div className="grid gap-4 lg:grid-cols-3">
      {tiers.map((tier) => (
        <div
          key={tier.name}
          className={[
            "flex flex-col rounded-xl border p-5",
            tier.highlighted
              ? "border-[color:var(--accent-border)] bg-[color:var(--accent-muted)]/40 shadow-[var(--card-shadow)]"
              : "border-[color:var(--card-border)] bg-[color:var(--card)]",
          ].join(" ")}
        >
          <div className="flex items-center justify-between gap-2">
            <h3 className="font-semibold text-[color:var(--foreground)]">{tier.name}</h3>
            {tier.highlighted ? (
              <span className="rounded-full bg-[color:var(--accent)] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
                Popular
              </span>
            ) : null}
          </div>
          <p className="mt-3 text-2xl font-bold tracking-tight text-[color:var(--foreground)]">
            {tier.price}
            <span className="ml-1 text-sm font-normal text-[color:var(--muted)]">/{tier.period}</span>
          </p>
          <p className="mt-2 text-sm leading-relaxed text-[color:var(--muted)]">{tier.description}</p>
          <ul className="mt-5 flex-1 space-y-2 border-t border-[color:var(--card-border)] pt-4">
            {tier.features.map((f) => (
              <li key={f} className="flex gap-2 text-sm text-[color:var(--muted)]">
                <span className="text-[color:var(--accent)]">·</span>
                {f}
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}

export function DetailComparison({ strengths, tradeoffs }: { strengths: string[]; tradeoffs: string[] }) {
  return (
    <div className="grid gap-8 sm:grid-cols-2">
      <div>
        <h3 className="font-semibold text-[color:var(--foreground)]">Strengths</h3>
        <ul className="mt-4 space-y-2.5">
          {strengths.map((s, i) => (
            <li key={i} className="text-sm leading-relaxed text-[color:var(--muted)]">
              {s}
            </li>
          ))}
        </ul>
      </div>
      <div>
        <h3 className="font-semibold text-[color:var(--foreground)]">Tradeoffs</h3>
        <ul className="mt-4 space-y-2.5">
          {tradeoffs.map((s, i) => (
            <li key={i} className="text-sm leading-relaxed text-[color:var(--muted)]">
              {s}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export function DetailStepList({
  steps,
}: {
  steps: { step: number; title: string; description: string }[];
}) {
  return (
    <ol className="max-w-xl space-y-6">
      {steps.map((item) => (
        <li key={item.step} className="flex gap-4">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[color:var(--foreground)] text-xs font-bold text-[color:var(--background)]">
            {item.step}
          </span>
          <div className="pt-0.5">
            <h3 className="font-semibold text-[color:var(--foreground)]">{item.title}</h3>
            <p className="mt-1 text-sm leading-relaxed text-[color:var(--muted)]">{item.description}</p>
          </div>
        </li>
      ))}
    </ol>
  );
}

export function DetailFaqList({ items }: { items: { question: string; answer: string }[] }) {
  return (
    <div className="max-w-3xl divide-y divide-[color:var(--card-border)]">
      {items.map((faq) => (
        <details key={faq.question} className="group">
          <summary className="cursor-pointer list-none py-4 font-medium text-[color:var(--foreground)] marker:content-none [&::-webkit-details-marker]:hidden">
            {faq.question}
          </summary>
          <p className="pb-4 text-sm leading-relaxed text-[color:var(--muted)]">{faq.answer}</p>
        </details>
      ))}
    </div>
  );
}

export function DetailChangelog({
  entries,
}: {
  entries: { title: string; summary: string; date: string }[];
}) {
  return (
    <ul className="max-w-3xl space-y-5">
      {entries.map((entry) => (
        <li key={entry.title} className="flex gap-4 sm:gap-6">
          <time className="w-20 shrink-0 pt-0.5 text-xs font-medium tabular-nums text-[color:var(--muted-2)]">
            {entry.date}
          </time>
          <div className="min-w-0 border-l border-[color:var(--card-border)] pl-4 sm:pl-6">
            <h3 className="font-semibold text-[color:var(--foreground)]">{entry.title}</h3>
            <p className="mt-1 text-sm leading-relaxed text-[color:var(--muted)]">{entry.summary}</p>
          </div>
        </li>
      ))}
    </ul>
  );
}

export function DetailTagList({ items }: { items: string[] }) {
  return (
    <ul className="flex flex-wrap gap-2">
      {items.map((item) => (
        <li
          key={item}
          className="rounded-full border border-[color:var(--card-border)] bg-[color:var(--card)] px-3 py-1 text-xs font-medium text-[color:var(--foreground)]"
        >
          {item}
        </li>
      ))}
    </ul>
  );
}
