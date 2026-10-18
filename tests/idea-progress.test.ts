import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { test } from "node:test";
import { Kysely, PostgresDialect, sql } from "kysely";
import pg from "pg";
import type { Database } from "../lib/db/schema";
import { createIdea, getIdeaById, updateIdea } from "../lib/db/ideas-db";
import { listIdeaProgress, saveIdeaProgress } from "../lib/db/idea-progress-db";
import { IDEA_PROGRESS_STATUSES, isIdeaProgressStatus } from "../lib/ideas/progress";
import { ideaSectionEditSchema } from "../lib/ideas/section-edit";
import { ideaBodySections, replaceIdeaBodySection } from "../components/directory/idea-outline";

test("personal stages use the verified Notion names", () => {
  assert.equal(IDEA_PROGRESS_STATUSES.length, 13);
  assert.ok(isIdeaProgressStatus("🔥Ready for build"));
  assert.ok(isIdeaProgressStatus("To Review"));
  for (const value of ["published", "draft", "Ready for build", "admin", null]) assert.equal(isIdeaProgressStatus(value), false);
});
test("section edits cannot change publication, identity, ownership, or other sections", () => {
  assert.ok(ideaSectionEditSchema.safeParse({ section: "overview", revision: 2, title: "New title", summary: "Updated" }).success);
  for (const extra of [{ status: "draft" }, { slug: "other" }, { user_id: randomUUID() }, { body: "overwrite another section" }]) {
    assert.equal(ideaSectionEditSchema.safeParse({ section: "overview", revision: 2, title: "New title", summary: "Updated", ...extra }).success, false);
  }
  assert.equal(ideaSectionEditSchema.safeParse({ section: "overview", revision: -1, title: "", summary: "" }).success, false);
});
test("editing one Markdown section preserves its neighbors, intro, duplicate headings and fenced examples", () => {
  const markdown = "Intro\r\n\r\n## Details\r\nFirst section.\r\n\r\n~~~md\r\n## Example only\r\n~~~\r\n\r\n## Details\r\nLast section.\r\n";
  const sections = ideaBodySections(markdown);
  assert.equal(sections.length, 2);
  assert.equal(sections[0].title, "Details");
  assert.equal(sections[1].title, "Details");
  const updated = replaceIdeaBodySection(markdown, sections[1], "## Details\nChanged content.\n");
  assert.equal(updated.slice(0, sections[1].start), markdown.slice(0, sections[1].start));
  assert.ok(updated.endsWith("Changed content.\n"));
  assert.ok(replaceIdeaBodySection(markdown, sections[0], "## New section\nReplacement").endsWith(sections[1].source));
});

test("personal tracking is isolated, RLS enforces ownership, and stale inline edits cannot overwrite data", { skip: !process.env.TEST_DATABASE_URL }, async () => {
  const db = new Kysely<Database>({ dialect: new PostgresDialect({ pool: new pg.Pool({ connectionString: process.env.TEST_DATABASE_URL, max: 1 }) }) });
  const previous = globalThis.__fyndaDb;
  const rollback = new Error("rollback fixture");
  try {
    const a = randomUUID();
    const b = randomUUID();
    await assert.rejects(db.transaction().execute(async (trx) => {
      globalThis.__fyndaDb = trx;
      // No email, password or credentials; these identities only exist inside this transaction.
      await sql`insert into auth.users (id) values (${a}::uuid), (${b}::uuid)`.execute(trx);
      const created = await createIdea({ title: "Personal status fixture", slug: `personal-test-${randomUUID()}`, status: "published" });
      const id = String(created.id);
      await saveIdeaProgress(a, id, "Potential");
      await saveIdeaProgress(b, id, "MVP / Build");
      assert.equal((await listIdeaProgress(a, id))[0].status, "Potential");
      assert.equal((await listIdeaProgress(b, id))[0].status, "MVP / Build");
      const idea = (await getIdeaById(id))!;
      assert.equal(idea.contentRevision, 1, "personal stages must not mutate catalog revisions");
      assert.equal(idea.status, "published");
      const first = await updateIdea(id, { summary: "One section updated" }, { expectedRevision: 1 });
      assert.ok(first);
      assert.equal(await updateIdea(id, { summary: "Stale overwrite" }, { expectedRevision: 1 }), undefined);
      assert.equal((await getIdeaById(id))!.summary, "One section updated");
      assert.ok(await updateIdea(id, { title: "Renamed fixture", slug: `renamed-${randomUUID()}` }));
      assert.equal((await listIdeaProgress(a, id))[0].title, "Renamed fixture", "tracking follows stable idea IDs through renames");
      await sql`select set_config('request.jwt.claim.sub', ${a}, true)`.execute(trx);
      await sql.raw("set local role authenticated").execute(trx);
      const own = await trx.selectFrom("user_idea_progress").selectAll().where("idea_id", "=", id).execute();
      assert.equal(own.length, 1);
      assert.equal(own[0].user_id, a);
      const denied = await trx.updateTable("user_idea_progress").set({ status: "Killed" }).where("user_id", "=", b).where("idea_id", "=", id).returningAll().execute();
      assert.equal(denied.length, 0);
      await saveIdeaProgress(a, id, null);
      assert.equal((await listIdeaProgress(a, id)).length, 0);
      await sql.raw("reset role").execute(trx);
      assert.equal((await listIdeaProgress(b, id))[0].status, "MVP / Build");
      throw rollback;
    }), (error) => error === rollback);
  } finally { globalThis.__fyndaDb = previous; await db.destroy(); }
});
