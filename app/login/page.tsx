import Link from "next/link";
import MarketingShell from "@/components/marketing/MarketingShell";
import SiteLogo from "@/components/brand/SiteLogo";
import { LoginForm } from "@/components/auth/LoginForm";

function searchParamString(
  sp: Record<string, string | string[] | undefined>,
  key: string
): string | undefined {
  const v = sp[key];
  if (typeof v === "string") return v;
  if (Array.isArray(v) && v[0] !== undefined) return v[0];
  return undefined;
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const nextPath = searchParamString(sp, "next");
  const errorParam = searchParamString(sp, "error");
  const initialAuthError = errorParam === "auth";
  const initialConfigureReason = searchParamString(sp, "reason") === "configure";
  const oauthError =
    errorParam && errorParam !== "auth"
      ? decodeURIComponent(errorParam.replace(/\+/g, " "))
      : undefined;

  return (
    <MarketingShell>
      <div className="grid min-h-[100dvh] w-full grid-cols-1 lg:grid-cols-2">
        <aside className="relative flex flex-col justify-between bg-[color:var(--background-warm)] px-8 py-10 lg:px-14 lg:py-16">
          <Link href="/" className="inline-flex">
            <SiteLogo size={36} />
          </Link>
          <div className="max-w-md">
            <span className="inline-flex rounded-full bg-[color:var(--accent-muted)] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-[color:var(--accent)]">
              Welcome back
            </span>
            <h1 className="mt-6 text-3xl font-bold leading-tight sm:text-4xl">
              Sign in to save ideas and manage your dashboard.
            </h1>
            <p className="mt-4 text-[15px] leading-relaxed text-[color:var(--muted)]">
              Favorites, submissions, and your profile — all in one place.
            </p>
          </div>
          <p className="text-sm text-[color:var(--muted-2)]">© {new Date().getFullYear()} Fynda</p>
        </aside>
        <div className="flex flex-col justify-center px-6 py-12 lg:px-16 xl:px-24">
          <div className="mx-auto w-full max-w-[420px]">
            <Link href="/" className="mb-8 inline-block text-sm font-medium text-[color:var(--muted)] hover:text-[color:var(--foreground)]">
              ← Back to home
            </Link>
            <div className="rounded-3xl border border-[color:var(--card-border)] bg-[color:var(--card)] p-8 shadow-[var(--card-shadow)]">
              <LoginForm
                compact
                nextPath={nextPath}
                initialAuthError={initialAuthError}
                initialConfigureReason={initialConfigureReason}
                oauthError={oauthError}
              />
              <div className="mt-6 border-t border-[color:var(--card-border)] pt-5 text-sm text-[color:var(--muted)]">
                <span>New here?</span>{" "}
                <Link href="/register" className="font-semibold text-[color:var(--foreground)] hover:text-[color:var(--accent)]">
                  Create account
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </MarketingShell>
  );
}
