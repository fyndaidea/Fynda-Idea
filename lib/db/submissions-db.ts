import { getDb } from "@/lib/db";

export type IdeaSubmissionStatus = "pending" | "approved" | "rejected";

export type IdeaSubmissionRow = {
  id: string;
  title: string;
  summary: string;
  body: string;
  category: string;
  tags: string[] | null;
  submitter_email: string | null;
  submitter_name: string | null;
  status: string;
  created_at: Date;
  reviewed_at: Date | null;
};

export async function createIdeaSubmission(input: {
  title: string;
  summary?: string;
  body?: string;
  category?: string;
  tags?: string[];
  submitter_email?: string | null;
  submitter_name?: string | null;
}) {
  return getDb()
    .insertInto("idea_submissions")
    .values({
      title: input.title.trim(),
      summary: (input.summary ?? "").trim(),
      body: (input.body ?? "").trim(),
      category: (input.category ?? "").trim(),
      tags: input.tags ?? [],
      submitter_email: input.submitter_email?.trim() || null,
      submitter_name: input.submitter_name?.trim() || null,
      status: "pending",
      created_at: new Date(),
    })
    .returningAll()
    .executeTakeFirstOrThrow();
}

export async function listIdeaSubmissions(options?: {
  status?: IdeaSubmissionStatus;
  limit?: number;
}) {
  let q = getDb()
    .selectFrom("idea_submissions")
    .selectAll()
    .orderBy("created_at", "desc")
    .limit(options?.limit ?? 200);
  if (options?.status) {
    q = q.where("status", "=", options.status);
  }
  return q.execute();
}

export async function getIdeaSubmissionById(id: string) {
  return getDb().selectFrom("idea_submissions").selectAll().where("id", "=", id).executeTakeFirst();
}

export async function updateIdeaSubmissionStatus(id: string, status: IdeaSubmissionStatus) {
  return getDb()
    .updateTable("idea_submissions")
    .set({
      status,
      reviewed_at: new Date(),
    })
    .where("id", "=", id)
    .returningAll()
    .executeTakeFirst();
}

export async function deleteIdeaSubmission(id: string) {
  return getDb().deleteFrom("idea_submissions").where("id", "=", id).executeTakeFirst();
}

export async function countIdeaSubmissions(options?: { status?: IdeaSubmissionStatus }) {
  let q = getDb()
    .selectFrom("idea_submissions")
    .select((eb) => eb.fn.countAll<number>().as("count"));
  if (options?.status) {
    q = q.where("status", "=", options.status);
  }
  const row = await q.executeTakeFirst();
  return Number(row?.count ?? 0);
}
