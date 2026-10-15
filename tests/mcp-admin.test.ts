import assert from "node:assert/strict";
import test from "node:test";
import { canUseMcp, checkMcpAdmin, visibleMcpSection } from "../lib/mcp/access-policy";

test("non-admin roles cannot get MCP through dashboard URLs", () => {
  for (const role of [undefined, null, "user", "editor", "Admin", "superadmin"]) {
    assert.equal(canUseMcp(role), false);
    assert.equal(visibleMcpSection("api", role, "overview"), "overview");
    assert.equal(visibleMcpSection("preferences", role, "overview"), "preferences");
  }
  assert.equal(visibleMcpSection("api", "admin", "overview"), "api");
});
test("existing credentials lose MCP access immediately when their owner stops being admin", async () => {
  let role = "admin";
  let reads = 0;
  const loadProfile = async (id: string) => {
    assert.equal(id, "credential-owner");
    reads++;
    return { role };
  };
  assert.equal(await checkMcpAdmin("credential-owner", loadProfile), true);
  role = "user";
  assert.equal(await checkMcpAdmin("credential-owner", loadProfile), false);
  assert.equal(reads, 2);
});
test("missing profiles deny access and database errors never authorize MCP", async () => {
  assert.equal(await checkMcpAdmin("owner", async () => undefined), false);
  assert.equal(await checkMcpAdmin("", async () => ({ role: "admin" })), false);
  await assert.rejects(checkMcpAdmin("owner", async () => { throw new Error("Database unavailable"); }), /Database unavailable/);
});
