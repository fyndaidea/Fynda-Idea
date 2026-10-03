import Link from "next/link";
import SiteLogo from "@/components/brand/SiteLogo";
import { Container } from "@/components/ui";
import { PRODUCT_TAGLINE, PRODUCT_WORDMARK } from "@/lib/brand/product";

export default function HomeHero({ ideaCount }: { ideaCount: number }) {
  return (
    <section className="relative min-h-[min(100dvh,880px)] overflow-hidden">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_120%_80%_at_20%_-10%,color-mix(in_oklab,var(--accent)_22%,transparent),transparent_55%),radial-gradient(ellipse_90%_70%_at_90%_10%,color-mix(in_oklab,var(--accent)_12%,transparent),transparent_50%),linear-gradient(180deg,var(--background-warm)_0%,var(--background)_55%,var(--background)_100%)]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.35] [background-image:linear-gradient(color-mix(in_oklab,var(--foreground)_6%,transparent)_1px,transparent_1px),linear-gradient(90deg,color-mix(in_oklab,var(--foreground)_6%,transparent)_1px,transparent_1px)] [background-size:48px_48px] [mask-image:radial-gradient(ellipse_70%_60%_at_50%_30%,black,transparent)]"
      />

      <Container className="relative flex min-h-[min(100dvh,880px)] flex-col justify-center py-20 sm:py-28">
        <div className="max-w-2xl animate-[fade-up_0.7s_ease_both]">
          <SiteLogo size={48} wordmark="ynda" className="mb-8 gap-3 [&_span]:text-2xl sm:[&_span]:text-3xl" />
          <h1 className="sr-only">{PRODUCT_WORDMARK}</h1>
          <p className="max-w-xl text-xl font-medium leading-relaxed tracking-tight text-[color:var(--foreground)] sm:text-2xl">
            {PRODUCT_TAGLINE}
          </p>
          <p className="mt-4 max-w-lg text-[15px] leading-relaxed text-[color:var(--muted)]">
            {ideaCount > 0
              ? `${ideaCount} curated idea${ideaCount === 1 ? "" : "s"} ready to explore.`
              : "Browse the collection, save favorites, and submit your own."}
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link
              href="/ideas"
              className="inline-flex h-12 items-center justify-center rounded-full bg-[color:var(--accent)] px-7 text-sm font-semibold text-white shadow-[0_2px_12px_var(--accent-glow)] transition hover:bg-[color:var(--accent-hover)]"
            >
              Browse ideas
            </Link>
            <Link
              href="/submit"
              className="inline-flex h-12 items-center justify-center rounded-full border border-[color:var(--card-border)] bg-[color:var(--card)] px-7 text-sm font-semibold text-[color:var(--foreground)] transition hover:bg-[color:var(--card-muted)]"
            >
              Submit an idea
            </Link>
          </div>
        </div>
      </Container>
    </section>
  );
}
