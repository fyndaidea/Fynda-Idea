"use client";
import { useAuthCaptcha } from "@/lib/auth/use-auth-captcha";

import Link from "next/link";
import { useState } from "react";
import { toast } from "@/lib/toast";
import MarketingShell from "@/components/marketing/MarketingShell";
import { SiteLogoMark } from "@/components/brand/SiteLogo";
import { useAuth } from "@/lib/auth-context";

export function ForgotPasswordForm() {
  const { resetPasswordForEmail } = useAuth();
  const captcha = useAuthCaptcha();
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!captcha.ready) return;
    if (!email.trim()) {
      toast.error("Enter your email.");
      return;
    }
    setBusy(true);
    const { error } = await captcha.run(() => resetPasswordForEmail(email.trim(), captcha.token));
    setBusy(false);
    if (error) {
      toast.error(error);
      return;
    }
    toast.success("If an account exists for that email, we sent a reset link.");
  };

  return (
    <MarketingShell>
      <div className="grid min-h-[100dvh] w-full grid-cols-1 bg-[color:var(--background)] text-[color:var(--foreground)] lg:grid-cols-2">
        <aside className="relative bg-[color:var(--background-warm,#f2eee8)] flex min-h-[42vh] flex-col justify-between px-8 py-10 text-[color:var(--foreground)] lg:min-h-[100dvh] lg:px-12 lg:py-14">
          <div className="relative">
            <Link href="/" className="inline-flex items-center gap-3">
              <SiteLogoMark size={36} />
              <span className="text-lg font-semibold tracking-tight text-[color:var(--foreground)]">ynda</span>
            </Link>
          </div>
          <div className="relative max-w-md">
            <p className="text-[11px] font-semibold uppercase tracking-[0.35em] text-[color:var(--muted)]">
              Reset password
            </p>
            <h1 className="mt-6 text-3xl font-semibold leading-[1.12] sm:text-4xl">
              We’ll email you a secure link to choose a new password.
            </h1>
          </div>
          <p className="relative text-sm text-[color:var(--muted)]">© {new Date().getFullYear()} Fynda</p>
        </aside>

        <div className="relative flex min-h-[58vh] flex-col border-[color:var(--border)] bg-[color:var(--background)] lg:min-h-[100dvh] lg:border-l">
          <div className="flex flex-1 flex-col justify-center px-6 py-12 lg:px-14 xl:px-20">
            <div className="mx-auto w-full max-w-[420px] rounded-3xl border border-[color:var(--border)] bg-[color:var(--card)] p-6">
              <div className="mb-6 flex items-center justify-between">
                <Link href="/login" className="text-sm font-semibold text-[color:var(--muted)] hover:text-[color:var(--foreground)]">
                  ← Back to sign in
                </Link>
              </div>

              <h2 className="text-2xl font-semibold text-[color:var(--foreground)]">Forgot password</h2>
              <p className="mt-2 text-sm text-[color:var(--muted)]">
                Enter the email you use for Fynda.
              </p>

              <form className="mt-8 space-y-4" onSubmit={handleSubmit}>
                <div>
                  <label
                    htmlFor="forgot-email"
                    className="text-xs font-semibold uppercase tracking-wider text-[color:var(--muted)]"
                  >
                    Email
                  </label>
                  <input
                    id="forgot-email"
                    name="email"
                    type="email"
                    required
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@company.com"
                    className="mt-2 h-11 w-full rounded-2xl border border-[color:var(--border)] bg-[color:var(--card)] px-4 text-sm text-[color:var(--foreground)] outline-none transition focus:border-indigo-400/60 focus:ring-2 focus:ring-indigo-400/25"
                  />
                </div>
                {captcha.element}
                <button
                  type="submit"
                  disabled={busy || !captcha.ready}
                  className="inline-flex h-11 w-full items-center justify-center rounded-2xl bg-[color:var(--foreground)] px-5 text-sm font-semibold text-[color:var(--background)] transition hover:opacity-90 disabled:opacity-60"
                >
                  {busy ? "Sending…" : "Send reset link"}
                </button>
              </form>

              <div className="mt-6 border-t border-[color:var(--border)] pt-4 text-sm text-[color:var(--muted)]">
                Remembered it?{" "}
                <Link href="/login" className="font-semibold text-[color:var(--foreground)] hover:underline">
                  Sign in
                </Link>
                .
              </div>
            </div>
          </div>
        </div>
      </div>
    </MarketingShell>
  );
}

