import { NextRequest, NextResponse } from "next/server";
import { requireAdminApiResponse } from "@/lib/auth/require-admin-api";
import { resolveCategoryIdsFromNames } from "@/lib/db/categories-db";
import { createIdea } from "@/lib/db/ideas-db";
import { getIdeaSubmissionById, updateIdeaSubmissionStatus } from "@/lib/db/submissions-db";
import { slugify } from "@/lib/slugify";

export const dynamic = "force-dynamic";

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const denied = await requireAdminApiResponse(request);
  if (denied) return denied;

  const { id } = await context.params;
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  const sub = await getIdeaSubmissionById(id);
  if (!sub) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (sub.status !== "pending") {
    return NextResponse.json({ error: "Submission already reviewed" }, { status: 409 });
  }

  const categoryNames = sub.category
    .split(",")
    .map((name) => name.trim())
    .filter(Boolean);
  const categoryIds = await resolveCategoryIdsFromNames(categoryNames);

  let idea;
  try {
    idea = await createIdea({
      title: sub.title,
      slug: slugify(sub.title) || undefined,
      summary: sub.summary,
      body: sub.body,
      status: "published",
      featured: false,
      score: 50,
      category_ids: categoryIds,
      tags: sub.tags ?? [],
      author_name: sub.submitter_name,
    });
  } catch (e) {
    console.error("[approve-create-idea]", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Could not create idea" },
      { status: 400 }
    );
  }

  await updateIdeaSubmissionStatus(id, "approved");

  return NextResponse.json({
    ok: true,
    idea: { id: idea.id, slug: idea.slug, title: idea.title },
  });
}
