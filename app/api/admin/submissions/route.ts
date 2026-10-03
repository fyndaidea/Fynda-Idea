import { NextRequest, NextResponse } from "next/server";
import { requireAdminApiResponse } from "@/lib/auth/require-admin-api";
import { listIdeaSubmissions } from "@/lib/db/submissions-db";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const denied = await requireAdminApiResponse(request);
  if (denied) return denied;
  const status = request.nextUrl.searchParams.get("status")?.trim();
  const submissions = await listIdeaSubmissions({
    status: status === "pending" || status === "approved" || status === "rejected" ? status : undefined,
  });
  return NextResponse.json({ submissions });
}
