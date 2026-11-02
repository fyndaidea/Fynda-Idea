"use client";

import { Pencil } from "lucide-react";
import { useState, type FormEvent } from "react";
import type { Idea } from "@/lib/db/ideas-db";
import type { IdeaSectionEdit } from "@/lib/ideas/section-edit";
import type { IdeaCategoryOption } from "./IdeaSectionEditor";

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

export function IdeaEditButton({ onClick }: { onClick: () => void }) {
  return <button type="button" className="idea-edit-link" onClick={onClick}><Pencil size={13} aria-hidden /><span>Edit</span></button>;
}

export function IdeaInlineEditor({
  idea,
  categories,
  onSaved,
  onCancel,
  onClose,
}: {
  idea: Idea;
  categories: IdeaCategoryOption[];
  onSaved: (idea: Idea) => void;
  onCancel: () => void;
  onClose?: () => void;
}) {
  const [title, setTitle] = useState(idea.title);
  const [summary, setSummary] = useState(idea.summary);
  const [highlights, setHighlights] = useState(idea.highlights.join("\n"));
  const [body, setBody] = useState(idea.body);
  const [tags, setTags] = useState(idea.tags.join(", "));
  const [author, setAuthor] = useState(idea.authorName ?? "");
  const [categoryIds, setCategoryIds] = useState(idea.categoryIds);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
      onCancel();
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
      }
      onSaved(current);
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Could not save this idea.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <form className="idea-inline-editor" onSubmit={save}>
      <div className="idea-inline-bar">
        <span>Editing</span>
        <div>
          <button type="button" className="idea-secondary-button" disabled={busy} onClick={onCancel}>Cancel</button>
          <button type="submit" className="idea-save-section" disabled={busy}>{busy ? "Saving…" : "Save"}</button>
          {onClose ? <button type="button" className="idea-icon-button" aria-label="Close" onClick={onClose}>×</button> : null}
        </div>
      </div>
      <div className="idea-page-fields idea-inline-fields">
        <label>Title<input autoFocus required maxLength={500} value={title} onChange={(event) => setTitle(event.target.value)} /></label>
        <label>Summary<textarea rows={3} maxLength={10000} value={summary} onChange={(event) => setSummary(event.target.value)} /></label>
        <label>Key points (one per line)<textarea rows={5} value={highlights} onChange={(event) => setHighlights(event.target.value)} /></label>
        <label>Details (Markdown)<textarea className="idea-markdown-input" rows={12} maxLength={1000000} value={body} onChange={(event) => setBody(event.target.value)} /></label>
        <label>Added by<input maxLength={500} value={author} onChange={(event) => setAuthor(event.target.value)} /></label>
        <label>Tags (comma-separated)<input value={tags} onChange={(event) => setTags(event.target.value)} /></label>
        <fieldset>
          <legend>Categories</legend>
          <div className="idea-category-options">{categories.map((category) => (
            <label key={category.id}><input type="checkbox" checked={categoryIds.includes(category.id)} onChange={(event) => setCategoryIds((ids) => event.target.checked ? [...ids, category.id] : ids.filter((id) => id !== category.id))} />{category.name}</label>
          ))}</div>
        </fieldset>
        {error ? <p role="alert">{error}</p> : null}
      </div>
    </form>
  );
}
