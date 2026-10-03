"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "@/lib/toast";
import { AuthDivider } from "@/components/auth/AuthDivider";
import { OAuthButtons } from "@/components/auth/OAuthButtons";
import { useAuth } from "@/lib/auth-context";
import { resolveClientPostLoginPath } from "@/lib/auth/resolve-client-post-login";

async function syncProfileCookie() {
  try {
    await fetch("/api/auth/sync-profile", { method: "POST", credentials: "include" });
  } catch {
    /* non-fatal */
  }
}

export function RegisterForm({
  compact,
  nextPath,
}: {
  compact?: boolean;
  nextPath?: string;
}) {
  const router = useRouter();
  const { register, user, loading } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  const redirectNext = nextPath ?? "/dashboard";

  useEffect(() => {
    if (!loading && user) {
      void resolveClientPostLoginPath({ nextPath, role: user.role }).then((path) =>
        router.replace(path)
      );
    }
  }, [user, loading, router, nextPath]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !password) {
      toast.error("Fill in name, email, and password.");
      return;
    }
    if (password.length < 6) {
      toast.error("Password should be at least 6 characters.");
      return;
    }
    setBusy(true);
    const { error, needsEmailConfirm } = await register(email.trim(), password, name.trim(), {
      confirmNext: redirectNext,
    });
    if (error) {
      setBusy(false);
      toast.error(error);
      return;
    }
    if (needsEmailConfirm) {
      setBusy(false);
      toast.success("Check your email to confirm your account, then sign in.");
      router.replace("/login");
      return;
    }
    await syncProfileCookie();
    setBusy(false);
    router.replace(redirectNext);
  };

  if (!loading && user) {
    return null;
  }

  return (
    <div className={compact ? "w-full" : "mx-auto w-full max-w-md"}>
      {!compact ? (
        <>
          <h1 className="text-xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">
            Create account
          </h1>
          <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-300">
            Register with Google or email.
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
            Full name
          </span>
          <input
            name="name"
            type="text"
            autoComplete="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="h-11 w-full rounded-xl border border-[color:var(--card-border)] bg-[color:var(--background)] px-4 text-sm text-[color:var(--foreground)] outline-none transition focus:border-[color:var(--accent-border)] focus:ring-2 focus:ring-[color:var(--ring)]"
          />
        </label>
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
            autoComplete="new-password"
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
          {busy ? "Creating account…" : "Create account with email"}
        </button>
      </form>

      {!compact ? (
        <p className="mt-6 text-sm text-zinc-600 dark:text-zinc-300">
          Already have an account?{" "}
          <Link href="/login" className="font-semibold text-[color:var(--accent)] hover:text-[color:var(--accent-hover)]">
            Sign in
          </Link>
          .
        </p>
      ) : null}
    </div>
  );
}
