import { NextRequest, NextResponse } from "next/server";
import { sql } from "kysely";
import { requireAdminApiResponse } from "@/lib/auth/require-admin-api";
import { getDb } from "@/lib/db";

function ilike(q: string) {
  const s = q.replace(/[%_]/g, "\\$&");
  return `%${s}%`;
}

export async function GET(request: NextRequest) {
  const denied = await requireAdminApiResponse(request);
  if (denied) return denied;

  const { searchParams } = new URL(request.url);
  const q = (searchParams.get("q") ?? "").trim();
  if (!q) return NextResponse.json({ results: [] });
  if (q.length > 64) {
    return NextResponse.json({ error: "Query too long" }, { status: 400 });
  }

  try {
    const pattern = ilike(q);
    const db = getDb();

    const [ideas, submissions, feedbackPosts, roadmapHits, releaseHits, categories, collections, users] =
      await Promise.all([
        db
          .selectFrom("ideas")
          .select(["id", "title", "slug", "status"])
          .where((eb) =>
            eb.or([
              eb("title", "ilike", pattern),
              eb("summary", "ilike", pattern),
              eb("slug", "ilike", pattern),
              sql<boolean>`exists (
                select 1 from categories c
                where c.id = any(ideas.category_ids) and c.name ilike ${pattern}
              )`,
            ])
          )
          .orderBy("updated_at", "desc")
          .limit(8)
          .execute(),
        db
          .selectFrom("idea_submissions")
          .select(["id", "title", "status", "submitter_email"])
          .where((eb) =>
            eb.or([
              eb("title", "ilike", pattern),
              eb("summary", "ilike", pattern),
              eb("submitter_email", "ilike", pattern),
              eb("submitter_name", "ilike", pattern),
            ])
          )
          .orderBy("created_at", "desc")
          .limit(6)
          .execute(),
        db
          .selectFrom("feedback_posts")
          .select(["id", "title", "status"])
          .where((eb) =>
            eb.or([eb("title", "ilike", pattern), eb("description", "ilike", pattern)])
          )
          .orderBy("created_at", "desc")
          .limit(6)
          .execute()
          .catch(() => [] as { id: string; title: string; status: string }[]),
        db
          .selectFrom("roadmap_items")
          .select(["id", "title", "status"])
          .where((eb) =>
            eb.or([eb("title", "ilike", pattern), eb("description", "ilike", pattern)])
          )
          .orderBy("updated_at", "desc")
          .limit(6)
          .execute()
          .catch(() => [] as { id: string; title: string; status: string }[]),
        db
          .selectFrom("release_notes")
          .select(["id", "title"])
          .where((eb) => eb.or([eb("title", "ilike", pattern), eb("body_md", "ilike", pattern)]))
          .orderBy("updated_at", "desc")
          .limit(6)
          .execute()
          .catch(() => [] as { id: string; title: string }[]),
        db
          .selectFrom("categories")
          .select(["id", "name", "slug"])
          .where((eb) =>
            eb.or([
              eb("name", "ilike", pattern),
              eb("slug", "ilike", pattern),
              eb("description", "ilike", pattern),
            ])
          )
          .orderBy("updated_at", "desc")
          .limit(6)
          .execute(),
        db
          .selectFrom("collections")
          .select(["id", "title", "slug"])
          .where((eb) =>
            eb.or([
              eb("title", "ilike", pattern),
              eb("slug", "ilike", pattern),
              eb("description", "ilike", pattern),
            ])
          )
          .orderBy("updated_at", "desc")
          .limit(6)
          .execute(),
        db
          .selectFrom("profiles")
          .select(["id", "full_name", "role"])
          .where("full_name", "ilike", pattern)
          .orderBy("updated_at", "desc")
          .limit(6)
          .execute(),
      ]);

    const results = [
      ...ideas.map((t) => ({
        type: "idea" as const,
        title: t.title,
        subtitle: `${t.status} · /${t.slug}`,
        href: `/admin/ideas/${t.id}`,
      })),
      ...submissions.map((s) => ({
        type: "submission" as const,
        title: s.title,
        subtitle: `${s.status}${s.submitter_email ? ` · ${s.submitter_email}` : ""}`,
        href: `/admin/submissions`,
      })),
      ...feedbackPosts.map((f) => ({
        type: "feedback" as const,
        title: f.title,
        subtitle: f.status.replace(/_/g, " "),
        href: `/admin/feedback`,
      })),
      ...roadmapHits.map((r) => ({
        type: "roadmap" as const,
        title: r.title,
        subtitle: r.status.replace(/_/g, " "),
        href: `/admin/roadmap`,
      })),
      ...releaseHits.map((r) => ({
        type: "release" as const,
        title: r.title,
        subtitle: "Release note",
        href: `/admin/releases`,
      })),
      ...categories.map((c) => ({
        type: "category" as const,
        title: c.name,
        subtitle: `/${c.slug}`,
        href: `/admin/categories`,
      })),
      ...collections.map((c) => ({
        type: "collection" as const,
        title: c.title,
        subtitle: `/${c.slug}`,
        href: `/admin/collections/${c.id}`,
      })),
      ...users.map((u) => ({
        type: "user" as const,
        title: u.full_name?.trim() || "Unnamed user",
        subtitle: u.role,
        href: `/admin/users`,
      })),
    ];

    return NextResponse.json({ results });
  } catch (e) {
    console.error("[api/admin/search GET]", e);
    return NextResponse.json({ error: "Search unavailable" }, { status: 503 });
  }
}
