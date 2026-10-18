import { NextRequest, NextResponse } from "next/server";
import { ideasDirectory } from "@/lib/ideas/directory";
import { parseDirectoryOptions } from "@/lib/ideas/directory-options";
import { getApiUser } from "@/lib/auth/get-api-user";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const params = request.nextUrl.searchParams;
    const pageSize = Math.min(100, Math.max(1, Math.floor(Number(params.get("pageSize") || params.get("limit")) || 50)));
    const auth = await getApiUser(request);
    const result = await ideasDirectory(parseDirectoryOptions(params), auth?.userId, pageSize);
    return NextResponse.json(result, {
      headers: { "Cache-Control": "private, no-store", Vary: "Cookie, Authorization" },
    });
  } catch (e) {
    console.error("[api/ideas]", e);
    return NextResponse.json({ error: "Failed to load ideas" }, { status: 500 });
  }
}
