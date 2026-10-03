import { NextRequest, NextResponse } from "next/server";
import { createIdeaSubmission } from "@/lib/db/submissions-db";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
    const title = typeof body?.title === "string" ? body.title.trim() : "";
    if (!title || title.length > 200) {
      return NextResponse.json({ error: "title is required (max 200 chars)" }, { status: 400 });
    }
    const row = await createIdeaSubmission({
      title,
      summary: typeof body?.summary === "string" ? body.summary : "",
      body: typeof body?.body === "string" ? body.body : "",
      category: typeof body?.category === "string" ? body.category : "",
      submitter_email: typeof body?.submitter_email === "string" ? body.submitter_email : null,
      submitter_name: typeof body?.submitter_name === "string" ? body.submitter_name : null,
      tags: Array.isArray(body?.tags) ? body.tags.filter((t): t is string => typeof t === "string") : [],
    });
    return NextResponse.json({ submission: row }, { status: 201 });
  } catch (e) {
    console.error("[api/submissions]", e);
    return NextResponse.json({ error: "Failed to submit" }, { status: 500 });
  }
}
