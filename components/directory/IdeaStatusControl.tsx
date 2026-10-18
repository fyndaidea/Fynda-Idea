"use client";

import Link from "next/link";
import "./idea-detail.css";
import { useRef, useEffect, createContext, useContext } from "react";
import { useAuth } from "@/lib/auth-context";
import { type IdeaProgressStatus } from "@/lib/ideas/progress";
import { ShimmerBlock } from "@/components/ui/Shimmer";
import { useIdeaProgress, type IdeaStageSeed } from "./useIdeaProgress";
import { IdeaStageMenu } from "./IdeaStageMenu";

export const IdeaStageSeedContext = createContext<{ userId: string; revision?: string; scope: "notion" | "personal"; statuses: Record<string, IdeaProgressStatus | null> } | null>(null);

export function IdeaStatusControl({ ideaId, initial, onChange, compact = false }: {
  ideaId: string;
  initial?: IdeaStageSeed;
  onChange?: (status: IdeaProgressStatus | null) => void;
  compact?: boolean;
}) {
  const { user, loading } = useAuth();
  const seeds = useContext(IdeaStageSeedContext);
  const seed = initial ?? (seeds && Object.hasOwn(seeds.statuses, ideaId) ? { userId: seeds.userId, status: seeds.statuses[ideaId], scope: seeds.scope, revision: seeds.revision } : undefined);
  const owner = useRef(user?.id);
  useEffect(() => { owner.current = user?.id; }, [user?.id]);
  const progress = useIdeaProgress(user?.id, ideaId, user?.id === seed?.userId ? seed : undefined);
  if (loading) return <ShimmerBlock className="h-9 w-36" rounded="rounded-lg" label="Loading your idea status" />;
  if (!user) return compact ? <span className="idea-stage-badge">No status</span> : <Link className="idea-personal-status-login" href={`/login?next=${encodeURIComponent(typeof window !== "undefined" ? window.location.pathname : "/ideas")}`}>Sign in to track this idea</Link>;
  return <div className={`idea-personal-status${compact ? " idea-personal-status--compact" : ""}`}>
    <IdeaStageMenu
      allowClear={progress.scope !== "notion"} key={`${user.id}-${ideaId}`} status={progress.status} ready={progress.ready} busy={progress.busy}
      onChange={async (next) => {
        const userId = user.id;
        if (await progress.save(next) && owner.current === userId) onChange?.(next);
      }} />
    <span className="idea-personal-status-hint" aria-live="polite">{progress.busy ? "Saving…" : compact ? "" : progress.scope === "notion" ? "Stage changes sync to Notion" : "Private · on your dashboard"}</span>
    {progress.error ? <p role="alert">{progress.error}<button type="button" onClick={progress.retry}>Try again</button></p> : null}
  </div>;
}
