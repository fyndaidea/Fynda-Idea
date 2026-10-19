import assert from "node:assert/strict";
import { test } from "node:test";
import { parseDirectoryOptions, compareDirectoryIdeas } from "../lib/ideas/directory-options";

test("directory URLs validate controls and preserve typed search spaces", () => {
  assert.deepEqual(parseDirectoryOptions(new URLSearchParams("q=AI+&page=-2&sort=sql&stage=admin&view=unknown")), { q: "AI ", page: 1, sort: "updated", stage: "", view: "grid", featured: false, saved: false });
  const selected = parseDirectoryOptions(new URLSearchParams("page=2.5&sort=oldest&stage=To+Review&view=list&featured=1&saved=1"));
  assert.equal(parseDirectoryOptions(new URLSearchParams("view=table&q=Roblox")).view, "table");
  assert.equal(selected.page, 2); assert.equal(selected.stage, "To Review"); assert.equal(selected.view, "list"); assert.ok(selected.saved && selected.featured);
  assert.equal(parseDirectoryOptions(new URLSearchParams("page=Infinity")).page, 100000);
});
test("client ordering matches each selected server sort with stable ties", () => {
  const first = { id: "a", title: "Alpha", score: 40, createdAt: "2026-01-01", updatedAt: "2026-10-01" };
  const second = { id: "b", title: "Beta", score: 80, createdAt: "2026-02-01", updatedAt: "2026-10-02" };
  for (const sort of ["updated", "newest", "score"] as const) assert.ok(compareDirectoryIdeas(first, second, sort) > 0);
  for (const sort of ["oldest", "title"] as const) assert.ok(compareDirectoryIdeas(first, second, sort) < 0);
  assert.ok(compareDirectoryIdeas(first, { ...first, id: "z" }, "updated") < 0);
});

test("directory filtering, counts and ordering happen before database pagination", { skip: !process.env.TEST_DATABASE_URL }, async () => {
  const { Kysely, PostgresDialect, sql } = await import("kysely");
  const { default: pg } = await import("pg");
  const { randomUUID } = await import("node:crypto");
  const { createIdea, listIdeas, countIdeas } = await import("../lib/db/ideas-db");
  const db = new Kysely<import("../lib/db/schema").Database>({ dialect: new PostgresDialect({ pool: new pg.Pool({ connectionString: process.env.TEST_DATABASE_URL, max: 1 }) }) });
  const previous = globalThis.__fyndaDb;
  const rollback = new Error("rollback directory fixture");
  try {
    await assert.rejects(db.transaction().execute(async trx => {
      globalThis.__fyndaDb = trx;
      const prefix = `directory-${randomUUID()}`;
      const a = await createIdea({ title: `${prefix} Alpha`, slug: `${prefix}-a`, status: "published", score: 20 });
      const b = await createIdea({ title: `${prefix} Beta`, slug: `${prefix}-b`, status: "published", score: 80, featured: true });
      const c = await createIdea({ title: `${prefix} Gamma`, slug: `${prefix}-c`, status: "published", score: 50 });
      await sql`update ideas set created_at = '2026-01-01', updated_at = '2026-10-01' where id = ${a.id}::uuid`.execute(trx);
      await sql`update ideas set created_at = '2026-02-01', updated_at = '2026-10-02' where id = ${b.id}::uuid`.execute(trx);
      await sql`update ideas set created_at = '2026-03-01', updated_at = '2026-10-03' where id = ${c.id}::uuid`.execute(trx);
      const search = prefix;
      assert.equal(await countIdeas({ search }), 3);
      assert.equal((await listIdeas({ search, sortBy: "title", limit: 1, offset: 1 }))[0].slug, b.slug);
      assert.equal((await listIdeas({ search, sortBy: "newest", limit: 1 }))[0].slug, c.slug);
      assert.equal((await listIdeas({ search, sortBy: "oldest", limit: 1 }))[0].slug, a.slug);
      assert.equal((await listIdeas({ search, sortBy: "score", limit: 1 }))[0].slug, b.slug);
      assert.equal((await listIdeas({ search, sortBy: "score", favoriteSlugs: [a.slug], limit: 1 }))[0].slug, a.slug);
      assert.equal(await countIdeas({ search, includeSlugs: [] }), 0);
      assert.equal((await listIdeas({ search, includeSlugs: [] })).length, 0);
      assert.equal(await countIdeas({ search, includeSlugs: [a.slug, c.slug], excludeSlugs: [a.slug] }), 1);
      assert.equal((await listIdeas({ search, includeSlugs: [a.slug, c.slug], excludeSlugs: [a.slug], limit: 1 }))[0].slug, c.slug);
      assert.equal(await countIdeas({ search, featuredOnly: true }), 1);
      throw rollback;
    }), error => error === rollback);
  } finally { globalThis.__fyndaDb = previous; await db.destroy(); }
});
