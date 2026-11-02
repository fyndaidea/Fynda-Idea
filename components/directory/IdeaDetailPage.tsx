"use client";

import Link from "next/link";
import { ArrowLeft, ArrowRight, ArrowUpRight, Check, Pencil, Sparkles } from "lucide-react";
import { useRef, useState, type FormEvent } from "react";
import FavoriteButton from "@/components/favorites/FavoriteButton";
import { MarkdownBody } from "@/components/docs/markdown-body";
import type { Idea } from "@/lib/db/ideas-db";
import type { IdeaProgressStatus } from "@/lib/ideas/progress";
import type { IdeaSectionEdit } from "@/lib/ideas/section-edit";
import type { IdeaCategoryOption } from "./IdeaSectionEditor";
import { IdeaStatusControl } from "./IdeaStatusControl";
import "./idea-detail.css";

function updatedDate(idea: Idea) {
  return new Intl.DateTimeFormat("en", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" }).format(new Date(idea.updatedAt));
}
function Labels({ idea }: { idea: Idea }) {
  return <div className="idea-labels"><span>Idea</span>{idea.featured ? <span>Featured</span> : null}{idea.categories.map((category) => <span key={category}>{category}</span>)}</div>;
}
function Facts({ idea }: { idea: Idea }) {
  return <dl className="idea-facts"><div><dt>Last updated</dt><dd>{updatedDate(idea)}</dd></div>{idea.authorName ? <div><dt>Added by</dt><dd>{idea.authorName}</dd></div> : null}<div><dt>Category</dt><dd>{idea.categories.join(" / ") || "Uncategorized"}</dd></div></dl>;
}
function Tags({ idea }: { idea: Idea }) {
  return idea.tags.length ? <ul className="idea-tags" aria-label="Tags">{idea.tags.map((tag) => <li key={tag}>{tag}</li>)}</ul> : null;
}
function Highlights({ idea }: { idea: Idea }) {
  return idea.highlights.length ? <ul className="idea-key-points">{idea.highlights.map((item, index) => <li key={`${index}-${item}`}><span aria-hidden>{String(index + 1).padStart(2, "0")}</span><p>{item}</p></li>)}</ul> : <p className="idea-empty-section">No key points added yet.</p>;
}

function splitList(value: string, separator: string) {
  return value.split(separator).map((item) => item.trim()).filter(Boolean);
}
function sameList(left: string[], right: string[]) {
  return left.length === right.length && left.every((item, index) => item === right[index]);
}
function sameIds(left: string[], right: string[]) {
  const a = [...left].sort();
  const b = [...right].sort();
  return a.length === b.length && a.every((item, index) => item === b[index]);
}

export default function IdeaDetailPage({ idea: initialIdea, canEdit = false, categories = [], initialProgress }: {
  idea: Idea;
  canEdit?: boolean;
  categories?: IdeaCategoryOption[];
  initialProgress?: { userId: string; status: IdeaProgressStatus | null; scope?: "notion" | "personal"; revision?: string };
}) {
  const [idea, setIdea] = useState(initialIdea);
  const [editing, setEditing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [title, setTitle] = useState(initialIdea.title);
  const [summary, setSummary] = useState(initialIdea.summary);
  const [highlights, setHighlights] = useState(initialIdea.highlights.join("\n"));
  const [body, setBody] = useState(initialIdea.body);
  const [tags, setTags] = useState(initialIdea.tags.join(", "));
  const [author, setAuthor] = useState(initialIdea.authorName ?? "");
  const [categoryIds, setCategoryIds] = useState(initialIdea.categoryIds);
  const editButtonRef = useRef<HTMLButtonElement>(null);

  const beginEdit = () => {
    setTitle(idea.title);
    setSummary(idea.summary);
    setHighlights(idea.highlights.join("\n"));
    setBody(idea.body);
    setTags(idea.tags.join(", "));
    setAuthor(idea.authorName ?? "");
    setCategoryIds(idea.categoryIds);
    setError(null);
    setEditing(true);
  };
  const cancelEdit = () => {
    setEditing(false);
    setError(null);
    window.requestAnimationFrame(() => editButtonRef.current?.focus({ preventScroll: true }));
  };

  const save = async (event: FormEvent) => {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    setError(null);
    const nextHighlights = splitList(highlights, "\n");
    const nextTags = splitList(tags, ",");
    const nextAuthor = author.trim() || null;
    const steps: Array<(revision: number) => IdeaSectionEdit> = [];
    if (title.trim() !== idea.title || summary !== idea.summary) steps.push((revision) => ({ section: "overview", revision, title: title.trim(), summary }));
    if (!sameList(nextHighlights, idea.highlights)) steps.push((revision) => ({ section: "highlights", revision, highlights: nextHighlights }));
    if (nextAuthor !== (idea.authorName || null) || !sameList(nextTags, idea.tags) || !sameIds(categoryIds, idea.categoryIds)) {
      steps.push((revision) => ({ section: "metadata", revision, author_name: nextAuthor, tags: nextTags, category_ids: categoryIds }));
    }
    if (body !== idea.body) steps.push((revision) => ({ section: "body", revision, body }));
    if (!steps.length) {
      setBusy(false);
      cancelEdit();
      return;
    }
    let current = idea;
    try {
      for (const step of steps) {
        const response = await fetch(`/api/admin/ideas/${current.id}/sections`, {
          method: "PATCH",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(step(current.contentRevision)),
        });
        const data = await response.json().catch(() => ({}));
        if (!response.ok || !data.idea) throw new Error(data.error || "Could not save this idea.");
        current = data.idea as Idea;
        setIdea(current);
      }
      setEditing(false);
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Could not save this idea.");
    } finally {
      setBusy(false);
    }
  };

  const actions = (placement: "hero" | "end") => editing ? (
    <div className="idea-page-actions">
      <button type="button" className="idea-secondary-button" disabled={busy} onClick={cancelEdit}>Cancel</button>
      <button type="submit" className="idea-save-section" disabled={busy}>{busy ? "Saving…" : "Save"}</button>
    </div>
  ) : placement === "hero" ? (
    <div className="idea-page-actions">
      <div className="idea-save"><FavoriteButton itemId={idea.slug} itemTitle={idea.title} itemSubtitle={idea.summary} /><span>Save idea</span></div>
      {canEdit ? <button type="button" className="idea-edit-link" ref={editButtonRef} onClick={beginEdit}><Pencil size={13} aria-hidden /><span>Edit</span></button> : null}
    </div>
  ) : null;

  return (
    <article className={`idea-detail idea-detail--canvas idea-body--split${editing ? " idea-detail--editing" : ""}`} data-idea-layout="canvas" data-idea-body-layout="split">
      <form onSubmit={save}>
        <div className="idea-layout-toolbar">
          <Link href="/ideas" className="idea-back-link"><ArrowLeft size={15} aria-hidden /> Ideas<span>/</span><strong>Overview</strong></Link>
        </div>
        <header className="idea-canvas-hero" id="idea-overview">
          <div className="idea-canvas-kicker"><span><Sparkles size={15} aria-hidden /> Fynda / Idea vault</span><span>Explore the possibility</span></div>
          <Labels idea={idea} />
          {editing ? (
            <div className="idea-page-fields">
              <label>Title<input autoFocus required maxLength={500} value={title} onChange={(event) => setTitle(event.target.value)} /></label>
              <label>Summary<textarea rows={3} maxLength={10000} value={summary} onChange={(event) => setSummary(event.target.value)} /></label>
            </div>
          ) : (
            <>
              <h1>{idea.title}</h1>
              <p className="idea-lead">{idea.summary}</p>
            </>
          )}
          <div className="idea-hero-bottom">
            <p className="idea-byline">{idea.authorName || "Fynda Idea"}<span>·</span>{updatedDate(idea)}</p>
            {actions("hero")}
          </div>
          {error ? <p className="idea-page-edit-error" role="alert">{error}</p> : null}
          {canEdit ? <p className={`idea-sync-status${idea.contentRevision > idea.notionSyncedRevision ? " idea-sync-status--pending" : ""}`} role="status">{idea.contentRevision > idea.notionSyncedRevision ? <><span className="idea-sync-dot" aria-hidden />Updated — pending Notion sync</> : <><Check size={12} aria-hidden />No pending Notion changes</>}</p> : null}
        </header>
        <div className="idea-personal-bar"><IdeaStatusControl key={idea.id} ideaId={idea.id} initial={initialProgress} /><Link href="/dashboard?section=ideas">Idea tracker <ArrowUpRight size={14} aria-hidden /></Link></div>
        <div className="idea-bottom-split">
          <div className="idea-canvas-points">
            <section className="idea-detail-highlights">
              <div className="idea-section-head"><h2>Key points</h2></div>
              {editing ? <label className="idea-page-fields">One point per line<textarea rows={6} value={highlights} onChange={(event) => setHighlights(event.target.value)} /></label> : <Highlights idea={idea} />}
            </section>
          </div>
          <div className="idea-canvas-content">
            <aside>
              <section className="idea-detail-metadata">
                <div className="idea-section-head"><h2>Details</h2></div>
                {editing ? (
                  <div className="idea-page-fields">
                    <label>Added by<input maxLength={500} value={author} onChange={(event) => setAuthor(event.target.value)} /></label>
                    <label>Tags (comma-separated)<input value={tags} onChange={(event) => setTags(event.target.value)} /></label>
                    <fieldset>
                      <legend>Categories</legend>
                      <div className="idea-category-options">{categories.map((category) => <label key={category.id}><input type="checkbox" checked={categoryIds.includes(category.id)} onChange={(event) => setCategoryIds((ids) => event.target.checked ? [...ids, category.id] : ids.filter((id) => id !== category.id))} />{category.name}</label>)}</div>
                    </fieldset>
                  </div>
                ) : <><Facts idea={idea} /><Tags idea={idea} /></>}
              </section>
            </aside>
            <section className="idea-canvas-document" aria-label="Idea details">
              <div className="idea-section-head idea-document-head"><h2>In detail</h2></div>
              {editing ? (
                <label className="idea-page-fields">Details (Markdown)<textarea className="idea-markdown-input" rows={16} maxLength={1000000} value={body} onChange={(event) => setBody(event.target.value)} /></label>
              ) : (
                <div id="idea-details" className="idea-reading">{idea.body ? <MarkdownBody markdown={idea.body} headingAnchorPrefix="idea-body" /> : <p className="idea-muted">No additional details have been added yet.</p>}</div>
              )}
            </section>
          </div>
        </div>
        {editing ? <div className="idea-page-edit-bar">{actions("end")}</div> : null}
      </form>
      <Link href="/ideas" className="idea-canvas-next"><span>Keep your next idea close.</span>Explore the vault <ArrowRight size={18} aria-hidden /></Link>
    </article>
  );
}
