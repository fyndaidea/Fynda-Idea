"use client";

import { useId, useState } from "react";
import type { Idea } from "@/lib/db/ideas-db";
import type { IdeaSectionEdit } from "@/lib/ideas/section-edit";

export type IdeaCategoryOption = { id: string; name: string };
export function IdeaSectionEditor({ idea, section, heading, bodySource, transformBody, categories = [], onSave, onCancel }: {
  idea: Idea;
  section: IdeaSectionEdit["section"];
  heading?: string;
  bodySource?: string;
  transformBody?: (body: string) => string;
  categories?: IdeaCategoryOption[];
  onSave: (edit: IdeaSectionEdit) => Promise<void>;
  onCancel: () => void;
}) {
  const headingId = useId();
  const [title, setTitle] = useState(idea.title);
  const [summary, setSummary] = useState(idea.summary);
  const [highlights, setHighlights] = useState(idea.highlights.join("\n"));
  const [body, setBody] = useState(bodySource ?? idea.body);
  const [tags, setTags] = useState(idea.tags.join(", "));
  const [author, setAuthor] = useState(idea.authorName ?? "");
  const [categoryIds, setCategoryIds] = useState(idea.categoryIds);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const lines = (value: string, separator: string) => value.split(separator).map((item) => item.trim()).filter(Boolean);

  return <form className="idea-section-editor" aria-labelledby={headingId} onSubmit={async (event) => {
    event.preventDefault();
    if (busy) return;
    setBusy(true); setError(null);
    const revision = idea.contentRevision;
    const edit: IdeaSectionEdit = section === "overview" ? { section, revision, title, summary }
      : section === "highlights" ? { section, revision, highlights: lines(highlights, "\n") }
      : section === "metadata" ? { section, revision, author_name: author || null, tags: lines(tags, ","), category_ids: categoryIds }
      : { section, revision, body: transformBody ? transformBody(body) : body };
    try { await onSave(edit); } catch (error) { setError(error instanceof Error ? error.message : "Could not save this section."); } finally { setBusy(false); }
  }}>
    <h3 id={headingId}>Edit {heading ?? ({ overview: "overview", highlights: "key points", metadata: "details", body: "details" }[section])}</h3>
    <fieldset disabled={busy}>
      {section === "overview" ? <><label>Title<input autoFocus required maxLength={500} value={title} onChange={(event) => setTitle(event.target.value)} /></label><label>Summary<textarea rows={3} maxLength={10000} value={summary} onChange={(event) => setSummary(event.target.value)} /></label></> : null}
      {section === "highlights" ? <label>Key points (one per line)<textarea autoFocus rows={5} value={highlights} onChange={(event) => setHighlights(event.target.value)} /></label> : null}
      {section === "body" ? <label>Details (Markdown)<textarea autoFocus className="idea-markdown-input" rows={12} maxLength={1000000} value={body} onChange={(event) => setBody(event.target.value)} /></label> : null}
      {section === "metadata" ? <><label>Added by<input autoFocus maxLength={500} value={author} onChange={(event) => setAuthor(event.target.value)} /></label><label>Tags (comma-separated)<input value={tags} onChange={(event) => setTags(event.target.value)} /></label><fieldset><legend>Categories</legend><div className="idea-category-options">{categories.map((category) => <label key={category.id}><input type="checkbox" checked={categoryIds.includes(category.id)} onChange={(event) => setCategoryIds((ids) => event.target.checked ? [...ids, category.id] : ids.filter((id) => id !== category.id))} />{category.name}</label>)}</div></fieldset></> : null}
    </fieldset>
    {error ? <p role="alert">{error}</p> : null}
    <div className="idea-editor-footer"><span>Saves are marked for Notion sync.</span><button type="button" className="idea-secondary-button" disabled={busy} onClick={onCancel}>Cancel</button><button type="submit" className="idea-save-section" disabled={busy}>{busy ? "Saving…" : "Save section"}</button></div>
  </form>;
}
