"use client";

import { ArrowLeft } from "lucide-react";
import { useEffect, useState } from "react";
import { MarkdownBody } from "@/components/docs/markdown-body";
import FavoriteButton from "@/components/favorites/FavoriteButton";
import { ShimmerBlock } from "@/components/ui/Shimmer";
import type { Idea } from "@/lib/db/ideas-db";
import { IdeaEditButton, IdeaInlineEditor } from "./IdeaAdminEdit";
import type { IdeaCategoryOption } from "./IdeaSectionEditor";
import { IdeaStatusControl } from "./IdeaStatusControl";
import { IdeaUpdatedMeta } from "./IdeaUpdatedMeta";
import "./idea-detail.css";

export function IdeasSplitView({
  ideas,
  selectedSlug,
  loading,
  canEdit = false,
  categories = [],
  onSelect,
  onIdeaChange,
}: {
  ideas: Idea[];
  selectedSlug: string;
  loading: boolean;
  canEdit?: boolean;
  categories?: IdeaCategoryOption[];
  onSelect: (slug: string) => void;
  onIdeaChange?: (idea: Idea) => void;
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
  if (!loading && ideas.length === 0 && !selectedSlug) return null;

  return (
    <div className={`ideas-split${selectedSlug ? " ideas-split--open" : ""}`}>
      <div className="ideas-split-list" role="listbox" aria-label="Ideas" aria-busy={loading}>
        {loading ? Array.from({ length: 8 }, (_, index) => (
          <div key={index} className="ideas-split-item" aria-hidden="true">
            <ShimmerBlock className="h-4 w-4/5" />
            <ShimmerBlock className="mt-2 h-3 w-full" />
          </div>
        )) : ideas.map((idea) => {
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
              {current.tags?.length ? <ul className="idea-tags" aria-label="Tags">{current.tags.map((tag) => <li key={tag}>{tag}</li>)}</ul> : null}
            </div>
            <footer className="idea-preview-footer">
              <IdeaUpdatedMeta idea={current} />
              {current.id ? <IdeaStatusControl ideaId={current.id} compact /> : null}
            </footer>
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
    </div>
  );
}
