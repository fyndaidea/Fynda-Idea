"use client";

import Link from "next/link";
import { ArrowLeft, ArrowUpRight, ArrowRight, Pencil, LayoutTemplate, PanelsTopLeft, PanelLeft, FileText, Sparkles, CalendarDays, Check, CornerDownRight } from "lucide-react";
import { useEffect, useState } from "react";
import FavoriteButton from "@/components/favorites/FavoriteButton";
import { MarkdownBody } from "@/components/docs/markdown-body";
import type { Idea } from "@/lib/db/ideas-db";
import { IDEA_LAYOUTS, parseIdeaLayout, type IdeaLayout } from "./idea-layouts";
import { ideaOutline } from "./idea-outline";
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
  return idea.highlights.length ? <ul className="idea-key-points">{idea.highlights.map((item, index) => <li key={`${index}-${item}`}><span aria-hidden>{String(index + 1).padStart(2, "0")}</span><p>{item}</p></li>)}</ul> : null;
}

function Details({ idea }: { idea: Idea }) {
  return <section id="idea-details" className="idea-reading" aria-label="Idea details">{idea.body ? <MarkdownBody markdown={idea.body} headingAnchorPrefix="idea-body" /> : <p className="idea-muted">No additional details have been added yet.</p>}</section>;
}

function Actions({ idea, canEdit, layout }: { idea: Idea; canEdit: boolean; layout: IdeaLayout }) {
  return <div className="idea-page-actions"><div className="idea-save"><FavoriteButton itemId={idea.slug} itemTitle={idea.title} itemSubtitle={idea.summary} /><span>Save idea</span></div>{canEdit ? <Link className="idea-edit-link" href={`/admin/ideas/${idea.id}?layout=${layout}&returnTo=idea`}><Pencil size={14} aria-hidden /> Edit idea</Link> : null}</div>;
}

function SyncStatus({ idea, canEdit }: { idea: Idea; canEdit: boolean }) {
  if (!canEdit) return null;
  const pending = idea.contentRevision > idea.notionSyncedRevision;
  return <p className={`idea-sync-status${pending ? " idea-sync-status--pending" : ""}`} role="status"><span aria-hidden>{pending ? <span className="idea-sync-dot" /> : <Check size={12} />}</span>{pending ? "Updated — pending Notion sync" : "No pending Notion changes"}</p>;
}

const layoutIcons = { brief: LayoutTemplate, canvas: PanelsTopLeft, workspace: PanelLeft };

export default function IdeaDetailPage({ idea, canEdit = false, initialLayout = "brief" }: { idea: Idea; canEdit?: boolean; initialLayout?: IdeaLayout }) {
  const [layout, setLayout] = useState<IdeaLayout>(initialLayout);
  useEffect(() => {
    const sync = () => setLayout(parseIdeaLayout(new URL(window.location.href).searchParams.get("layout")));
    window.addEventListener("popstate", sync);
    return () => window.removeEventListener("popstate", sync);
  }, []);
  const active = IDEA_LAYOUTS.find((item) => item.id === layout)!;
  const sections = ideaOutline(idea.body);
  const selectLayout = (value: IdeaLayout) => {
    setLayout(value);
    const url = new URL(window.location.href);
    url.searchParams.set("layout", value);
    window.history.replaceState(null, "", url);
  };
  const actions = <Actions idea={idea} canEdit={canEdit} layout={layout} />;
  const status = <SyncStatus idea={idea} canEdit={canEdit} />;

  return (
    <article className={`idea-detail idea-detail--${layout}`} data-idea-layout={layout}>
      <div className="idea-layout-toolbar">
        <Link href="/ideas" className="idea-back-link"><ArrowLeft size={15} aria-hidden /> Ideas<span>/</span><strong>Overview</strong></Link>
        <div className="idea-layout-picker"><span>Try a layout</span><div role="group" aria-label="Idea page layout">{IDEA_LAYOUTS.map((item) => { const Icon = layoutIcons[item.id]; return <button key={item.id} type="button" title={item.description} aria-pressed={layout === item.id} onClick={() => selectLayout(item.id)}><Icon size={14} aria-hidden />{item.name}</button>; })}</div></div>
      </div>
      <p className="sr-only" role="status">{active.description}</p>

      {layout === "brief" ? <div className="idea-brief">
        <header className="idea-brief-hero" id="idea-overview">
          <div className="idea-brief-heading"><div className="idea-product-icon" aria-hidden><Sparkles size={28} strokeWidth={1.5} /></div><div><Labels idea={idea} /><h1>{idea.title}</h1><p className="idea-lead">{idea.summary}</p></div></div>
          <div className="idea-hero-bottom"><p className="idea-byline"><CalendarDays size={14} aria-hidden /> Updated {updatedDate(idea)}{idea.authorName ? <><span>·</span>{idea.authorName}</> : null}</p>{actions}</div>{status}
        </header>
        <div className="idea-brief-grid"><div className="idea-brief-document"><div className="idea-document-label"><FileText size={15} aria-hidden /><span>The idea, in detail</span></div><Details idea={idea} /></div><aside className="idea-brief-sidebar">{idea.highlights.length ? <section><h2>Why it’s interesting</h2><Highlights idea={idea} /></section> : null}<section><h2>Details</h2><Facts idea={idea} /><Tags idea={idea} /></section><Link href="/ideas" className="idea-explore-link">Discover more ideas <ArrowUpRight size={16} aria-hidden /></Link></aside></div>
      </div> : null}

      {layout === "canvas" ? <div className="idea-canvas">
        <header className="idea-canvas-hero" id="idea-overview"><div className="idea-canvas-kicker"><span><Sparkles size={15} aria-hidden /> Fynda / Idea vault</span><span>Explore the possibility</span></div><Labels idea={idea} /><h1>{idea.title}</h1><p className="idea-lead">{idea.summary}</p><div className="idea-hero-bottom"><p className="idea-byline">{idea.authorName || "Fynda Idea"}<span>·</span>{updatedDate(idea)}</p>{actions}</div>{status}</header>
        {idea.highlights.length ? <section className="idea-canvas-points" aria-labelledby="idea-canvas-points-title"><div className="idea-canvas-section-title"><h2 id="idea-canvas-points-title">The opportunity</h2><span>{String(idea.highlights.length).padStart(2, "0")} key points</span></div><Highlights idea={idea} /></section> : null}
        <div className="idea-canvas-content"><aside><span className="idea-eyebrow">A closer look</span><h2>Inside the idea.</h2><Facts idea={idea} /><Tags idea={idea} /></aside><div className="idea-canvas-document"><Details idea={idea} /></div></div><Link href="/ideas" className="idea-canvas-next"><span>Keep your next idea close.</span>Explore the vault <ArrowRight size={18} aria-hidden /></Link>
      </div> : null}

      {layout === "workspace" ? <div className="idea-workspace">
        <aside className="idea-workspace-sidebar"><div className="idea-workspace-label"><FileText size={15} aria-hidden /><span>Idea document</span></div><nav aria-label="On this page"><h2>On this page</h2><a href="#idea-overview">Overview</a>{sections.length ? sections.map((section) => <a key={section.id} href={`#${section.id}`}><CornerDownRight size={12} aria-hidden />{section.title}</a>) : <a href="#idea-details">Details</a>}{idea.highlights.length ? <a href="#idea-workspace-highlights">Key points</a> : null}</nav><div className="idea-workspace-properties"><Facts idea={idea} /><Tags idea={idea} /></div></aside>
        <div className="idea-workspace-document"><header id="idea-overview"><div className="idea-workspace-top"><Labels idea={idea} />{actions}</div><h1>{idea.title}</h1><p className="idea-workspace-summary">{idea.summary}</p>{status}</header><Details idea={idea} />{idea.highlights.length ? <section className="idea-workspace-highlights" id="idea-workspace-highlights"><h2>Key points</h2><Highlights idea={idea} /></section> : null}<div className="idea-workspace-mobile-properties"><Facts idea={idea} /><Tags idea={idea} /></div><footer><span>End of idea</span><Link href="/ideas">Back to ideas <ArrowUpRight size={14} aria-hidden /></Link></footer></div>
      </div> : null}
    </article>
  );
}
