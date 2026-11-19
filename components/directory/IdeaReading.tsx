"use client";

import { MarkdownBody } from "@/components/docs/markdown-body";
import type { Idea } from "@/lib/db/ideas-db";
import "./idea-reading.css";

/** Center reading column: centered title and summary, then the write-up in a large serif for long reads. */
export function IdeaReading({ idea }: { idea: Idea }) {
  const kicker = ["Idea", ...(idea.categories ?? []), idea.featured ? "Featured" : null].filter(Boolean).join(" · ");
  return (
    <article className="idea-reading">
      <header className="idea-reading-head">
        <p className="idea-reading-kicker">{kicker}</p>
        <h2 className="idea-reading-title">{idea.title}</h2>
        {idea.summary ? <p className="idea-reading-lead">{idea.summary}</p> : null}
      </header>
      <div className="idea-reading-body">
        {idea.body ? <MarkdownBody markdown={idea.body} /> : <p className="idea-muted">No additional details have been added yet.</p>}
      </div>
    </article>
  );
}
