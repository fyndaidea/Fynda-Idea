"use client";

import { ArrowDownWideNarrow, Check, LayoutGrid, List, SlidersHorizontal, X } from "lucide-react";
import { useEffect, useId, useRef } from "react";
import { IDEA_PROGRESS_GROUPS } from "@/lib/ideas/progress";
import { IDEA_SORTS, type DirectoryOptions } from "@/lib/ideas/directory-options";

export function IdeasToolbar({ options, total, signedIn, onChange }: { options: DirectoryOptions; total: number; signedIn: boolean; onChange: (patch: Partial<DirectoryOptions>) => void }) {
  const root = useRef<HTMLDivElement>(null);
  const group = useId();
  const count = Number(Boolean(options.stage)) + Number(options.saved) + Number(options.featured);
  useEffect(() => {
    const close = (event: Event) => {
      if (event.type === "keydown" && (event as KeyboardEvent).key !== "Escape") return;
      if (event.type === "pointerdown" && root.current?.contains(event.target as Node)) return;
      root.current?.querySelectorAll<HTMLDetailsElement>("details[open]").forEach(detail => { detail.open = false; if (event.type === "keydown") detail.querySelector("summary")?.focus(); });
    };
    document.addEventListener("pointerdown", close); document.addEventListener("keydown", close);
    return () => { document.removeEventListener("pointerdown", close); document.removeEventListener("keydown", close); };
  }, []);
  const closeMenu = (target: HTMLElement) => { const detail = target.closest("details"); if (detail) { detail.open = false; detail.querySelector("summary")?.focus(); } };
  return <div ref={root} className="ideas-toolbar">
    <span className="ideas-count" aria-live="polite"><strong>{total.toLocaleString()}</strong> {total === 1 ? "idea" : "ideas"}</span>
    <details className="ideas-control-popover" name={`${group}-tools`}>
      <summary className="ideas-tool-button"><SlidersHorizontal size={15} aria-hidden /> Filter {count ? <span className="ideas-filter-count">{count}</span> : null}</summary>
      <div className="ideas-filter-panel">
        <div className="ideas-panel-title"><strong>Filter ideas</strong><button type="button" onClick={() => onChange({ stage: "", saved: false, featured: false })}>Reset</button></div>
        <label className="ideas-check"><input type="checkbox" checked={options.saved} disabled={!signedIn} onChange={event => onChange({ saved: event.target.checked })} /> Favorites only</label>
        <label className="ideas-check"><input type="checkbox" checked={options.featured} onChange={event => onChange({ featured: event.target.checked })} /> Featured only</label>
        <fieldset className="ideas-stage-filter" disabled={!signedIn}>
          <legend>Status</legend>
          {!signedIn ? <p className="ideas-filter-help">Sign in to filter by your status or favorites.</p> : null}
          <label className="ideas-radio"><input type="radio" name={`${group}-stage`} checked={!options.stage} onChange={() => onChange({ stage: "" })} /><span>All statuses</span>{!options.stage ? <Check size={14} aria-hidden /> : null}</label>
          {IDEA_PROGRESS_GROUPS.map(section => <div key={section.name}><p className="ideas-filter-group">{section.name}</p>{section.options.map(stage => <label key={stage} className="ideas-radio"><input type="radio" name={`${group}-stage`} checked={options.stage === stage} onChange={() => onChange({ stage })} /><span>{stage}</span>{options.stage === stage ? <Check size={14} aria-hidden /> : null}</label>)}</div>)}
          <label className="ideas-radio"><input type="radio" name={`${group}-stage`} checked={options.stage === "none"} onChange={() => onChange({ stage: "none" })} /><span>No status</span>{options.stage === "none" ? <Check size={14} aria-hidden /> : null}</label>
        </fieldset>
      </div>
    </details>
    <details className="ideas-control-popover" name={`${group}-tools`}>
      <summary className="ideas-tool-button"><ArrowDownWideNarrow size={15} aria-hidden /><span>{IDEA_SORTS.find(sort => sort.value === options.sort)?.label}</span></summary>
      <fieldset className="ideas-sort-panel"><legend className="sr-only">Sort ideas</legend><p className="ideas-filter-group">Sort by</p>{IDEA_SORTS.map(sort => <label className="ideas-radio" key={sort.value}>
        <input type="radio" name={`${group}-sort`} checked={options.sort === sort.value} onChange={event => { onChange({ sort: sort.value }); closeMenu(event.currentTarget); }} /><span>{sort.label}</span>{options.sort === sort.value ? <Check size={14} aria-hidden /> : null}
      </label>)}<p className="ideas-filter-help">Favorites appear first in every sort.</p></fieldset>
    </details>
    <div className="ideas-view-switch" role="group" aria-label="Idea view">
      <button type="button" aria-label="Grid view" title="Grid view" aria-pressed={options.view === "grid"} onClick={() => onChange({ view: "grid" })}><LayoutGrid size={17} aria-hidden /></button>
      <button type="button" aria-label="List view" title="List view" aria-pressed={options.view === "list"} onClick={() => onChange({ view: "list" })}><List size={18} aria-hidden /></button>
    </div>
    {count ? <button type="button" className="ideas-clear-filters" aria-label="Clear filters" title="Clear filters" onClick={() => onChange({ stage: "", saved: false, featured: false })}><X size={16} aria-hidden /></button> : null}
  </div>;
}
