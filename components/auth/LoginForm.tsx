"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "@/lib/toast";
import { AuthDivider } from "@/components/auth/AuthDivider";
import { OAuthButtons } from "@/components/auth/OAuthButtons";
import { useAuth } from "@/lib/auth-context";
import { resolveClientPostLoginPath } from "@/lib/auth/resolve-client-post-login";

async function fetchProfileRole(): Promise<string | null> {
  try {
    const res = await fetch("/api/profile", { credentials: "include" });
    if (!res.ok) return null;
    const data = (await res.json()) as { role?: string | null };
    return data.role ?? null;
  } catch {
    return null;
  }
}

async function syncProfileCookie() {
  try {
    await fetch("/api/auth/sync-profile", { method: "POST", credentials: "include" });
  } catch {
    /* non-fatal */
  }
}

export function LoginForm({
  compact,
  nextPath,
  initialAuthError,
  initialConfigureReason,
  oauthError,
}: {
  compact?: boolean;
  nextPath?: string;
  initialAuthError?: boolean;
  initialConfigureReason?: boolean;
  oauthError?: string;
}) {
  const router = useRouter();
  const { login, user, loading } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!loading && user) {
      void (async () => {
        const role = user.role ?? (await fetchProfileRole());
        router.replace(await resolveClientPostLoginPath({ nextPath, role }));
      })();
    }
  }, [user, loading, router, nextPath]);

  useEffect(() => {
    if (!initialAuthError || typeof window === "undefined") return;
    toast.error("Sign-in link expired or is invalid. Try again.");
    const q = new URLSearchParams(window.location.search);
    q.delete("error");
    const path = `${window.location.pathname}${q.size ? `?${q}` : ""}`;
    window.history.replaceState(null, "", path);
  }, [initialAuthError]);

  useEffect(() => {
    if (!oauthError || typeof window === "undefined") return;
    toast.error(oauthError);
    const q = new URLSearchParams(window.location.search);
    q.delete("error");
    const path = `${window.location.pathname}${q.size ? `?${q}` : ""}`;
    window.history.replaceState(null, "", path);
  }, [oauthError]);

  useEffect(() => {
    if (!initialConfigureReason) return;
    toast.message(
      "Supabase env was not detected by the server (or this link is stale). Confirm NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY in `.env`, restart `npm run dev`, then try again."
    );
    if (typeof window === "undefined") return;
    const q = new URLSearchParams(window.location.search);
    q.delete("reason");
    const next = `${window.location.pathname}${q.size ? `?${q}` : ""}`;
    window.history.replaceState(null, "", next);
  }, [initialConfigureReason]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      toast.error("Enter email and password.");
      return;
    }
    setBusy(true);
    const { error } = await login(email.trim(), password);
    if (error) {
      setBusy(false);
      toast.error(error);
      return;
    }
    await syncProfileCookie();
    const role = await fetchProfileRole();
    setBusy(false);
    router.replace(await resolveClientPostLoginPath({ nextPath, role }));
  };

  if (!loading && user) {
    return null;
  }

  const redirectNext = nextPath ?? "/dashboard";

  return (
    <div className={compact ? "w-full" : "mx-auto w-full max-w-md"}>
      {!compact ? (
        <>
          <h1 className="text-xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">
            Sign in
          </h1>
          <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-300">
            Sign in to save ideas, manage submissions, and open your dashboard.
          </p>
        </>
      ) : null}

      <div className={compact ? "space-y-0" : "mt-8"}>
        <OAuthButtons next={redirectNext} disabled={busy || loading} />
        <AuthDivider />
      </div>

      <form className="space-y-4" onSubmit={handleSubmit}>
        <label className="space-y-1 block">
          <span className="text-sm font-medium text-zinc-800 dark:text-zinc-200">
            Email
          </span>
          <input
            name="email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="h-11 w-full rounded-xl border border-[color:var(--card-border)] bg-[color:var(--background)] px-4 text-sm text-[color:var(--foreground)] outline-none transition focus:border-[color:var(--accent-border)] focus:ring-2 focus:ring-[color:var(--ring)]"
          />
        </label>
        <label className="space-y-1 block">
          <span className="text-sm font-medium text-zinc-800 dark:text-zinc-200">
            Password
          </span>
          <input
            name="password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="h-11 w-full rounded-xl border border-[color:var(--card-border)] bg-[color:var(--background)] px-4 text-sm text-[color:var(--foreground)] outline-none transition focus:border-[color:var(--accent-border)] focus:ring-2 focus:ring-[color:var(--ring)]"
          />
        </label>
        <button
          type="submit"
          disabled={busy || loading}
          className="inline-flex h-11 w-full items-center justify-center rounded-full bg-[color:var(--accent)] px-5 text-sm font-semibold text-white shadow-[0_2px_8px_var(--accent-glow)] transition hover:bg-[color:var(--accent-hover)] disabled:opacity-60"
        >
          {busy ? "Signing in…" : "Continue with email"}
        </button>
      </form>

      <div className={compact ? "mt-3 flex justify-end" : "mt-4 flex justify-end"}>
        <Link
          href="/forgot-password"
          className="text-sm font-medium text-zinc-600 underline-offset-2 hover:text-zinc-900 hover:underline dark:text-zinc-300 dark:hover:text-white"
        >
          Forgot password?
        </Link>
      </div>

      {!compact ? (
        <p className="mt-6 text-sm text-zinc-600 dark:text-zinc-300">
          New here?{" "}
          <Link href="/register" className="font-semibold text-[color:var(--accent)] hover:text-[color:var(--accent-hover)]">
            Create an account
          </Link>
          .
        </p>
      ) : null}
    </div>
  );
}
