"use client";

import { useState } from "react";
import Dialog, { DialogFooterActions, submitFormById } from "@/components/ui/DialogShell";
import { inputClass, labelClass } from "@/lib/ui-classes";

type UtilityCard = {
  id: string;
  title: string;
  description: string;
  actionLabel: string;
};

const utilities: UtilityCard[] = [
  {
    id: "seed-admin",
    title: "Seed admin user",
    description:
      "Create an admin account or promote an existing user. Same behavior as npm run seed:admin.",
    actionLabel: "Open",
  },
];

export function UtilitiesAdminClient() {
  const [dialog, setDialog] = useState<"seed-admin" | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const closeDialog = () => {
    if (!submitting) {
      setDialog(null);
      setError(null);
    }
  };

  const submitSeedAdmin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    setSuccess(null);
    const fd = new FormData(e.currentTarget);
    try {
      const res = await fetch("/api/admin/utilities/seed-admin", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: fd.get("email"),
          password: fd.get("password"),
        }),
      });
      const data = (await res.json().catch(() => ({}))) as { detail?: string; error?: string };
      if (!res.ok) {
        setError(data.error ?? "Seed admin failed");
        return;
      }
      setDialog(null);
      setSuccess(data.detail?.trim() || "Admin user seed completed.");
    } catch {
      setError("Seed admin failed");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      {success ? (
        <div className="mb-6 whitespace-pre-wrap rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm leading-relaxed text-emerald-800">
          {success}
        </div>
      ) : null}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {utilities.map((utility) => (
          <button
            key={utility.id}
            type="button"
            onClick={() => {
              setError(null);
              setDialog(utility.id as "seed-admin");
            }}
            className="rounded-3xl border border-[color:var(--card-border)] bg-[color:var(--card)] p-5 text-left transition hover:border-[color:var(--accent-border)] hover:shadow-[var(--card-shadow)]"
          >
            <p className="text-base font-semibold text-[color:var(--foreground)]">{utility.title}</p>
            <p className="mt-2 text-sm leading-relaxed text-[color:var(--muted)]">
              {utility.description}
            </p>
            <span className="mt-4 inline-flex text-sm font-semibold text-[color:var(--accent)]">
              {utility.actionLabel} →
            </span>
          </button>
        ))}
      </div>

      {dialog === "seed-admin" ? (
        <Dialog
          title="Seed admin user"
          maxWidth="lg"
          onClose={closeDialog}
          closeDisabled={submitting}
          footer={
            <DialogFooterActions
              onCancel={closeDialog}
              onPrimary={() => submitFormById("seed-admin-form")}
              primaryLabel={submitting ? "Running…" : "Run"}
              primaryDisabled={submitting}
              cancelDisabled={submitting}
            />
          }
        >
          {error ? (
            <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
              {error}
            </div>
          ) : null}
          <form id="seed-admin-form" onSubmit={(e) => void submitSeedAdmin(e)} className="space-y-4">
            <p className="text-sm text-[color:var(--muted)]">
              Leave password empty to grant admin to an existing login only. Provide a password to
              create a new user or reset an existing one.
            </p>
            <label className="block space-y-1">
              <span className={labelClass}>Email</span>
              <input
                name="email"
                type="email"
                required
                autoComplete="email"
                className={inputClass}
                placeholder="you@example.com"
              />
            </label>
            <label className="block space-y-1">
              <span className={labelClass}>Password</span>
              <input
                name="password"
                type="password"
                autoComplete="new-password"
                className={inputClass}
                placeholder="Optional"
              />
            </label>
          </form>
        </Dialog>
      ) : null}
    </>
  );
}
