import { NextResponse } from "next/server";
import { requireAdminApiResponse } from "@/lib/auth/require-admin-api";
import { getDb } from "@/lib/db";
import { getAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export type AdminUserRow = {
  id: string;
  email: string;
  fullName: string | null;
  role: string;
  createdAt: string | null;
  lastSignInAt: string | null;
};

export async function GET(request: Request) {
  const denied = await requireAdminApiResponse(request);
  if (denied) return denied;

  try {
    const admin = await getAdminClient();
    const profiles = await getDb()
      .selectFrom("profiles")
      .select(["id", "full_name", "role", "created_at"])
      .orderBy("created_at", "desc")
      .execute();

    const users: AdminUserRow[] = [];
    const seen = new Set<string>();

    for (let page = 1; page <= 20; page += 1) {
      const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 200 });
      if (error) {
        console.error("[admin/users]", error);
        break;
      }
      if (!data.users.length) break;

      for (const authUser of data.users) {
        seen.add(authUser.id);
        const profile = profiles.find((p) => p.id === authUser.id);
        users.push({
          id: authUser.id,
          email: authUser.email ?? "",
          fullName:
            profile?.full_name ??
            (authUser.user_metadata?.full_name as string | undefined) ??
            null,
          role: profile?.role ?? "user",
          createdAt: authUser.created_at ?? profile?.created_at?.toISOString() ?? null,
          lastSignInAt: authUser.last_sign_in_at ?? null,
        });
      }
    }

    // Profiles without a matching auth.users row (edge cases)
    for (const profile of profiles) {
      if (seen.has(profile.id)) continue;
      users.push({
        id: profile.id,
        email: "",
        fullName: profile.full_name,
        role: profile.role,
        createdAt: profile.created_at?.toISOString() ?? null,
        lastSignInAt: null,
      });
    }

    users.sort((a, b) => {
      const at = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const bt = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return bt - at;
    });

    return NextResponse.json({ users });
  } catch (e) {
    console.error("[admin/users]", e);
    return NextResponse.json({ error: "Failed to load users" }, { status: 500 });
  }
}
