"use client";

import { ArrowLeft } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { MarkdownBody } from "@/components/docs/markdown-body";
import FavoriteButton from "@/components/favorites/FavoriteButton";
import { ShimmerBlock } from "@/components/ui/Shimmer";
import type { Idea } from "@/lib/db/ideas-db";
import { IdeaEditButton, IdeaInlineEditor } from "./IdeaAdminEdit";
import type { IdeaCategoryOption } from "./IdeaSectionEditor";
import { IdeaStatusControl } from "./IdeaStatusControl";
import { ideaUpdatedDateFormat } from "./IdeaUpdatedMeta";
import "./idea-detail.css";

export function IdeasSplitView({
  ideas,
  selectedSlug,
  loading,
  canEdit = false,
  categories = [],
  onSelect,
  onIdeaChange,
  listHeader,
  listFooter,
}: {
  ideas: Idea[];
  selectedSlug: string;
  loading: boolean;
  canEdit?: boolean;
  categories?: IdeaCategoryOption[];
  onSelect: (slug: string) => void;
  onIdeaChange?: (idea: Idea) => void;
  /** Search box pinned above the list in the left panel. */
  listHeader?: ReactNode;
  /** Pager pinned below the list in the left panel. */
  listFooter?: ReactNode;
}) {
  const listed = ideas.find((idea) => idea.slug === selectedSlug) ?? null;
  const [loaded, setLoaded] = useState<Idea | null>(listed);
  const [saved, setSaved] = useState<Idea | null>(null);
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState(false);
  const [retry, setRetry] = useState(0);

  useEffect(() => {
    if (!selectedSlug) return;
    const match = ideas.find((idea) => idea.slug === selectedSlug);
    if (!match) return;
    const selected = document.querySelector<HTMLElement>(`[data-split-slug="${CSS.escape(selectedSlug)}"]`);
    selected?.scrollIntoView({ block: "nearest" });
  }, [ideas, selectedSlug]);

  useEffect(() => {
    if (listed) {
      setLoaded(listed);
      setError(false);
      return;
    }
    if (!selectedSlug) {
      setLoaded(null);
      setError(false);
      return;
    }
    const controller = new AbortController();
    setLoaded(null);
    setError(false);
    void (async () => {
      try {
        const response = await fetch(`/api/ideas/${encodeURIComponent(selectedSlug)}`, {
          credentials: "include",
          signal: controller.signal,
          cache: "no-store",
        });
        if (!response.ok) throw new Error("Could not load idea");
        const data = await response.json() as { idea?: Idea };
        if (!data.idea || data.idea.slug !== selectedSlug || typeof data.idea.body !== "string") throw new Error("Invalid idea");
        if (!controller.signal.aborted) setLoaded(data.idea);
      } catch {
        if (!controller.signal.aborted) setError(true);
      }
    })();
    return () => controller.abort();
  }, [listed, selectedSlug, retry]);

  useEffect(() => {
    setSaved(null);
    setEditing(false);
  }, [selectedSlug]);

  const current = (saved && saved.slug === selectedSlug && (!listed || saved.contentRevision >= listed.contentRevision) ? saved : null) ?? listed ?? loaded;
  const saveIdea = (next: Idea) => {
    setSaved(next);
    setEditing(false);
    onIdeaChange?.(next);
  };

  return (
    <div className={`ideas-split${selectedSlug ? " ideas-split--open" : ""}`}>
      <div className="ideas-split-list-panel">
      {listHeader ? <div className="ideas-split-search">{listHeader}</div> : null}
      <div className="ideas-split-list" role="listbox" aria-label="Ideas" aria-busy={loading}>
        {loading ? Array.from({ length: 8 }, (_, index) => (
          <div key={index} className="ideas-split-item" aria-hidden="true">
            <ShimmerBlock className="h-4 w-4/5" />
            <ShimmerBlock className="mt-2 h-3 w-full" />
          </div>
        )) : ideas.length === 0 ? (
          <div className="ideas-split-list-empty" role="status">
            <p>No ideas match</p>
            <p>Try a different search or clear your filters.</p>
          </div>
        ) : ideas.map((idea) => {
          const selected = idea.slug === selectedSlug;
          return (
            <button
              key={idea.id}
              type="button"
              role="option"
              data-idea-id={idea.id}
              data-split-slug={idea.slug}
              aria-selected={selected}
              className="ideas-split-item"
              onClick={() => onSelect(idea.slug)}
            >
              <span className="ideas-split-title">{idea.title}</span>
              <span className="ideas-split-summary">{idea.summary}</span>
            </button>
          );
        })}
      </div>
      {listFooter}
      </div>
      <div className="ideas-split-main">
      <section className={`ideas-split-detail${current || selectedSlug ? "" : " is-empty"}`} aria-label="Idea details" aria-busy={Boolean(selectedSlug) && !current && !error}>
        {editing && current ? <IdeaInlineEditor idea={current} categories={categories} onCancel={() => setEditing(false)} onSaved={saveIdea} /> : <>
        <div className="ideas-split-detail-bar">
          <button type="button" className="ideas-split-back" onClick={() => onSelect("")}>
            <ArrowLeft size={16} aria-hidden /> Ideas
          </button>
          <div className="ideas-split-detail-actions">
            {canEdit && current ? <IdeaEditButton onClick={() => setEditing(true)} /> : null}
            {current ? null : <span className="idea-eyebrow">Idea</span>}
          </div>
        </div>
        {!selectedSlug ? (
          <div className="ideas-split-empty">
            <p>Select an idea</p>
            <p>Its details open here.</p>
          </div>
        ) : current ? (
          <>
            <div className="ideas-split-reading idea-preview-scroll">
              <header className="idea-preview-heading">
                <div className="idea-labels">
                  <span>Idea</span>
                  {current.featured ? <span>Featured</span> : null}
                  {current.categories?.map((category) => <span key={category}>{category}</span>)}
                </div>
                <div className="idea-preview-title-row">
                  <h2>{current.title}</h2>
                  <FavoriteButton itemId={current.slug} itemTitle={current.title} itemSubtitle={current.summary} />
                </div>
                {current.summary ? <p className="idea-lead">{current.summary}</p> : null}
              </header>
              <div className="idea-preview-body">
                {current.body ? <MarkdownBody markdown={current.body} /> : <p className="idea-muted">No additional details have been added yet.</p>}
              </div>
            </div>
          </>
        ) : error ? (
          <div role="alert" className="idea-preview-error ideas-split-message">
            <p>Couldn’t load this idea.</p>
            <button type="button" className="idea-text-link" onClick={() => { setError(false); setRetry((value) => value + 1); }}>Try again</button>
          </div>
        ) : (
          <div role="status" aria-label="Loading idea details" className="ideas-split-message space-y-3">
            <ShimmerBlock className="h-8 w-2/3" />
            <ShimmerBlock className="h-4 w-full" />
            <ShimmerBlock className="h-4 w-4/5" />
            <ShimmerBlock className="mt-6 h-40 w-full" rounded="rounded-xl" />
          </div>
        )}
        </>}
      </section>
      <IdeaMoreDetails idea={selectedSlug ? current : null} canEdit={canEdit} />
      </div>
    </div>
  );
}

function formatDate(value: Date | string | null | undefined) {
  const date = value ? new Date(value) : null;
  return date && Number.isFinite(date.getTime()) ? ideaUpdatedDateFormat.format(date) : "Not recorded";
}

/** Right panel: personal stage, facts, key points and tags for the open idea. */
function IdeaMoreDetails({ idea, canEdit }: { idea: Idea | null; canEdit: boolean }) {
  if (!idea) {
    return (
      <aside className="ideas-split-aside is-empty" aria-label="More details">
        <p>More details</p>
        <p>Stage, facts and key points show here.</p>
      </aside>
    );
  }
  const syncPending = idea.contentRevision > idea.notionSyncedRevision;
  const facts = [
    { label: "Category", value: idea.categories?.join(" / ") || "Uncategorized" },
    { label: "Added by", value: idea.authorName?.trim() || "Not recorded" },
    { label: "Last updated", value: formatDate(idea.updatedAt) },
    { label: "Created", value: formatDate(idea.createdAt) },
  ];
  return (
    <aside className="ideas-split-aside" aria-label="More details">
      {idea.id ? (
        <div className="ideas-aside-block">
          <h3>Your stage</h3>
          <IdeaStatusControl key={idea.id} ideaId={idea.id} />
        </div>
      ) : null}
      <div className="ideas-aside-block">
        <h3>Details</h3>
        <dl className="ideas-aside-facts">
          {facts.map((fact) => <div key={fact.label}><dt>{fact.label}</dt><dd>{fact.value}</dd></div>)}
        </dl>
        {canEdit ? (
          <p role="status" className={`idea-sync-status${syncPending ? " idea-sync-status--pending" : ""}`}>
            {syncPending ? <><span className="idea-sync-dot" aria-hidden />Updated — pending Notion sync</> : "No pending Notion changes"}
          </p>
        ) : null}
      </div>
      <div className="ideas-aside-block">
        <h3>Key points</h3>
        {idea.highlights?.length ? <ul className="ideas-aside-points">{idea.highlights.map((item, index) => <li key={`${index}-${item}`}>{item}</li>)}</ul> : <p className="idea-muted">No key points added yet.</p>}
      </div>
      {idea.tags?.length ? (
        <div className="ideas-aside-block">
          <h3>Tags</h3>
          <ul className="idea-tags" aria-label="Tags">{idea.tags.map((tag) => <li key={tag}>{tag}</li>)}</ul>
        </div>
      ) : null}
    </aside>
  );
}
