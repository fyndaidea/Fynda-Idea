import { NextResponse } from "next/server";
import { getApiUser } from "@/lib/auth/get-api-user";
import { getDb } from "@/lib/db";

/** For Route Handlers: returns a JSON Response if not an authenticated admin, else null. */
export async function requireAdminApiResponse(request: Request): Promise<NextResponse | null> {
  const auth = await getApiUser(request);
  if (!auth?.userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const row = await getDb()
    .selectFrom("profiles")
    .select("role")
    .where("id", "=", auth.userId)
    .executeTakeFirst();
  if (!row || row.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  return null;
}
