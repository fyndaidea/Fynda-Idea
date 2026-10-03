"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  btnPrimaryClass,
  btnSecondaryClass,
  inputClass,
  labelClass,
  pageDescClass,
  pageTitleClass,
  panelClass,
  textareaClass,
} from "@/lib/ui-classes";
import { SearchableSelect } from "@/components/ui/SearchableMultiSelect";
import { Container } from "@/components/ui";
import Dialog, { DialogFooterActions } from "@/components/ui/DialogShell";
import { ShimmerBlock } from "@/components/ui/Shimmer";

type FeedbackPost = {
  id: string;
  user_id: string | null;
  title: string;
  description: string | null;
  category: string | null;
  status: string;
  created_at: string | Date;
  updated_at: string | Date;
  voteCount: number;
  votedByMe: boolean;
};

type RoadmapItem = {
  id: string;
  title: string;
  description: string | null;
  status: string;
  target_date: string | Date | null;
  sort_order: number;
  created_at: string | Date;
  updated_at: string | Date;
};

type ReleaseNote = {
  id: string;
  title: string;
  body_md: string;
  published_at: string | Date | null;
  created_at: string | Date;
  updated_at: string | Date;
};

type Tab = "feedback" | "roadmap" | "releases";

function statusBadgeClass(status: string) {
  const s = status.toLowerCase();
  if (s === "open") return "bg-emerald-50 text-emerald-800";
  if (s === "under_review") return "bg-sky-50 text-sky-800";
  if (s === "planned") return "bg-violet-50 text-violet-800";
  if (s === "in_progress") return "bg-amber-50 text-amber-800";
  if (s === "shipped") return "bg-green-50 text-green-800";
  if (s === "closed") return "bg-[color:var(--card-muted)] text-[color:var(--muted)]";
  return "bg-[color:var(--card-muted)] text-[color:var(--muted)]";
}

function fmtDate(v: string | Date | null | undefined) {
  if (!v) return "";
  const d = typeof v === "string" ? new Date(v) : v;
  if (!(d instanceof Date) || Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

function tabClass(active: boolean) {
  return [
    "rounded-xl border px-3 py-2 text-sm font-medium transition",
    active
      ? "border-[color:var(--foreground)] bg-[color:var(--foreground)] text-[color:var(--background)]"
      : "border-[color:var(--card-border)] bg-[color:var(--card)] text-[color:var(--foreground)] hover:bg-[color:var(--card-muted)]",
  ].join(" ");
}

export default function FeedbackPage() {
  const [tab, setTab] = useState<Tab>("feedback");
  const [loading, setLoading] = useState(true);
  const [posts, setPosts] = useState<FeedbackPost[]>([]);
  const [roadmap, setRoadmap] = useState<RoadmapItem[]>([]);
  const [releases, setReleases] = useState<ReleaseNote[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("");
  const [showNew, setShowNew] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newCategory, setNewCategory] = useState("");
  const [creating, setCreating] = useState(false);
  const [debouncedQ, setDebouncedQ] = useState("");
  const [debouncedStatus, setDebouncedStatus] = useState("");

  useEffect(() => {
    const t = window.setTimeout(() => {
      setDebouncedQ(q);
      setDebouncedStatus(status);
    }, 320);
    return () => window.clearTimeout(t);
  }, [q, status]);

  const loadBoard = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [fbRes, rmRes, rnRes] = await Promise.all([
        fetch(
          `/api/feedback?q=${encodeURIComponent(debouncedQ)}&status=${encodeURIComponent(debouncedStatus)}`,
          { credentials: "include" }
        ),
        fetch("/api/roadmap", { credentials: "include" }),
        fetch("/api/release-notes?limit=20", { credentials: "include" }),
      ]);

      const fbJson = fbRes.ok ? await fbRes.json() : { posts: [] };
      const rmJson = rmRes.ok ? await rmRes.json() : { items: [] };
      const rnJson = rnRes.ok ? await rnRes.json() : { notes: [] };

      setPosts(Array.isArray(fbJson.posts) ? fbJson.posts : []);
      setRoadmap(Array.isArray(rmJson.items) ? rmJson.items : []);
      setReleases(Array.isArray(rnJson.notes) ? rnJson.notes : []);

      if (!fbRes.ok || !rmRes.ok || !rnRes.ok) {
        setError(
          "Some sections could not be loaded. If this persists, apply database migrations (see data/sql)."
        );
      }
    } catch {
      setError("Could not load this page.");
    } finally {
      setLoading(false);
    }
  }, [debouncedQ, debouncedStatus]);

  useEffect(() => {
    void loadBoard();
  }, [loadBoard]);

  const sortedRoadmap = useMemo(() => {
    const weight = (s: string) => {
      const x = s.toLowerCase();
      if (x === "in_progress") return 0;
      if (x === "planned") return 1;
      if (x === "shipped") return 2;
      return 3;
    };
    return [...roadmap].sort((a, b) => {
      const w = weight(a.status) - weight(b.status);
      if (w !== 0) return w;
      if (a.sort_order !== b.sort_order) return a.sort_order - b.sort_order;
      return String(b.created_at).localeCompare(String(a.created_at));
    });
  }, [roadmap]);

  const toggleVote = async (p: FeedbackPost) => {
    const optimistic = posts.map((x) => {
      if (x.id !== p.id) return x;
      const nextVoted = !x.votedByMe;
      return {
        ...x,
        votedByMe: nextVoted,
        voteCount: Math.max(0, x.voteCount + (nextVoted ? 1 : -1)),
      };
    });
    setPosts(optimistic);

    try {
      const res = await fetch(`/api/feedback/${p.id}/vote`, {
        method: p.votedByMe ? "DELETE" : "POST",
        credentials: "include",
      });
      if (!res.ok) await loadBoard();
    } catch {
      await loadBoard();
    }
  };

  const submitNew = async () => {
    if (creating) return;
    setCreating(true);
    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newTitle,
          description: newDescription,
          category: newCategory,
        }),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        setError(data.error ?? "Sign in to submit feedback.");
        return;
      }
      setShowNew(false);
      setNewTitle("");
      setNewDescription("");
      setNewCategory("");
      await loadBoard();
    } finally {
      setCreating(false);
    }
  };

  return (
    <Container className="max-w-5xl py-10 sm:py-12">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className={pageTitleClass}>Feedback</h1>
          <p className={pageDescClass}>
            Request features, vote on what matters, and follow the Fynda Idea roadmap.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Link href="/" className={btnSecondaryClass}>
            Back home
          </Link>
          <button type="button" onClick={() => setShowNew(true)} className={btnPrimaryClass}>
            New feedback
          </button>
        </div>
      </div>

      <div className="mt-6 flex flex-wrap gap-2">
        <button type="button" onClick={() => setTab("feedback")} className={tabClass(tab === "feedback")}>
          Requests
        </button>
        <button type="button" onClick={() => setTab("roadmap")} className={tabClass(tab === "roadmap")}>
          Roadmap
        </button>
        <button type="button" onClick={() => setTab("releases")} className={tabClass(tab === "releases")}>
          Release notes
        </button>
      </div>

      {error ? (
        <div className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {error}
        </div>
      ) : null}

      {loading ? (
        <div className="mt-8 space-y-3" aria-busy="true" aria-label="Loading feedback">
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="rounded-xl border border-[color:var(--card-border)] bg-[color:var(--card)] p-4"
            >
              <ShimmerBlock className="h-4 w-[45%]" />
              <ShimmerBlock className="mt-3 h-3 w-full" />
              <ShimmerBlock className="mt-2 h-3 w-[70%]" />
            </div>
          ))}
        </div>
      ) : null}

      {!loading && tab === "feedback" ? (
        <div className="mt-6">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-1 flex-col gap-2 sm:flex-row sm:items-center">
              <input
                type="search"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search requests…"
                className={`${inputClass} sm:max-w-xs`}
              />
              <SearchableSelect
                options={[
                  { value: "", label: "All statuses" },
                  { value: "open", label: "Open" },
                  { value: "under_review", label: "Under review" },
                  { value: "planned", label: "Planned" },
                  { value: "in_progress", label: "In progress" },
                  { value: "shipped", label: "Shipped" },
                  { value: "closed", label: "Closed" },
                ]}
                value={status}
                onChange={setStatus}
              />
            </div>
            <p className="text-xs text-[color:var(--muted)]">{posts.length} posts</p>
          </div>

          <div className="mt-4 space-y-3">
            {posts.map((p) => (
              <div key={p.id} className={`${panelClass} p-4`}>
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusBadgeClass(p.status)}`}
                      >
                        {p.status.replace(/_/g, " ")}
                      </span>
                      {p.category ? (
                        <span className="rounded-full bg-[color:var(--card-muted)] px-2 py-0.5 text-xs font-medium text-[color:var(--foreground)]">
                          {p.category}
                        </span>
                      ) : null}
                      <span className="text-xs text-[color:var(--muted)]">{fmtDate(p.created_at)}</span>
                    </div>
                    <h2 className="mt-2 text-base font-semibold text-[color:var(--foreground)]">{p.title}</h2>
                    {p.description ? (
                      <p className="mt-1 whitespace-pre-wrap text-sm text-[color:var(--muted)]">
                        {p.description}
                      </p>
                    ) : null}
                  </div>
                  <button
                    type="button"
                    onClick={() => void toggleVote(p)}
                    className={[
                      "shrink-0 rounded-xl border px-3 py-2 text-sm font-medium transition",
                      p.votedByMe
                        ? "border-[color:var(--foreground)] bg-[color:var(--foreground)] text-[color:var(--background)]"
                        : "border-[color:var(--card-border)] bg-[color:var(--card)] text-[color:var(--foreground)] hover:bg-[color:var(--card-muted)]",
                    ].join(" ")}
                    title="Vote"
                  >
                    ▲ {p.voteCount}
                  </button>
                </div>
              </div>
            ))}

            {posts.length === 0 ? (
              <div className={`${panelClass} p-6 text-sm text-[color:var(--muted)]`}>
                No requests yet. Be the first to share what would help you explore startup ideas.
              </div>
            ) : null}
          </div>
        </div>
      ) : null}

      {!loading && tab === "roadmap" ? (
        <div className="mt-6 space-y-3">
          {sortedRoadmap.map((i) => (
            <div key={i.id} className={`${panelClass} p-4`}>
              <div className="flex flex-wrap items-center gap-2">
                <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusBadgeClass(i.status)}`}>
                  {i.status.replace(/_/g, " ")}
                </span>
                {i.target_date ? (
                  <span className="text-xs text-[color:var(--muted)]">Target: {fmtDate(i.target_date)}</span>
                ) : null}
              </div>
              <h2 className="mt-2 text-base font-semibold text-[color:var(--foreground)]">{i.title}</h2>
              {i.description ? <p className="mt-1 text-sm text-[color:var(--muted)]">{i.description}</p> : null}
            </div>
          ))}
          {sortedRoadmap.length === 0 ? (
            <div className={`${panelClass} p-6 text-sm text-[color:var(--muted)]`}>No roadmap items yet.</div>
          ) : null}
        </div>
      ) : null}

      {!loading && tab === "releases" ? (
        <div className="mt-6 space-y-3">
          {releases.map((n) => (
            <div key={n.id} className={`${panelClass} p-4`}>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h2 className="text-base font-semibold text-[color:var(--foreground)]">{n.title}</h2>
                <span className="text-xs text-[color:var(--muted)]">{fmtDate(n.published_at)}</span>
              </div>
              <div
                className={[
                  "release-md mt-3 text-sm leading-6 text-[color:var(--muted)]",
                  "[&_a]:font-semibold [&_a]:text-[color:var(--accent)] [&_a]:underline [&_a]:underline-offset-2",
                  "[&_ul]:my-2 [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:my-2 [&_ol]:list-decimal [&_ol]:pl-5",
                  "[&_h1]:mt-4 [&_h1]:text-lg [&_h1]:font-semibold [&_h2]:mt-4 [&_h2]:text-base [&_h2]:font-semibold",
                  "[&_code]:rounded [&_code]:bg-[color:var(--card-muted)] [&_code]:px-1",
                  "[&_pre]:my-2 [&_pre]:overflow-x-auto [&_pre]:rounded-xl [&_pre]:bg-[color:var(--card-muted)] [&_pre]:p-3",
                ].join(" ")}
              >
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{n.body_md}</ReactMarkdown>
              </div>
            </div>
          ))}
          {releases.length === 0 ? (
            <div className={`${panelClass} p-6 text-sm text-[color:var(--muted)]`}>
              No release notes published yet.
            </div>
          ) : null}
        </div>
      ) : null}

      {showNew ? (
        <Dialog
          title="Submit feedback"
          onClose={() => setShowNew(false)}
          maxWidth="lg"
          closeOnBackdrop={!creating}
          closeDisabled={creating}
          footer={
            <DialogFooterActions
              cancelLabel="Cancel"
              primaryLabel={creating ? "Sending…" : "Submit"}
              onCancel={() => setShowNew(false)}
              onPrimary={() => void submitNew()}
              cancelDisabled={creating}
              primaryDisabled={!newTitle.trim() || creating}
            />
          }
        >
          <p className="text-sm text-[color:var(--muted)]">
            Short title plus optional details. Max 140 characters for the title.
          </p>
          <label className="mt-4 block">
            <span className={labelClass}>Title</span>
            <input
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              maxLength={140}
              className={`${inputClass} mt-1.5`}
            />
          </label>
          <label className="mt-3 block">
            <span className={labelClass}>Category (optional)</span>
            <input
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
              maxLength={60}
              placeholder="e.g. Directory, Favorites, Submit"
              className={`${inputClass} mt-1.5`}
            />
          </label>
          <label className="mt-3 block">
            <span className={labelClass}>Details (optional)</span>
            <textarea
              value={newDescription}
              onChange={(e) => setNewDescription(e.target.value)}
              rows={4}
              className={`${textareaClass} mt-1.5`}
            />
          </label>
          <p className="mt-3 text-xs text-[color:var(--muted)]">
            You must be signed in to submit.{" "}
            <Link href="/login?next=/feedback" className="font-semibold text-[color:var(--foreground)] underline">
              Sign in
            </Link>
          </p>
        </Dialog>
      ) : null}
    </Container>
  );
}
