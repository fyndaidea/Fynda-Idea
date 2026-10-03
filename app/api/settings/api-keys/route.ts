import { NextRequest, NextResponse } from "next/server";
import { getApiUser } from "@/lib/auth/get-api-user";
import { getDb } from "@/lib/db";
import { generateApiKey } from "@/lib/settings/api-key-crypto";
import { normalizeMcpPermissions } from "@/lib/mcp/permissions";

function serializeKeyRow(r: {
  id: string;
  name: string;
  key_prefix: string;
  active: boolean;
  mcp_permissions: string[];
  usage_count: number;
  last_used_at: Date | null;
  created_at: Date;
}) {
  return {
    id: r.id,
    name: r.name,
    keyPreview: `${r.key_prefix}…`,
    created:
      r.created_at instanceof Date
        ? r.created_at.toISOString()
        : String(r.created_at),
    lastUsed: r.last_used_at
      ? r.last_used_at instanceof Date
        ? r.last_used_at.toISOString()
        : String(r.last_used_at)
      : undefined,
    usage: r.usage_count,
    status: r.active ? "Active" : "Inactive",
    mcpPermissions: r.mcp_permissions ?? [],
    mcpFullAccess: !(r.mcp_permissions?.length),
  };
}

export async function GET(request: NextRequest) {
  try {
    const auth = await getApiUser(request);
    if (!auth?.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const rows = await getDb()
      .selectFrom("user_api_keys")
      .selectAll()
      .where("user_id", "=", auth.userId)
      .orderBy("created_at", "desc")
      .execute();

    return NextResponse.json({
      keys: rows.map(serializeKeyRow),
    });
  } catch (e) {
    console.error("API keys GET error:", e);
    return NextResponse.json(
      { error: "Failed to load API keys" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await getApiUser(request);
    if (!auth?.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = (await request.json().catch(() => ({}))) as {
      name?: string;
      mcpPermissions?: unknown;
      mcpFullAccess?: boolean;
    };
    const name = typeof body.name === "string" ? body.name.trim() : "";
    if (!name) {
      return NextResponse.json({ error: "name is required" }, { status: 400 });
    }

    const mcpFullAccess = body.mcpFullAccess !== false;
    const mcpPermissions = mcpFullAccess
      ? []
      : normalizeMcpPermissions(body.mcpPermissions);
    if (!mcpFullAccess && !mcpPermissions?.length) {
      return NextResponse.json(
        { error: "Select at least one MCP permission or choose full access" },
        { status: 400 }
      );
    }

    const { plain, prefix, hash } = generateApiKey();
    const now = new Date();

    const row = await getDb()
      .insertInto("user_api_keys")
      .values({
        user_id: auth.userId,
        name,
        key_prefix: prefix,
        key_hash: hash,
        active: true,
        mcp_permissions: mcpPermissions ?? [],
        usage_count: 0,
        last_used_at: null,
        created_at: now,
        updated_at: now,
      })
      .returningAll()
      .executeTakeFirst();

    if (!row) {
      return NextResponse.json({ error: "Insert failed" }, { status: 500 });
    }

    return NextResponse.json(
      {
        id: row.id,
        plainKey: plain,
        message: "Copy this key now — it will not be shown again.",
      },
      { status: 201 }
    );
  } catch (e) {
    console.error("API keys POST error:", e);
    return NextResponse.json(
      { error: "Failed to create API key" },
      { status: 500 }
    );
  }
}
