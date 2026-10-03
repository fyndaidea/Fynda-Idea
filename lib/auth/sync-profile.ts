import type { User } from "@supabase/supabase-js";
import { getDb } from "@/lib/db";

export async function upsertProfileFromUser(user: User) {
  const fullName =
    (typeof user.user_metadata?.full_name === "string" && user.user_metadata.full_name) ||
    (typeof user.user_metadata?.name === "string" && user.user_metadata.name) ||
    null;
  const avatarUrl =
    (typeof user.user_metadata?.avatar_url === "string" && user.user_metadata.avatar_url) ||
    (typeof user.user_metadata?.picture === "string" && user.user_metadata.picture) ||
    null;
  const now = new Date();

  await getDb()
    .insertInto("profiles")
    .values({
      id: user.id,
      full_name: fullName,
      avatar_url: avatarUrl,
      role: "user",
      favorites: { idea: [] },
      created_at: now,
      updated_at: now,
    })
    .onConflict((oc) => {
      const patch: {
        full_name?: string | null;
        avatar_url?: string | null;
        updated_at: Date;
      } = { updated_at: now };
      if (fullName) patch.full_name = fullName;
      if (avatarUrl) patch.avatar_url = avatarUrl;
      return oc.column("id").doUpdateSet(patch);
    })
    .execute();
}
