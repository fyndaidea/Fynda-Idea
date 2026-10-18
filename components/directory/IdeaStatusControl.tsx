"use client";

import Link from "next/link";
import "./idea-detail.css";
import { useId, useRef, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { IDEA_PROGRESS_GROUPS, type IdeaProgressStatus } from "@/lib/ideas/progress";
import { ShimmerBlock } from "@/components/ui/Shimmer";
import { useIdeaProgress } from "./useIdeaProgress";

export function IdeaStatusControl({ ideaId, initial, onChange, compact = false, adminOnly = false }: {
  ideaId: string;
  initial?: { userId: string; status: IdeaProgressStatus | null };
  onChange?: (status: IdeaProgressStatus | null) => void;
  compact?: boolean;
  adminOnly?: boolean;
}) {
  const { user, loading } = useAuth();
  const id = useId();
  const owner = useRef(user?.id);
  useEffect(() => { owner.current = user?.id; }, [user?.id]);
  const progress = useIdeaProgress(user?.id, ideaId, user?.id === initial?.userId ? initial?.status : undefined);
  if (loading) return <ShimmerBlock className="h-9 w-36" rounded="rounded-lg" label="Loading your idea status" />;
  if (!user) return compact ? <span className="idea-stage-badge">Not tracking</span> : <Link className="idea-personal-status-login" href={`/login?next=${encodeURIComponent(typeof window !== "undefined" ? window.location.pathname : "/ideas")}`}>Sign in to track this idea</Link>;
  return <div className={`idea-personal-status${compact ? " idea-personal-status--compact" : ""}`}>
    <label htmlFor={adminOnly && user.role !== "admin" ? undefined : id}>My status</label>
    {adminOnly && user.role !== "admin" ? <span className="idea-stage-badge">{progress.ready ? progress.status ?? "Not tracking" : "Loading…"}</span> : <select
      id={id} aria-label="My idea status" disabled={progress.busy || !progress.ready} value={progress.status ?? ""}
      onChange={async (event) => {
        const next = (event.target.value || null) as IdeaProgressStatus | null;
        const userId = user.id;
        if (await progress.save(next) && owner.current === userId) onChange?.(next);
      }}>
      <option value="">{progress.ready ? "Not tracking" : "Loading…"}</option>
      {IDEA_PROGRESS_GROUPS.map((group) => <optgroup key={group.name} label={group.name}>{group.options.map((status) => <option key={status} value={status}>{status}</option>)}</optgroup>)}
    </select>}
    <span className="idea-personal-status-hint" aria-live="polite">{progress.busy ? "Saving…" : compact ? "" : "Private · on your dashboard"}</span>
    {progress.error ? <p role="alert">{progress.error}{!progress.ready ? <button type="button" onClick={progress.retry}>Try again</button> : null}</p> : null}
  </div>;
}
