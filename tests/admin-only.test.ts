import assert from "node:assert/strict";
import test from "node:test";
import { ADMIN_GATE_HEADERS, COOKING_HTML, isAdminGatePublicPath, isGateAdmin } from "../lib/access/admin-only";

test("anonymous and non-admin roles cannot enter any product", () => {
  for (const role of [undefined, null, "user", "editor", "superadmin", "Admin", ""]) assert.equal(isGateAdmin(role), false);
  assert.equal(isGateAdmin("admin"), true);
});
test("public exceptions only allow sign-in, recovery, and exact shell assets", () => {
  for (const path of ["/login", "/register", "/launch-waitlist.js", "/admin/login", "/forgot-password", "/reset-password", "/auth/callback", "/favicon.ico", "/_next/static/chunks/app.js"]) assert.equal(isAdminGatePublicPath(path), true, path);
  for (const path of ["/", "/admin", "/dashboard", "/tools", "/api/tools", "/api/admin/tools", "/api/storage", "/api/mcp/http", "/sitemap.xml", "/secret.png", "/_next/image", "/login/extra", "/auth/unrecognized"]) assert.equal(isAdminGatePublicPath(path), false, path);
});
test("public pages cannot be used to bypass the gate with mutation requests", () => {
  assert.equal(isAdminGatePublicPath("/login", "POST"), false);
  assert.equal(isAdminGatePublicPath("/register", "POST"), false);
  assert.equal(isAdminGatePublicPath("/api/profile", "GET"), true);
  assert.equal(isAdminGatePublicPath("/api/profile", "PATCH"), false);
  assert.equal(isAdminGatePublicPath("/api/auth/sync-profile", "POST"), true);
  assert.equal(isAdminGatePublicPath("/api/waitlist", "POST"), true);
  assert.equal(isAdminGatePublicPath("/api/waitlist", "GET"), false);
  assert.equal(isAdminGatePublicPath("/auth/callback", "POST"), false);
  assert.equal(isAdminGatePublicPath("/login", "HEAD"), true);
  assert.equal(isAdminGatePublicPath("/api/auth/signout", "POST"), true);
  assert.equal(isAdminGatePublicPath("/api/auth/signout", "GET"), false);
});
test("the launch screen reveals no app data and responses cannot be cached or indexed", () => {
  assert.match(COOKING_HTML, /Something is cooking\./);
  assert.match(COOKING_HTML, /href="\/login"/);
  assert.match(COOKING_HTML, /href="\/register"/);
  assert.match(COOKING_HTML, /action="\/api\/waitlist"/);
  assert.equal(ADMIN_GATE_HEADERS["Cache-Control"], "private, no-store, max-age=0");
  assert.match(ADMIN_GATE_HEADERS["X-Robots-Tag"], /noindex/);
});
