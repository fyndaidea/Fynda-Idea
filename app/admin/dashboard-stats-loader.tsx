import { Check, FileText, Folder, Layers, Lightbulb, Map, MessageSquare, Rocket } from "lucide-react";
import type { ReactNode } from "react";
import { countCategories } from "@/lib/db/categories-db";
import { countCollections } from "@/lib/db/collections-db";
import {
  countFeedbackPosts,
  countReleaseNotes,
  countRoadmapItems,
} from "@/lib/db/feedback-db";
import { countIdeas } from "@/lib/db/ideas-db";
import { countIdeaSubmissions } from "@/lib/db/submissions-db";

function StatCard({
  label,
  value,
  icon,
  hint,
}: {
  label: string;
  value: number;
  icon: ReactNode;
  hint?: string;
}) {
  return (
    <div className="rounded-md border border-[color:var(--card-border)] bg-[color:var(--card-muted)]/40 p-4">
      <div className="flex items-start justify-between gap-3">
        <p className="text-[11px] font-medium uppercase tracking-[0.06em] text-[color:var(--muted)]">
          {label}
        </p>
        <span className="shrink-0 text-[color:var(--muted)]">{icon}</span>
      </div>
      <p className="mt-2 text-2xl font-semibold tabular-nums tracking-tight text-[color:var(--foreground)]">
        {value}
      </p>
      {hint ? <p className="mt-1 text-[11px] text-[color:var(--muted-2)]">{hint}</p> : null}
    </div>
  );
}

export async function DashboardStatsLoader() {
  const [
    ideasPublished,
    ideasAll,
    pending,
    categories,
    collections,
    feedbackTotal,
    feedbackOpen,
    roadmapTotal,
    roadmapShipped,
    releasesPublished,
  ] = await Promise.all([
    countIdeas().catch(() => 0),
    countIdeas({ includeDrafts: true }).catch(() => 0),
    countIdeaSubmissions({ status: "pending" }).catch(() => 0),
    countCategories({ includeUnpublished: true }).catch(() => 0),
    countCollections({ includeUnpublished: true }).catch(() => 0),
    countFeedbackPosts().catch(() => 0),
    countFeedbackPosts({ status: "open" }).catch(() => 0),
    countRoadmapItems().catch(() => 0),
    countRoadmapItems({ status: "shipped" }).catch(() => 0),
    countReleaseNotes({ publishedOnly: true }).catch(() => 0),
  ]);

  return (
    <section>
      <div>
        <h1 className="text-lg font-semibold tracking-tight text-[color:var(--foreground)]">
          Dashboard
        </h1>
        <p className="mt-1 text-[13px] text-[color:var(--muted)]">Fynda Idea admin overview</p>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Published ideas"
          value={ideasPublished}
          hint={`All ideas: ${ideasAll}`}
          icon={<Lightbulb className="h-4 w-4" strokeWidth={1.5} aria-hidden />}
        />
        <StatCard
          label="Pending submissions"
          value={pending}
          icon={<FileText className="h-4 w-4" strokeWidth={1.5} aria-hidden />}
        />
        <StatCard
          label="Categories"
          value={categories}
          icon={<Folder className="h-4 w-4" strokeWidth={1.5} aria-hidden />}
        />
        <StatCard
          label="Collections"
          value={collections}
          icon={<Layers className="h-4 w-4" strokeWidth={1.5} aria-hidden />}
        />
      </div>

      <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Feedback"
          value={feedbackTotal}
          hint={`Open: ${feedbackOpen}`}
          icon={<MessageSquare className="h-4 w-4" strokeWidth={1.5} aria-hidden />}
        />
        <StatCard
          label="Roadmap items"
          value={roadmapTotal}
          icon={<Map className="h-4 w-4" strokeWidth={1.5} aria-hidden />}
        />
        <StatCard
          label="Roadmap shipped"
          value={roadmapShipped}
          icon={<Check className="h-4 w-4" strokeWidth={1.5} aria-hidden />}
        />
        <StatCard
          label="Release notes"
          value={releasesPublished}
          hint="Published on site"
          icon={<Rocket className="h-4 w-4" strokeWidth={1.5} aria-hidden />}
        />
      </div>
    </section>
  );
}
