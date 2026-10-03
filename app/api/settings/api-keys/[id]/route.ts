import { NextRequest, NextResponse } from "next/server";
import type { Updateable } from "kysely";
import { getApiUser } from "@/lib/auth/get-api-user";
import { getDb } from "@/lib/db";
import type { UserApiKeys } from "@/lib/db/schema";
import { normalizeMcpPermissions } from "@/lib/mcp/permissions";

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const auth = await getApiUser(request);
    if (!auth?.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await context.params;
    if (!id) {
      return NextResponse.json({ error: "Missing id" }, { status: 400 });
    }

    const body = (await request.json().catch(() => ({}))) as {
      name?: string;
      active?: boolean;
      mcpPermissions?: unknown;
      mcpFullAccess?: boolean;
    };

    const patch: Updateable<UserApiKeys> = { updated_at: new Date() };
    if (typeof body.name === "string" && body.name.trim()) {
      patch.name = body.name.trim();
    }
    if (typeof body.active === "boolean") {
      patch.active = body.active;
    }
    if (body.mcpFullAccess === true) {
      patch.mcp_permissions = [];
    } else if (body.mcpFullAccess === false || body.mcpPermissions !== undefined) {
      const perms = normalizeMcpPermissions(body.mcpPermissions);
      if (!perms?.length) {
        return NextResponse.json(
          { error: "Select at least one MCP permission or choose full access" },
          { status: 400 }
        );
      }
      patch.mcp_permissions = perms;
    }

    if (
      patch.name === undefined &&
      patch.active === undefined &&
      patch.mcp_permissions === undefined
    ) {
      return NextResponse.json(
        { error: "No valid fields to update" },
        { status: 400 }
      );
    }

    const row = await getDb()
      .updateTable("user_api_keys")
      .set(patch)
      .where("id", "=", id)
      .where("user_id", "=", auth.userId)
      .returning("id")
      .executeTakeFirst();

    if (!row) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("API key PATCH error:", e);
    return NextResponse.json(
      { error: "Failed to update API key" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    const auth = await getApiUser(request);
    if (!auth?.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await context.params;
    if (!id) {
      return NextResponse.json({ error: "Missing id" }, { status: 400 });
    }

    const result = await getDb()
      .deleteFrom("user_api_keys")
      .where("id", "=", id)
      .where("user_id", "=", auth.userId)
      .executeTakeFirst();

    if (Number(result.numDeletedRows) === 0) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("API key DELETE error:", e);
    return NextResponse.json(
      { error: "Failed to delete API key" },
      { status: 500 }
    );
  }
}
