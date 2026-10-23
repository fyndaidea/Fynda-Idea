"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { toast } from "@/lib/toast";
import MarketingShell from "@/components/marketing/MarketingShell";
import { SiteLogoMark } from "@/components/brand/SiteLogo";
import { createClient } from "@/lib/supabase/client";

export function ResetPasswordForm() {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);

  const [sessionState, setSessionState] = useState<"checking" | "ready" | "invalid">("checking");

  useEffect(() => {
    let active = true;
    const invalidLink = new URLSearchParams(window.location.search).has("error");
    const hash = new URLSearchParams(window.location.hash.replace(/^#/, ""));
    const accessToken = hash.get("access_token");
    const refreshToken = hash.get("refresh_token");
    const fromHash = accessToken && refreshToken
      ? supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken }).then(() => {
          window.history.replaceState(null, "", window.location.pathname + window.location.search);
        })
      : Promise.resolve();
    void fromHash.then(() => supabase.auth.getUser()).then(({ data, error }) => {
      if (active) setSessionState(!invalidLink && !error && data.user ? "ready" : "invalid");
    }).catch(() => { if (active) setSessionState("invalid"); });
    return () => { active = false; };
  }, [supabase]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (sessionState !== "ready" || busy) return;
    if (password.length < 6) {
      toast.error("Password should be at least 6 characters.");
      return;
    }
    if (password !== confirm) {
      toast.error("Passwords do not match.");
      return;
    }
    setBusy(true);
    try {
      const { data, error: sessionError } = await supabase.auth.getUser();
      if (sessionError || !data.user) {
        setSessionState("invalid");
        return;
      }
      const { error } = await supabase.auth.updateUser({ password });
      if (error) { toast.error(error.message); return; }
      toast.success("Password updated. Sign in with your new password.");
      await supabase.auth.signOut({ scope: "local" });
      router.replace("/login");
      router.refresh();
    } catch {
      toast.error("Unable to update your password. Please try again.");
    } finally {
      setBusy(false);
    }
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
              New password
            </p>
            <h1 className="mt-6 text-3xl font-semibold leading-[1.12] sm:text-4xl">
              Choose a strong password you haven’t used here before.
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

              <h2 className="text-2xl font-semibold text-[color:var(--foreground)]">Set new password</h2>
              <p className="mt-2 text-sm text-[color:var(--muted)]">
                {sessionState === "checking" ? "Checking your reset link…" : sessionState === "invalid" ? "This reset link is missing or expired. Request a new link to continue." : "Enter and confirm your new password."}
              </p>

              {sessionState === "invalid" && (
                <Link href="/forgot-password" className="mt-4 inline-block font-semibold underline">Request a new reset link</Link>
              )}
              <form className="mt-8 space-y-4" onSubmit={handleSubmit}>
                <div>
                  <label
                    htmlFor="new-password"
                    className="text-xs font-semibold uppercase tracking-wider text-[color:var(--muted)]"
                  >
                    New password
                  </label>
                  <input
                    id="new-password"
                    type="password"
                    required
                    minLength={6}
                    disabled={busy || sessionState !== "ready"}
                    autoComplete="new-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="mt-2 h-11 w-full rounded-2xl border border-[color:var(--border)] bg-[color:var(--card)] px-4 text-sm text-[color:var(--foreground)] outline-none transition focus:border-indigo-400/60 focus:ring-2 focus:ring-indigo-400/25"
                  />
                </div>
                <div>
                  <label
                    htmlFor="confirm-password"
                    className="text-xs font-semibold uppercase tracking-wider text-[color:var(--muted)]"
                  >
                    Confirm password
                  </label>
                  <input
                    id="confirm-password"
                    type="password"
                    required
                    minLength={6}
                    disabled={busy || sessionState !== "ready"}
                    autoComplete="new-password"
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    className="mt-2 h-11 w-full rounded-2xl border border-[color:var(--border)] bg-[color:var(--card)] px-4 text-sm text-[color:var(--foreground)] outline-none transition focus:border-indigo-400/60 focus:ring-2 focus:ring-indigo-400/25"
                  />
                </div>
                <button
                  type="submit"
                  disabled={busy || sessionState !== "ready"}
                  className="inline-flex h-11 w-full items-center justify-center rounded-2xl bg-[color:var(--foreground)] px-5 text-sm font-semibold text-[color:var(--background)] transition hover:opacity-90 disabled:opacity-60"
                >
                  {busy ? "Saving…" : "Update password"}
                </button>
              </form>

              <div className="mt-6 border-t border-[color:var(--border)] pt-4 text-sm text-[color:var(--muted)]">
                Want to sign in instead?{" "}
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

