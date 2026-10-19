"use client";

import type { Idea } from "@/lib/db/ideas-db";
import FavoriteButton from "@/components/favorites/FavoriteButton";
import { ShimmerBlock } from "@/components/ui/Shimmer";
import { IdeaPreviewLink } from "./IdeaPreviewLink";
import { ideaUpdatedDateFormat } from "./IdeaUpdatedMeta";
import { IdeaStatusControl } from "./IdeaStatusControl";

function updatedDate(value: Date | string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "—" : ideaUpdatedDateFormat.format(date);
}

export function IdeasTable({ ideas, loading = false }: { ideas: Idea[]; loading?: boolean }) {
  return <div className="ideas-table-wrap" role="region" aria-label="Ideas table" tabIndex={0}>
    <table className="ideas-table">
      <caption className="sr-only">Ideas with categories, status, last update and favorites. Open an idea title to preview its details.</caption>
      <thead><tr><th scope="col">Idea</th><th scope="col">Category</th><th scope="col">Status</th><th scope="col">Updated</th><th scope="col" className="ideas-table-saved">Saved</th></tr></thead>
      <tbody>
        {loading ? Array.from({ length: 6 }, (_, index) => <tr key={index} aria-hidden="true">
          <td><ShimmerBlock className="h-4 w-4/5" /><ShimmerBlock className="mt-3 h-3 w-full" /></td>
          <td><ShimmerBlock className="h-3 w-20" /></td><td><ShimmerBlock className="h-8 w-36" rounded="rounded-lg" /></td>
          <td><ShimmerBlock className="h-3 w-20" /></td><td><ShimmerBlock className="ml-auto h-8 w-8" rounded="rounded-full" /></td>
        </tr>) : ideas.map(idea => <tr key={idea.id} data-idea-id={idea.id}>
          <td className="ideas-table-main"><IdeaPreviewLink idea={idea} className="ideas-table-link">
            <span className="ideas-table-title">{idea.title}</span>
            <span className="ideas-table-summary">{idea.summary}</span>
          </IdeaPreviewLink>{idea.featured ? <span className="ideas-table-featured">Featured</span> : null}</td>
          <td className="ideas-table-category">{idea.categories.length ? idea.categories.slice(0, 3).join(" · ") : "—"}</td>
          <td><IdeaStatusControl ideaId={idea.id} compact /></td>
          <td className="ideas-table-date"><time dateTime={new Date(idea.updatedAt).toISOString()}>{updatedDate(idea.updatedAt)}</time></td>
          <td className="ideas-table-saved"><FavoriteButton itemId={idea.slug} itemTitle={idea.title} itemSubtitle={idea.summary} /></td>
        </tr>)}
      </tbody>
    </table>
  </div>;
}
