"use client";

import Link from "next/link";
import { ArrowLeft, ArrowUpRight, ArrowDown, Pencil } from "lucide-react";
import { useEffect, useState } from "react";
import FavoriteButton from "@/components/favorites/FavoriteButton";
import { MarkdownBody } from "@/components/docs/markdown-body";
import type { Idea } from "@/lib/db/ideas-db";
import { IDEA_LAYOUTS, parseIdeaLayout, type IdeaLayout } from "./idea-layouts";
import "./idea-detail.css";

function SaveIdea({ idea }: { idea: Idea }) {
  return <div className="idea-save"><FavoriteButton itemId={idea.slug} itemTitle={idea.title} itemSubtitle={idea.summary} /><span>Save idea</span></div>;
}

function Labels({ idea }: { idea: Idea }) {
  return <div className="idea-labels"><span>Idea</span>{idea.featured ? <span>Featured</span> : null}{idea.categories.map((category) => <span key={category}>{category}</span>)}</div>;
}

function Facts({ idea }: { idea: Idea }) {
  const updated = new Intl.DateTimeFormat("en", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" }).format(new Date(idea.updatedAt));
  return <dl className="idea-facts"><div><dt>Last updated</dt><dd>{updated}</dd></div>{idea.authorName ? <div><dt>Added by</dt><dd>{idea.authorName}</dd></div> : null}<div><dt>Category</dt><dd>{idea.categories.join(" / ") || "Uncategorized"}</dd></div></dl>;
}

function Tags({ idea }: { idea: Idea }) {
  return idea.tags.length ? <ul className="idea-tags" aria-label="Tags">{idea.tags.map((tag) => <li key={tag}>{tag}</li>)}</ul> : null;
}

function Highlights({ idea }: { idea: Idea }) {
  return idea.highlights.length ? <ul className="idea-highlights">{idea.highlights.map((item) => <li key={item}>{item}</li>)}</ul> : null;
}

function Details({ idea }: { idea: Idea }) {
  return <section className="idea-reading" aria-label="Idea details">{idea.body ? <MarkdownBody markdown={idea.body} /> : <p className="idea-muted">No additional details have been added yet.</p>}</section>;
}

export default function IdeaDetailPage({ idea, canEdit = false, initialLayout = "editorial" }: { idea: Idea; canEdit?: boolean; initialLayout?: IdeaLayout }) {
  const [layout, setLayout] = useState<IdeaLayout>(initialLayout);
  useEffect(() => {
    const sync = () => setLayout(parseIdeaLayout(new URL(window.location.href).searchParams.get("layout")));
    window.addEventListener("popstate", sync);
    return () => window.removeEventListener("popstate", sync);
  }, []);
  const active = IDEA_LAYOUTS.find((item) => item.id === layout)!;
  const selectLayout = (value: IdeaLayout) => {
    setLayout(value);
    const url = new URL(window.location.href);
    url.searchParams.set("layout", value);
    window.history.replaceState(null, "", url);
  };

  return (
    <article className={`idea-detail idea-detail--${layout}`} data-idea-layout={layout}>
      <div className="idea-layout-toolbar">
        <Link href="/ideas" className="idea-back-link"><ArrowLeft size={16} aria-hidden /> All ideas</Link>
        <div className="idea-layout-picker"><span>Page layout</span><div role="group" aria-label="Idea page layout">{IDEA_LAYOUTS.map((item, index) => <button key={item.id} type="button" aria-pressed={layout === item.id} onClick={() => selectLayout(item.id)}><span aria-hidden>{String(index + 1).padStart(2, "0")}</span>{item.name}</button>)}</div></div>
      </div>
      {canEdit ? <div className="idea-admin-actions"><span role="status">{idea.contentRevision > idea.notionSyncedRevision ? "Updated — pending Notion sync" : "No pending Notion changes"}</span><Link className="idea-secondary-button" href={`/admin/ideas/${idea.id}?layout=${layout}&returnTo=idea`}><Pencil size={14} aria-hidden /> Edit idea</Link></div> : null}
      <p className="idea-layout-description" role="status">{active.description}</p>

      {layout === "editorial" ? (
        <div className="idea-editorial">
          <header className="idea-editorial-hero"><Labels idea={idea} /><h1>{idea.title}</h1><p className="idea-lead">{idea.summary}</p><Highlights idea={idea} /></header>
          <div className="idea-editorial-columns"><div><Details idea={idea} /><div className="idea-detail-end"><span className="idea-eyebrow">Filed under</span><Tags idea={idea} /></div></div><aside className="idea-editorial-rail"><span className="idea-eyebrow">The essentials</span><Facts idea={idea} /><SaveIdea idea={idea} /><Link href="/ideas" className="idea-text-link">Keep exploring <ArrowUpRight size={15} aria-hidden /></Link></aside></div>
        </div>
      ) : null}

      {layout === "dossier" ? (
        <div className="idea-dossier">
          <header className="idea-dossier-hero"><div className="idea-dossier-heading"><Labels idea={idea} /><h1>{idea.title}</h1></div><div className="idea-dossier-summary"><span className="idea-eyebrow">The brief</span><p>{idea.summary}</p><SaveIdea idea={idea} /></div></header>
          <div className="idea-dossier-grid"><div className="idea-dossier-main"><div className="idea-section-heading"><span className="idea-eyebrow">01 / In detail</span><ArrowDown size={16} aria-hidden /></div><Details idea={idea} /></div><aside className="idea-dossier-aside"><section className="idea-dossier-card"><h2>At a glance</h2><Facts idea={idea} /></section>{idea.highlights.length ? <section className="idea-dossier-card"><h2>Key points</h2><Highlights idea={idea} /></section> : null}{idea.tags.length ? <section className="idea-dossier-card"><h2>Topics</h2><Tags idea={idea} /></section> : null}<Link href="/ideas" className="idea-dossier-explore">Find your next idea <ArrowUpRight size={18} aria-hidden /></Link></aside></div>
        </div>
      ) : null}

      {layout === "focus" ? (
        <div className="idea-focus">
          <header className="idea-focus-hero"><Labels idea={idea} /><h1>{idea.title}</h1><p className="idea-lead">{idea.summary}</p><SaveIdea idea={idea} /></header>
          <div className="idea-focus-body"><Highlights idea={idea} /><Details idea={idea} /><div className="idea-focus-colophon"><span className="idea-eyebrow">About this idea</span><Facts idea={idea} /><Tags idea={idea} /></div></div>
          <Link href="/ideas" className="idea-focus-next">There’s more to explore.<span>Back to all ideas <ArrowUpRight size={18} aria-hidden /></span></Link>
        </div>
      ) : null}
    </article>
  );
}
