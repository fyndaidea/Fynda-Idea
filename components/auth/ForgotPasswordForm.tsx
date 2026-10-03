"use client";

import Link from "next/link";
import { useState } from "react";
import { toast } from "@/lib/toast";
import MarketingShell from "@/components/marketing/MarketingShell";
import { SiteLogoMark } from "@/components/brand/SiteLogo";
import { useAuth } from "@/lib/auth-context";

export function ForgotPasswordForm() {
  const { resetPasswordForEmail } = useAuth();
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      toast.error("Enter your email.");
      return;
    }
    setBusy(true);
    const { error } = await resetPasswordForEmail(email.trim());
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
        <aside className="relative flex min-h-[42vh] flex-col justify-between px-8 py-10 text-white lg:min-h-[100dvh] lg:px-12 lg:py-14">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(99,102,241,0.25),transparent_60%),radial-gradient(circle_at_bottom,rgba(34,211,238,0.18),transparent_55%)]" />
          <div className="relative">
            <Link href="/" className="inline-flex items-center gap-3">
              <SiteLogoMark size={36} />
              <span className="text-lg font-semibold tracking-tight text-white">ynda</span>
            </Link>
          </div>
          <div className="relative max-w-md">
            <p className="text-[11px] font-semibold uppercase tracking-[0.35em] text-white/60">
              Reset password
            </p>
            <h1 className="mt-6 text-3xl font-semibold leading-[1.12] sm:text-4xl">
              We’ll email you a secure link to choose a new password.
            </h1>
          </div>
          <p className="relative text-sm text-white/40">© {new Date().getFullYear()} Fynda</p>
        </aside>

        <div className="relative flex min-h-[58vh] flex-col border-white/10 bg-black/10 lg:min-h-[100dvh] lg:border-l">
          <div className="flex flex-1 flex-col justify-center px-6 py-12 lg:px-14 xl:px-20">
            <div className="mx-auto w-full max-w-[420px] rounded-3xl border border-white/10 bg-white/5 p-6">
              <div className="mb-6 flex items-center justify-between">
                <Link href="/login" className="text-sm font-semibold text-white/70 hover:text-white">
                  ← Back to sign in
                </Link>
              </div>

              <h2 className="text-2xl font-semibold text-white">Forgot password</h2>
              <p className="mt-2 text-sm text-white/60">
                Enter the email you use for Fynda.
              </p>

              <form className="mt-8 space-y-4" onSubmit={handleSubmit}>
                <div>
                  <label
                    htmlFor="forgot-email"
                    className="text-xs font-semibold uppercase tracking-wider text-white/60"
                  >
                    Email
                  </label>
                  <input
                    id="forgot-email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@company.com"
                    className="mt-2 h-11 w-full rounded-2xl border border-white/10 bg-black/20 px-4 text-sm text-white outline-none transition focus:border-indigo-400/60 focus:ring-2 focus:ring-indigo-400/25"
                  />
                </div>
                <button
                  type="submit"
                  disabled={busy}
                  className="inline-flex h-11 w-full items-center justify-center rounded-2xl bg-white px-5 text-sm font-semibold text-zinc-900 transition hover:bg-zinc-100 disabled:opacity-60"
                >
                  {busy ? "Sending…" : "Send reset link"}
                </button>
              </form>

              <div className="mt-6 border-t border-white/10 pt-4 text-sm text-white/70">
                Remembered it?{" "}
                <Link href="/login" className="font-semibold text-white hover:underline">
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

