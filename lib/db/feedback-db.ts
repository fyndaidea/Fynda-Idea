import { getDb } from "@/lib/db";

export type FeedbackPostRow = {
  id: string;
  user_id: string | null;
  title: string;
  description: string | null;
  category: string | null;
  status: string;
  created_at: Date;
  updated_at: Date;
};

export type RoadmapItemRow = {
  id: string;
  title: string;
  description: string | null;
  status: string;
  target_date: Date | null;
  sort_order: number;
  created_at: Date;
  updated_at: Date;
};

export type ReleaseNoteRow = {
  id: string;
  title: string;
  body_md: string;
  published_at: Date | null;
  created_at: Date;
  updated_at: Date;
};

export async function listFeedbackPosts(options?: {
  status?: string;
  q?: string;
  limit?: number;
  offset?: number;
}) {
  let q = getDb()
    .selectFrom("feedback_posts")
    .selectAll()
    .orderBy("created_at", "desc")
    .limit(options?.limit ?? 100)
    .offset(options?.offset ?? 0);
  if (options?.status) {
    q = q.where("status", "=", options.status);
  }
  if (options?.q) {
    const term = `%${options.q}%`;
    q = q.where((eb) => eb.or([eb("title", "ilike", term), eb("description", "ilike", term)]));
  }
  return q.execute();
}

export async function getFeedbackPostById(id: string) {
  return getDb().selectFrom("feedback_posts").selectAll().where("id", "=", id).executeTakeFirst();
}

export async function createFeedbackPost(input: {
  user_id?: string | null;
  title: string;
  description?: string | null;
  category?: string | null;
}) {
  const now = new Date();
  return getDb()
    .insertInto("feedback_posts")
    .values({
      user_id: input.user_id ?? null,
      title: input.title.trim(),
      description: input.description?.trim() || null,
      category: input.category?.trim() || null,
      status: "open",
      created_at: now,
      updated_at: now,
    })
    .returningAll()
    .executeTakeFirstOrThrow();
}

export async function updateFeedbackPost(
  id: string,
  input: Partial<{ title: string; description: string | null; category: string | null; status: string }>
) {
  const patch: Record<string, unknown> = { updated_at: new Date() };
  if (input.title != null) patch.title = input.title.trim();
  if (input.description !== undefined) patch.description = input.description?.trim() || null;
  if (input.category !== undefined) patch.category = input.category?.trim() || null;
  if (input.status != null) patch.status = input.status;
  return getDb().updateTable("feedback_posts").set(patch).where("id", "=", id).returningAll().executeTakeFirst();
}

export async function deleteFeedbackPost(id: string) {
  return getDb().deleteFrom("feedback_posts").where("id", "=", id).executeTakeFirst();
}

export async function countFeedbackVotes(postId: string) {
  const row = await getDb()
    .selectFrom("feedback_votes")
    .select((eb) => eb.fn.countAll<number>().as("count"))
    .where("post_id", "=", postId)
    .executeTakeFirst();
  return Number(row?.count ?? 0);
}

/** Batch vote counts + optional "voted by me" set for a list of post ids. */
export async function getFeedbackVoteStats(postIds: string[], userId?: string | null) {
  const countByPostId = new Map<string, number>();
  const votedByMe = new Set<string>();
  if (postIds.length === 0) return { countByPostId, votedByMe };

  const voteCounts = await getDb()
    .selectFrom("feedback_votes")
    .select(["post_id"])
    .select((eb) => eb.fn.countAll<number>().as("count"))
    .where("post_id", "in", postIds)
    .groupBy("post_id")
    .execute();

  for (const r of voteCounts) {
    countByPostId.set(r.post_id, Number(r.count) || 0);
  }

  if (userId) {
    const mine = await getDb()
      .selectFrom("feedback_votes")
      .select(["post_id"])
      .where("user_id", "=", userId)
      .where("post_id", "in", postIds)
      .execute();
    for (const r of mine) votedByMe.add(r.post_id);
  }

  return { countByPostId, votedByMe };
}

export async function hasUserVoted(postId: string, userId: string) {
  const row = await getDb()
    .selectFrom("feedback_votes")
    .select("post_id")
    .where("post_id", "=", postId)
    .where("user_id", "=", userId)
    .executeTakeFirst();
  return Boolean(row);
}

export async function addFeedbackVote(postId: string, userId: string) {
  await getDb()
    .insertInto("feedback_votes")
    .values({ post_id: postId, user_id: userId, created_at: new Date() })
    .onConflict((oc) => oc.columns(["post_id", "user_id"]).doNothing())
    .execute();
}

export async function removeFeedbackVote(postId: string, userId: string) {
  await getDb()
    .deleteFrom("feedback_votes")
    .where("post_id", "=", postId)
    .where("user_id", "=", userId)
    .execute();
}

export async function listRoadmapItems(options?: { status?: string }) {
  let q = getDb().selectFrom("roadmap_items").selectAll();
  if (options?.status) {
    q = q.where("status", "=", options.status);
  }
  return q.orderBy("status", "asc").orderBy("sort_order", "asc").orderBy("created_at", "desc").execute();
}

export async function createRoadmapItem(input: {
  title: string;
  description?: string | null;
  status?: string;
  target_date?: Date | null;
  sort_order?: number;
}) {
  const now = new Date();
  return getDb()
    .insertInto("roadmap_items")
    .values({
      title: input.title.trim(),
      description: input.description?.trim() || null,
      status: input.status?.trim() || "planned",
      target_date: input.target_date ?? null,
      sort_order: input.sort_order ?? 0,
      created_at: now,
      updated_at: now,
    })
    .returningAll()
    .executeTakeFirstOrThrow();
}

export async function updateRoadmapItem(
  id: string,
  input: Partial<{
    title: string;
    description: string | null;
    status: string;
    target_date: Date | null;
    sort_order: number;
  }>
) {
  const patch: Record<string, unknown> = { updated_at: new Date() };
  if (input.title != null) patch.title = input.title.trim().slice(0, 140);
  if (input.description !== undefined) patch.description = input.description?.trim() || null;
  if (input.status != null) patch.status = input.status.trim();
  if (input.target_date !== undefined) patch.target_date = input.target_date;
  if (input.sort_order != null) patch.sort_order = input.sort_order;
  return getDb().updateTable("roadmap_items").set(patch).where("id", "=", id).returningAll().executeTakeFirst();
}

export async function deleteRoadmapItem(id: string) {
  return getDb().deleteFrom("roadmap_items").where("id", "=", id).executeTakeFirst();
}

export async function countRoadmapItems(options?: { status?: string }) {
  let q = getDb()
    .selectFrom("roadmap_items")
    .select((eb) => eb.fn.countAll<number>().as("count"));
  if (options?.status) {
    q = q.where("status", "=", options.status);
  }
  const row = await q.executeTakeFirst();
  return Number(row?.count ?? 0);
}

export async function listReleaseNotes(options?: {
  publishedOnly?: boolean;
  limit?: number;
  offset?: number;
}) {
  let q = getDb()
    .selectFrom("release_notes")
    .selectAll()
    .orderBy("published_at", "desc")
    .orderBy("created_at", "desc");
  if (options?.publishedOnly !== false) {
    q = q.where("published_at", "is not", null);
  }
  if (options?.limit != null) {
    q = q.limit(options.limit);
  }
  if (options?.offset != null) {
    q = q.offset(options.offset);
  }
  return q.execute();
}

export async function createReleaseNote(input: { title: string; body_md: string }) {
  const now = new Date();
  return getDb()
    .insertInto("release_notes")
    .values({
      title: input.title.trim(),
      body_md: input.body_md.trim(),
      published_at: null,
      created_at: now,
      updated_at: now,
    })
    .returningAll()
    .executeTakeFirstOrThrow();
}

export async function updateReleaseNote(
  id: string,
  input: Partial<{ title: string; body_md: string; published_at: Date | null }>
) {
  const patch: Record<string, unknown> = { updated_at: new Date() };
  if (input.title != null) patch.title = input.title.trim().slice(0, 140);
  if (input.body_md != null) patch.body_md = input.body_md.trim().slice(0, 200_000);
  if (input.published_at !== undefined) patch.published_at = input.published_at;
  return getDb().updateTable("release_notes").set(patch).where("id", "=", id).returningAll().executeTakeFirst();
}

export async function setReleaseNotePublished(id: string, publish: boolean) {
  return getDb()
    .updateTable("release_notes")
    .set({
      published_at: publish ? new Date() : null,
      updated_at: new Date(),
    })
    .where("id", "=", id)
    .returningAll()
    .executeTakeFirst();
}

export async function deleteReleaseNote(id: string) {
  return getDb().deleteFrom("release_notes").where("id", "=", id).executeTakeFirst();
}

export async function countReleaseNotes(options?: { publishedOnly?: boolean }) {
  let q = getDb()
    .selectFrom("release_notes")
    .select((eb) => eb.fn.countAll<number>().as("count"));
  if (options?.publishedOnly) {
    q = q.where("published_at", "is not", null);
  }
  const row = await q.executeTakeFirst();
  return Number(row?.count ?? 0);
}

export async function countFeedbackPosts(options?: { status?: string }) {
  let q = getDb()
    .selectFrom("feedback_posts")
    .select((eb) => eb.fn.countAll<number>().as("count"));
  if (options?.status) {
    q = q.where("status", "=", options.status);
  }
  const row = await q.executeTakeFirst();
  return Number(row?.count ?? 0);
}
