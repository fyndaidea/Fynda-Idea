import type { IdeaPreviewModel } from "./idea-preview-model";

export const ideaUpdatedDateFormat = new Intl.DateTimeFormat("en-US", {
  month: "short", day: "numeric", year: "numeric", timeZone: "UTC",
});

export function IdeaUpdatedMeta({ idea }: { idea: IdeaPreviewModel }) {
  const date = idea.updatedAt ? new Date(idea.updatedAt) : null;
  const validDate = date && Number.isFinite(date.getTime()) ? date : null;
  return <div className="idea-updated-meta">
    <p><span>Last updated</span>{validDate ? <time dateTime={validDate.toISOString()} title={validDate.toUTCString()}>{ideaUpdatedDateFormat.format(validDate)}</time> : <span>Not recorded</span>}</p>
    <span className="idea-updated-separator" aria-hidden>·</span>
    <p><span>By</span><span>{idea.authorName?.trim() || "Not recorded"}</span></p>
  </div>;
}
