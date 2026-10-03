import { getDb } from "@/lib/db";

export async function getProfileById(id: string) {
  return getDb()
    .selectFrom("profiles")
    .selectAll()
    .where("id", "=", id)
    .executeTakeFirst();
}

/** Creates a profile row if the auth trigger did not run. */
export async function ensureProfile(userId: string) {
  const existing = await getProfileById(userId);
  if (existing) return existing;
  const now = new Date();
  try {
    await getDb()
      .insertInto("profiles")
      .values({
        id: userId,
        role: "user",
        favorites: { idea: [] },
        created_at: now,
        updated_at: now,
      })
      .onConflict((oc) => oc.column("id").doNothing())
      .execute();
  } catch (e) {
    console.warn("[ensureProfile]", e);
  }
  return getProfileById(userId);
}

export async function updateProfile(
  id: string,
  data: { full_name?: string | null; avatar_url?: string | null }
) {
  const patch: Record<string, unknown> = { updated_at: new Date() };
  if (data.full_name !== undefined) patch.full_name = data.full_name?.trim() || null;
  if (data.avatar_url !== undefined) patch.avatar_url = data.avatar_url?.trim() || null;
  await getDb().updateTable("profiles").set(patch).where("id", "=", id).execute();
}

export async function listProfiles(options?: { limit?: number }) {
  return getDb()
    .selectFrom("profiles")
    .selectAll()
    .orderBy("created_at", "desc")
    .limit(options?.limit ?? 200)
    .execute();
}

export async function updateProfileRole(id: string, role: "user" | "admin") {
  await getDb()
    .updateTable("profiles")
    .set({ role, updated_at: new Date() })
    .where("id", "=", id)
    .execute();
}
