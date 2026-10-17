import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { test } from "node:test";
import { Kysely, PostgresDialect } from "kysely";
import pg from "pg";
import type { Database } from "../lib/db/schema";
import { acknowledgeIdeaNotionSync, createIdea, getIdeaById, listIdeas, updateIdea } from "../lib/db/ideas-db";
import { MCP_TOOL_PERMISSIONS, hasMcpPermission } from "../lib/mcp/permissions";

test("sync acknowledgement requires write permission", () => {
  const permission = MCP_TOOL_PERMISSIONS.acknowledge_idea_notion_sync;
  assert.equal(permission, "ideas:write");
  assert.equal(hasMcpPermission(["ideas:read"], permission), false);
});

// Explicit target only. All test records and updates roll back, including on assertion failure.
test("database tracks edits and refuses stale sync acknowledgements", { skip: !process.env.TEST_DATABASE_URL }, async () => {
  const db = new Kysely<Database>({ dialect: new PostgresDialect({ pool: new pg.Pool({ connectionString: process.env.TEST_DATABASE_URL, max: 1 }) }) });
  const previous = globalThis.__fyndaDb;
  const rollback = new Error("rollback test data");
  try {
    await assert.rejects(db.transaction().execute(async (trx) => {
      globalThis.__fyndaDb = trx;
      const created = await createIdea({ title: "Sync integration fixture", slug: `sync-test-${randomUUID()}` });
      const id = String(created.id);
      let idea = (await getIdeaById(id))!;
      assert.equal(idea.contentRevision, 1);
      assert.equal(idea.notionSyncedRevision, 0);
      assert.ok((await listIdeas({ includeDrafts: true, notionSyncPending: true })).some((item) => item.id === id));
      assert.ok(await acknowledgeIdeaNotionSync(id, 1));
      idea = (await getIdeaById(id))!;
      assert.equal(idea.notionSyncedRevision, 1);
      const timestamp = idea.updatedAt.valueOf();
      assert.ok(await acknowledgeIdeaNotionSync(id, 1));
      assert.equal((await getIdeaById(id))!.updatedAt.valueOf(), timestamp);
      await updateIdea(id, { body: "New details" });
      idea = (await getIdeaById(id))!;
      assert.equal(idea.contentRevision, 2);
      assert.equal(idea.notionSyncedRevision, 1);
      assert.equal(await acknowledgeIdeaNotionSync(id, 1), undefined);
      assert.equal((await getIdeaById(id))!.notionSyncedRevision, 1);
      await updateIdea(id, { body: "New details" });
      assert.equal((await getIdeaById(id))!.contentRevision, 2, "identical content is not a new revision");
      assert.ok(await acknowledgeIdeaNotionSync(id, 2));
      assert.ok(!(await listIdeas({ includeDrafts: true, notionSyncPending: true })).some((item) => item.id === id));
      throw rollback;
    }), (error) => error === rollback);
  } finally {
    globalThis.__fyndaDb = previous;
    await db.destroy();
  }
});
