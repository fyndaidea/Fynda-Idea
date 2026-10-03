"use client";

import { useEffect, useState } from "react";
import { toast } from "@/lib/toast";
import { useAuth } from "@/lib/auth-context";
import { btnPrimaryClass, inputClass, panelClass } from "@/lib/ui-classes";
import { ShimmerBlock } from "@/components/ui/Shimmer";

function PreferencesSkeleton() {
  return (
    <div className="space-y-6" aria-busy="true" aria-label="Loading preferences">
      <div className={`${panelClass} p-5 sm:p-6`}>
        <ShimmerBlock className="h-3 w-24" />
        <ShimmerBlock className="mt-2 h-6 w-40" />
        <ShimmerBlock className="mt-2 h-4 w-[90%]" />
        <div className="mt-6 space-y-5">
          <div className="space-y-2">
            <ShimmerBlock className="h-3 w-28" />
            <ShimmerBlock className="h-11 w-full" rounded="rounded-xl" />
          </div>
          <ShimmerBlock className="h-10 w-36" rounded="rounded-full" />
        </div>
      </div>
    </div>
  );
}

export default function PreferencesContent() {
  const { user, refreshProfile } = useAuth();
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const profileRes = await fetch("/api/profile", { credentials: "include" });
        const profileData = profileRes.ok
          ? ((await profileRes.json()) as { full_name?: string | null })
          : {};
        if (cancelled) return;
        setFullName(profileData.full_name ?? user?.name ?? "");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user?.id, user?.name]);

  const onSave = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ full_name: fullName.trim() || null }),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        toast.error(data.error || "Could not save preferences");
        return;
      }
      await refreshProfile();
      toast.success("Preferences saved");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <PreferencesSkeleton />;
  }

  return (
    <div className="space-y-6">
      <section className={`${panelClass} max-w-2xl p-5 sm:p-6`}>
        <p className="dash-kicker">Profile</p>
        <h2 className="mt-1 text-lg font-bold tracking-tight text-[color:var(--foreground)]">
          Display name
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-[color:var(--muted)]">
          How you appear across Fynda Idea — dashboard greetings and account menus.
        </p>

        <div className="mt-6 space-y-5">
          <label className="block space-y-1.5">
            <span className="text-sm font-semibold text-[color:var(--foreground)]">Full name</span>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className={`${inputClass} h-11`}
              placeholder="Your name"
              autoComplete="name"
            />
          </label>

          <button type="button" disabled={saving} onClick={onSave} className={btnPrimaryClass}>
            {saving ? "Saving…" : "Save preferences"}
          </button>
        </div>
      </section>
    </div>
  );
}
