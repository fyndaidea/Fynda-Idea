import Link from "next/link";
import { Suspense } from "react";
import MarketingShell from "@/components/marketing/MarketingShell";
import SiteLogo from "@/components/brand/SiteLogo";
import { RegisterForm } from "@/components/auth/RegisterForm";
import { ShimmerBlock } from "@/components/ui/Shimmer";

function searchParamString(
  sp: Record<string, string | string[] | undefined>,
  key: string
): string | undefined {
  const v = sp[key];
  if (typeof v === "string") return v;
  if (Array.isArray(v) && v[0] !== undefined) return v[0];
  return undefined;
}

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const nextPath = searchParamString(sp, "next");
  return (
    <MarketingShell>
      <div className="grid min-h-[100dvh] w-full grid-cols-1 lg:grid-cols-2">
        <aside className="relative flex flex-col justify-between bg-[color:var(--background-warm)] px-8 py-10 lg:order-2 lg:px-14 lg:py-16">
          <Link href="/" className="inline-flex">
            <SiteLogo size={36} />
          </Link>

          <div className="max-w-md">
            <span className="inline-flex rounded-full bg-[color:var(--accent-muted)] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-[color:var(--accent)]">
              Get started
            </span>
            <h1 className="mt-6 text-3xl font-bold leading-tight sm:text-4xl">
              Create an account to save and submit ideas.
            </h1>
            <p className="mt-4 text-[15px] leading-relaxed text-[color:var(--muted)]">
              Favorites, submissions, and your dashboard — all in one place.
            </p>
          </div>

          <p className="text-sm text-[color:var(--muted-2)]">© {new Date().getFullYear()} Fynda</p>
        </aside>

        <div className="flex flex-col justify-center px-6 py-12 lg:order-1 lg:px-16 xl:px-24">
          <div className="mx-auto w-full max-w-[420px]">
            <Link
              href="/"
              className="mb-8 inline-block text-sm font-medium text-[color:var(--muted)] hover:text-[color:var(--foreground)]"
            >
              ← Back to home
            </Link>

            <div className="rounded-3xl border border-[color:var(--card-border)] bg-[color:var(--card)] p-8 shadow-[var(--card-shadow)]">
              <Suspense
                fallback={
                  <div className="space-y-3" aria-busy="true" aria-label="Loading form">
                    <ShimmerBlock className="h-10 w-full" rounded="rounded-lg" />
                    <ShimmerBlock className="h-10 w-full" rounded="rounded-lg" />
                    <ShimmerBlock className="h-10 w-full" rounded="rounded-lg" />
                  </div>
                }
              >
                <RegisterForm compact nextPath={nextPath} />
              </Suspense>

              <div className="mt-6 border-t border-[color:var(--card-border)] pt-5 text-sm text-[color:var(--muted)]">
                <span>Already have an account?</span>{" "}
                <Link href="/login" className="font-semibold text-[color:var(--foreground)] hover:text-[color:var(--accent)]">
                  Sign in
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </MarketingShell>
  );
}
