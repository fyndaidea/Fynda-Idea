"use client";

import { useEffect, useState } from "react";
import { MarkdownBody } from "@/components/docs/markdown-body";
import type { Idea } from "@/lib/db/ideas-db";
import { ideaUpdatedDateFormat } from "./IdeaUpdatedMeta";
import "./idea-reading.css";

export const READING_STYLES = [
  { id: "plain", label: "Plain" },
  { id: "editorial", label: "Editorial" },
  { id: "timeline", label: "Timeline" },
  { id: "notion", label: "Notion" },
  { id: "focus", label: "Focus" },
] as const;

export type ReadingStyle = (typeof READING_STYLES)[number]["id"];

const STORAGE_KEY = "fynda-idea-reading-style";
const isStyle = (value: unknown): value is ReadingStyle => READING_STYLES.some((style) => style.id === value);

/** Remembered per browser; storage can be unavailable, so every access is guarded. */
export function useReadingStyle() {
  const [style, setStyle] = useState<ReadingStyle>("focus");
  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      // eslint-disable-next-line react-hooks/set-state-in-effect -- hydrate the saved preference once on mount
      if (isStyle(stored)) setStyle(stored);
    } catch {}
  }, []);
  const choose = (next: ReadingStyle) => {
    setStyle(next);
    try { window.localStorage.setItem(STORAGE_KEY, next); } catch {}
  };
  return [style, choose] as const;
}

export function ReadingStyleSwitcher({ value, onChange }: { value: ReadingStyle; onChange: (style: ReadingStyle) => void }) {
  return (
    <div className="idea-reading-switcher" role="radiogroup" aria-label="Reading style">
      {READING_STYLES.map((style) => (
        <button key={style.id} type="button" role="radio" aria-checked={value === style.id} onClick={() => onChange(style.id)}>
          {style.label}
        </button>
      ))}
    </div>
  );
}

function formatDate(value: Date | string | null | undefined) {
  const date = value ? new Date(value) : null;
  return date && Number.isFinite(date.getTime()) ? ideaUpdatedDateFormat.format(date) : null;
}

type Section = { heading: string; date: string | null; markdown: string };

/** Splits the body at `## ` headings (outside code fences) so captures can become timeline entries. */
function splitSections(markdown: string) {
  const preface: string[] = [];
  const sections: Section[] = [];
  let fenced = false;
  for (const line of markdown.split("\n")) {
    if (/^\s*(```|~~~)/.test(line)) fenced = !fenced;
    const heading = !fenced ? /^##\s+(.+?)\s*#*\s*$/.exec(line) : null;
    if (heading) {
      const text = heading[1];
      const iso = /(\d{4}-\d{2}-\d{2})/.exec(text)?.[1] ?? null;
      sections.push({ heading: text, date: iso, markdown: "" });
      continue;
    }
    if (sections.length) sections[sections.length - 1].markdown += `${line}\n`;
    else preface.push(line);
  }
  // A trailing "---" belongs to the gap between entries, not to the entry text.
  for (const section of sections) section.markdown = section.markdown.replace(/\n?\s*---\s*$/, "").trim();
  return { preface: preface.join("\n").replace(/\n?\s*---\s*$/, "").trim(), sections };
}

function entryTitle(section: Section) {
  const stripped = section.date ? section.heading.replace(section.date, "").replace(/\s*[—–-]\s*$/, "").trim() : section.heading;
  return stripped || section.heading;
}

function entryDate(section: Section) {
  if (!section.date) return null;
  const date = new Date(`${section.date}T00:00:00Z`);
  return Number.isFinite(date.getTime()) ? ideaUpdatedDateFormat.format(date) : section.date;
}

function Body({ markdown }: { markdown: string }) {
  return markdown ? <MarkdownBody markdown={markdown} /> : <p className="idea-muted">No additional details have been added yet.</p>;
}

function Timeline({ markdown }: { markdown: string }) {
  const { preface, sections } = splitSections(markdown);
  if (!sections.length) return <Body markdown={markdown} />;
  return (
    <>
      {preface ? <div className="idea-reading-preface"><MarkdownBody markdown={preface} /></div> : null}
      <ol className="idea-timeline">
        {sections.map((section, index) => (
          <li key={`${index}-${section.heading}`}>
            <div className="idea-timeline-when">{entryDate(section) ?? ""}</div>
            <div className="idea-timeline-entry">
              <h3>{entryTitle(section)}</h3>
              {section.markdown ? <MarkdownBody markdown={section.markdown} /> : null}
            </div>
          </li>
        ))}
      </ol>
    </>
  );
}

export function IdeaReading({ idea, style }: { idea: Idea; style: ReadingStyle }) {
  const updated = formatDate(idea.updatedAt);
  const labels = (
    <div className="idea-labels">
      <span>Idea</span>
      {idea.featured ? <span>Featured</span> : null}
      {idea.categories?.map((category) => <span key={category}>{category}</span>)}
    </div>
  );
  const kicker = ["Idea", ...(idea.categories ?? []), idea.featured ? "Featured" : null].filter(Boolean).join(" · ");

  return (
    <article className="idea-reading" data-reading={style}>
      <header className="idea-reading-head">
        {style === "editorial" || style === "focus" ? <p className="idea-reading-kicker">{kicker}</p> : style === "notion" ? null : labels}
        <h2 className="idea-reading-title">{idea.title}</h2>
        {style === "plain" ? (
          <p className="idea-reading-meta">{[idea.categories?.join(" / ") || null, updated ? `Updated ${updated}` : null, idea.authorName?.trim() || null].filter(Boolean).join(" · ")}</p>
        ) : null}
        {style === "notion" ? (
          <dl className="idea-reading-props">
            <div><dt>Category</dt><dd>{idea.categories?.join(" / ") || "Uncategorized"}</dd></div>
            <div><dt>Updated</dt><dd>{updated ?? "Not recorded"}</dd></div>
            <div><dt>Added by</dt><dd>{idea.authorName?.trim() || "Not recorded"}</dd></div>
            {idea.tags?.length ? <div><dt>Tags</dt><dd>{idea.tags.join(", ")}</dd></div> : null}
          </dl>
        ) : null}
        {idea.summary ? <p className="idea-reading-lead">{idea.summary}</p> : null}
      </header>
      <div className="idea-reading-body">
        {style === "timeline" ? <Timeline markdown={idea.body} /> : <Body markdown={idea.body} />}
      </div>
    </article>
  );
}
