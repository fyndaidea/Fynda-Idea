"use client";

import Link from "next/link";
import { ArrowLeft, ArrowRight, ArrowUpRight, Pencil, Columns2, PanelsTopLeft, AlignLeft, Sparkles, Check } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import FavoriteButton from "@/components/favorites/FavoriteButton";
import { MarkdownBody } from "@/components/docs/markdown-body";
import type { Idea } from "@/lib/db/ideas-db";
import type { IdeaProgressStatus } from "@/lib/ideas/progress";
import type { IdeaSectionEdit } from "@/lib/ideas/section-edit";
import { IDEA_BODY_LAYOUTS, parseIdeaBodyLayout, type IdeaBodyLayout } from "./idea-layouts";
import { ideaBodySections, replaceIdeaBodySection } from "./idea-outline";
import { IdeaSectionEditor, type IdeaCategoryOption } from "./IdeaSectionEditor";
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
const layoutIcons = { split: Columns2, panels: PanelsTopLeft, reading: AlignLeft };

export default function IdeaDetailPage({ idea: initialIdea, canEdit = false, initialBodyLayout = "panels", categories = [], initialProgress }: {
  idea: Idea;
  canEdit?: boolean;
  initialBodyLayout?: IdeaBodyLayout;
  categories?: IdeaCategoryOption[];
  initialProgress?: { userId: string; status: IdeaProgressStatus | null };
}) {
  const [idea, setIdea] = useState(initialIdea);
  const [layout, setLayout] = useState<IdeaBodyLayout>(initialBodyLayout);
  const [editing, setEditing] = useState<string | null>(null);
  const editTriggers = useRef(new Map<string, HTMLButtonElement>());
  const closeEditor = () => {
    const key = editing;
    setEditing(null);
    if (key) window.requestAnimationFrame(() => editTriggers.current.get(key)?.focus({ preventScroll: true }));
  };
  const bodySections = ideaBodySections(idea.body);
  useEffect(() => {
    const sync = () => setLayout(parseIdeaBodyLayout(new URL(window.location.href).searchParams.get("body")));
    window.addEventListener("popstate", sync);
    return () => window.removeEventListener("popstate", sync);
  }, []);
  const save = async (edit: IdeaSectionEdit) => {
    const response = await fetch(`/api/admin/ideas/${idea.id}/sections`, { method: "PATCH", credentials: "include", headers: { "Content-Type": "application/json" }, body: JSON.stringify(edit) });
    const data = await response.json().catch(() => ({}));
    if (!response.ok || !data.idea) throw new Error(data.error || "Could not save this section.");
    setIdea(data.idea); closeEditor();
  };
  const editButton = (key: string, label: string) => canEdit ? <button type="button" className="idea-edit-link" ref={(node) => { if (node) editTriggers.current.set(key, node); else editTriggers.current.delete(key); }} disabled={editing !== null && editing !== key} aria-label={label} onClick={() => setEditing(key)}><Pencil size={13} aria-hidden /><span>{key.startsWith("body-") ? "Edit" : label}</span></button> : null;
  const editor = (key: string, section: IdeaSectionEdit["section"]) => editing === key ? <IdeaSectionEditor key={key} idea={idea} section={section} categories={categories} onSave={save} onCancel={closeEditor} /> : null;
  const metadata = <section className="idea-detail-metadata"><div className="idea-section-head"><h2>Details</h2>{editButton("metadata", "Edit details")}</div>{editing === "metadata" ? editor("metadata", "metadata") : <><Facts idea={idea} /><Tags idea={idea} /></>}</section>;
  const highlights = <section className="idea-detail-highlights"><div className="idea-section-head"><h2>Key points</h2>{editButton("highlights", "Edit key points")}</div>{editing === "highlights" ? editor("highlights", "highlights") : <Highlights idea={idea} />}</section>;
  const details = <section className="idea-canvas-document" aria-label="Idea details"><div className="idea-section-head idea-document-head"><h2>In detail</h2>{editButton("body", "Edit full details")}</div>{editing === "body" ? editor("body", "body") : <div id="idea-details" className="idea-reading">{idea.body ? <MarkdownBody markdown={idea.body} headingAnchorPrefix="idea-body"
    headingActions={canEdit ? (line) => { const section = bodySections.find((item) => item.id === `idea-body-${line}`); return section ? editButton(`body-${line}`, `Edit ${section.title}`) : null; } : undefined}
    headingEditor={canEdit ? (line) => {
      const section = bodySections.find((item) => item.id === `idea-body-${line}`);
      return section && editing === `body-${line}` ? <IdeaSectionEditor key={`body-${line}`} idea={idea} section="body" heading={section.title} bodySource={section.source} transformBody={(source) => replaceIdeaBodySection(idea.body, section, source)} onSave={save} onCancel={closeEditor} /> : null;
    } : undefined}
  /> : <p className="idea-muted">No additional details have been added yet.</p>}</div>}</section>;

  return <article className={`idea-detail idea-detail--canvas idea-body--${layout}`} data-idea-layout="canvas" data-idea-body-layout={layout}>
    <div className="idea-layout-toolbar"><Link href="/ideas" className="idea-back-link"><ArrowLeft size={15} aria-hidden /> Ideas<span>/</span><strong>Overview</strong></Link><span className="idea-selected-layout"><PanelsTopLeft size={13} aria-hidden /> Canvas</span></div>
    <header className="idea-canvas-hero" id="idea-overview"><div className="idea-canvas-kicker"><span><Sparkles size={15} aria-hidden /> Fynda / Idea vault</span><span>Explore the possibility</span></div><Labels idea={idea} />{editing === "overview" ? editor("overview", "overview") : <><h1>{idea.title}</h1><p className="idea-lead">{idea.summary}</p></>}<div className="idea-hero-bottom"><p className="idea-byline">{idea.authorName || "Fynda Idea"}<span>·</span>{updatedDate(idea)}</p><div className="idea-page-actions"><div className="idea-save"><FavoriteButton itemId={idea.slug} itemTitle={idea.title} itemSubtitle={idea.summary} /><span>Save idea</span></div>{editButton("overview", "Edit overview")}</div></div>{canEdit ? <p className={`idea-sync-status${idea.contentRevision > idea.notionSyncedRevision ? " idea-sync-status--pending" : ""}`} role="status">{idea.contentRevision > idea.notionSyncedRevision ? <><span className="idea-sync-dot" aria-hidden />Updated — pending Notion sync</> : <><Check size={12} aria-hidden />No pending Notion changes</>}</p> : null}</header>
    <div className="idea-personal-bar"><IdeaStatusControl key={idea.id} ideaId={idea.id} initial={initialProgress} /><Link href="/dashboard?section=ideas">Idea tracker <ArrowUpRight size={14} aria-hidden /></Link></div>
    <div className="idea-body-switcher"><div><span className="idea-eyebrow">Below the canvas</span><h2>Explore the details</h2></div><div className="idea-layout-picker"><span>Details layout</span><div role="group" aria-label="Canvas detail layout">{IDEA_BODY_LAYOUTS.map((item) => { const Icon = layoutIcons[item.id]; return <button key={item.id} type="button" title={item.description} disabled={editing !== null} aria-pressed={layout === item.id} onClick={() => { setLayout(item.id); const url = new URL(window.location.href); url.searchParams.set("body", item.id); window.history.replaceState(null, "", url); }}><Icon size={14} aria-hidden />{item.name}</button>; })}</div></div></div>
    <p className="sr-only" role="status">{IDEA_BODY_LAYOUTS.find((item) => item.id === layout)?.description}</p>
    {layout === "split" ? <div className="idea-bottom-split"><div className="idea-canvas-points">{highlights}</div><div className="idea-canvas-content"><aside>{metadata}</aside>{details}</div></div> : null}
    {layout === "panels" ? <div className="idea-bottom-panels"><div className="idea-panel-main">{details}</div><aside><div className="idea-panel-card">{highlights}</div><div className="idea-panel-card">{metadata}</div></aside></div> : null}
    {layout === "reading" ? <div className="idea-bottom-reading"><div className="idea-reading-key-points">{highlights}</div>{details}<div className="idea-reading-metadata">{metadata}</div></div> : null}
    <Link href="/ideas" className="idea-canvas-next"><span>Keep your next idea close.</span>Explore the vault <ArrowRight size={18} aria-hidden /></Link>
  </article>;
}
