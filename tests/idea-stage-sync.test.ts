import assert from "node:assert/strict";
import { test } from "node:test";
import { notionPageIdForIdea, syncIdeaNotionStatus, IDEA_VAULT_DATABASE_ID } from "../lib/ideas/notion-status";
import { saveIdeaStageForUser } from "../lib/ideas/save-stage";

const pageId = "3fd807f3367381daaa0fcaa28a6a9e79";
const idea = { id: "11111111-1111-4111-8111-111111111111", slug: "ai-scientist", body: `Notion: https://app.notion.com/p/AI-scientist-${pageId}\n\nIdea Vault: [Open capture](https://app.notion.com/${pageId})` };
const page = () => ({ parent: { database_id: IDEA_VAULT_DATABASE_ID }, archived: false, properties: { Link: { url: "https://fynda-idea-prod.vercel.app/ideas/ai-scientist" }, "Entry Type": { select: { name: "Idea" } }, Status: { type: "status", status: { name: "To Review" } } } });

test("Notion write targets must be a single explicit backlink, never a research URL", () => {
  assert.equal(notionPageIdForIdea(idea.body), pageId);
  for (const body of ["Reference: https://app.notion.com/" + pageId, "Notion: https://notion.com.attacker.invalid/" + pageId, idea.body + "\nNotion: https://app.notion.com/aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"]) {
    assert.throws(() => notionPageIdForIdea(body), /one verified Idea Vault link/);
  }
});

test("member stage saves never call Notion; verified admin selections sync before saving only their own tracker", async () => {
  const calls: unknown[] = [];
  const dependencies = {
    roleForUser: async (id: string) => id === "admin-owner" ? "admin" : "user",
    sync: async (_idea: { slug: string; body: string }, status: string) => { calls.push(["notion", status]); },
    save: async (userId: string, ideaId: string, status: string | null) => { calls.push(["tracker", userId, ideaId, status]); },
  };
  assert.deepEqual(await saveIdeaStageForUser("member-owner", idea, "Potential", dependencies), { status: "Potential", notionSynced: false });
  assert.deepEqual(calls, [["tracker", "member-owner", idea.id, "Potential"]]);
  calls.length = 0;
  assert.deepEqual(await saveIdeaStageForUser("admin-owner", idea, "🔥Ready for build", dependencies), { status: "🔥Ready for build", notionSynced: true });
  assert.deepEqual(calls, [["notion", "🔥Ready for build"], ["tracker", "admin-owner", idea.id, "🔥Ready for build"]]);
  calls.length = 0;
  await saveIdeaStageForUser("admin-owner", idea, null, dependencies);
  assert.deepEqual(calls, [["tracker", "admin-owner", idea.id, null]], "clearing a tracker must not demote a vault idea");
  calls.length = 0;
  await assert.rejects(saveIdeaStageForUser("admin-owner", idea, "Potential", { ...dependencies, sync: async () => { throw new Error("Notion unavailable"); } }), /Notion unavailable/);
  assert.deepEqual(calls, [], "a failed Notion write must not report a saved tracker stage");
  await assert.rejects(saveIdeaStageForUser("admin-owner", idea, "Potential", { ...dependencies, save: async () => { throw new Error("database unavailable"); } }), /Notion was updated, but your tracker could not be saved/);
});

test("admin sync updates only Status after verifying database, entry type and reciprocal listing link", async () => {
  const calls: { url: string; method: string; body?: unknown }[] = [];
  const request: typeof fetch = async (url, init) => {
    calls.push({ url: String(url), method: init?.method ?? "GET", body: init?.body ? JSON.parse(String(init.body)) : undefined });
    return Response.json(init?.method === "PATCH" ? { properties: { Status: { status: { name: "Potential" } } } } : page());
  };
  await syncIdeaNotionStatus(idea, "Potential", { token: "test-only", request });
  assert.deepEqual(calls.map(c => c.method), ["GET", "PATCH"]);
  assert.ok(calls.every(c => c.url === `https://api.notion.com/v1/pages/${pageId}`));
  assert.deepEqual(calls[1].body, { properties: { Status: { status: { name: "Potential" } } } });
});

test("invalid vault targets, remote failures and unconfirmed statuses cannot become successful writes", async () => {
  for (const change of [
    (p: ReturnType<typeof page>) => { p.parent.database_id = "other-vault"; },
    (p: ReturnType<typeof page>) => { p.properties.Link.url = "https://attacker.invalid/ideas/ai-scientist"; },
    (p: ReturnType<typeof page>) => { p.properties.Link.url = "https://fynda-idea-prod.vercel.app/ideas/other-idea"; },
    (p: ReturnType<typeof page>) => { p.properties["Entry Type"].select.name = "Company"; },
    (p: ReturnType<typeof page>) => { p.archived = true; },
  ]) {
    let writes = 0;
    const request: typeof fetch = async (_url, init) => { if (init?.method === "PATCH") writes++; const current = page(); change(current); return Response.json(current); };
    await assert.rejects(syncIdeaNotionStatus(idea, "Potential", { token: "test-only", request }), /could not be verified/);
    assert.equal(writes, 0);
  }
  await assert.rejects(syncIdeaNotionStatus(idea, "Potential", { token: "test-only", request: async () => new Response("", { status: 429 }) }), /Could not sync/);
  await assert.rejects(syncIdeaNotionStatus(idea, "Potential", { token: "test-only", request: async () => Response.json(page()) }), /did not confirm/);
});
