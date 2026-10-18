import { NextRequest, NextResponse } from "next/server";
import { requireAdminApiResponse } from "@/lib/auth/require-admin-api";
import { adminWriteErrorResponse } from "@/lib/admin/api-write-error";
import { getIdeaById, updateIdea } from "@/lib/db/ideas-db";
import { ideaSectionEditSchema } from "@/lib/ideas/section-edit";

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const denied = await requireAdminApiResponse(request);
  if (denied) return denied;
  const parsed = ideaSectionEditSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Check this section’s fields and try again." }, { status: 400 });
  try {
    const { id } = await params;
    const { revision } = parsed.data;
    const patch = parsed.data.section === "overview" ? { title: parsed.data.title, summary: parsed.data.summary }
      : parsed.data.section === "highlights" ? { highlights: parsed.data.highlights }
      : parsed.data.section === "metadata" ? { author_name: parsed.data.author_name, tags: parsed.data.tags, category_ids: parsed.data.category_ids }
      : { body: parsed.data.body };
    const updated = await updateIdea(id, patch, { expectedRevision: revision });
    if (!updated) return NextResponse.json({ error: "This idea changed in another session. Copy your edits and reload the page before saving." }, { status: 409 });
    return NextResponse.json({ idea: await getIdeaById(id) }, { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) {
    return adminWriteErrorResponse(error, "Could not save this section");
  }
}
