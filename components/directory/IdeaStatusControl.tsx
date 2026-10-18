"use client";

import Link from "next/link";
import "./idea-detail.css";
import { useEffect, useId, useRef, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { IDEA_PROGRESS_GROUPS, type IdeaProgressStatus } from "@/lib/ideas/progress";
import { ShimmerBlock } from "@/components/ui/Shimmer";

export function IdeaStatusControl({ ideaId, initial, onChange }: {
  ideaId: string;
  initial?: { userId: string; status: IdeaProgressStatus | null };
  onChange?: (status: IdeaProgressStatus | null) => void;
}) {
  const { user, loading } = useAuth();
  const id = useId();
  const [record, setRecord] = useState<{ userId: string; status: IdeaProgressStatus | null } | null>(initial ?? null);
  const [busy, setBusy] = useState(false);
  const [pendingStatus, setPendingStatus] = useState<IdeaProgressStatus | null | undefined>();
  const owner = useRef(user?.id);
  useEffect(() => { owner.current = user?.id; }, [user?.id]);
  const [error, setError] = useState<string | null>(null);
  const [reload, setReload] = useState(0);
  const userId = user?.id;

  useEffect(() => {
    if (loading || !userId) return;
    const controller = new AbortController();
    void (async () => {
      try {
        const response = await fetch(`/api/idea-progress?ideaId=${encodeURIComponent(ideaId)}`, { credentials: "include", cache: "no-store", signal: controller.signal });
        if (!response.ok) throw new Error("Could not load your status.");
        const data = await response.json();
        if (!controller.signal.aborted) { setRecord({ userId, status: data.progress[0]?.status ?? null }); setError(null); }
      } catch { if (!controller.signal.aborted) setError("Could not load your status."); }
    })();
    return () => controller.abort();
  }, [ideaId, loading, reload, userId]);

  if (loading) return <ShimmerBlock className="h-9 w-48" rounded="rounded-lg" label="Loading your idea status" />;
  if (!user) return <Link className="idea-personal-status-login" href={`/login?next=${encodeURIComponent(typeof window !== "undefined" ? window.location.pathname : "/ideas")}`}>Sign in to track this idea</Link>;
  const current = record?.userId === user.id ? record : initial?.userId === user.id ? initial : null;
  const ready = current !== null;
  return <div className="idea-personal-status">
    <label htmlFor={id}>My status</label>
    <select id={id} aria-label="My idea status" disabled={busy || !ready} value={busy && pendingStatus !== undefined ? pendingStatus ?? "" : ready ? current?.status ?? "" : ""} onChange={async (event) => {
      const next = (event.target.value || null) as IdeaProgressStatus | null;
      setPendingStatus(next); setBusy(true); setError(null);
      try {
        const response = await fetch("/api/idea-progress", { method: "PATCH", credentials: "include", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ideaId, status: next }) });
        const data = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(data.error || "Could not save your status.");
        if (owner.current === user.id) { setRecord({ userId: user.id, status: data.status }); onChange?.(data.status); }
      } catch (error) { if (owner.current === user.id) setError(error instanceof Error ? error.message : "Could not save your status."); } finally { setBusy(false); setPendingStatus(undefined); }
    }}>
      <option value="">{ready ? "Not tracking" : "Loading…"}</option>
      {IDEA_PROGRESS_GROUPS.map((group) => <optgroup key={group.name} label={group.name}>{group.options.map((status) => <option key={status} value={status}>{status}</option>)}</optgroup>)}
    </select>
    <span className="idea-personal-status-hint" aria-live="polite">{busy ? "Saving…" : "Private · on your dashboard"}</span>
    {error ? <p role="alert">{error}{!ready ? <button type="button" onClick={() => setReload((value) => value + 1)}>Try again</button> : null}</p> : null}
  </div>;
}
