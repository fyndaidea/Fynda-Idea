import { NextResponse } from "next/server";
import { NameConflictError, SlugConflictError } from "@/lib/db/slug-errors";

export function adminWriteErrorResponse(e: unknown, fallback: string) {
  if (e instanceof SlugConflictError) {
    return NextResponse.json(
      {
        error: e.message,
        fields: [{ field: "slug", label: "Slug", section: "basics" }],
      },
      { status: 409 }
    );
  }
  if (e instanceof NameConflictError) {
    return NextResponse.json(
      {
        error: e.message,
        fields: [{ field: "name", label: "Name", section: "basics" }],
      },
      { status: 409 }
    );
  }
  if (e instanceof Error && (e.message === "Slug is required" || e.message === "Name is required")) {
    return NextResponse.json({ error: e.message }, { status: 400 });
  }
  console.error(fallback, e);
  return NextResponse.json({ error: fallback }, { status: 500 });
}
