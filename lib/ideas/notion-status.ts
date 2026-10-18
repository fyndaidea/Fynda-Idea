import "server-only";

import { getVaultSecretByName } from "@/lib/vault/secrets";
import { PRODUCT_SITE_URL } from "@/lib/brand/product";
import type { IdeaProgressStatus } from "./progress";

export const IDEA_VAULT_DATABASE_ID = "1a2807f336738239be4d81e6147e7a49";
export const IDEA_NOTION_SECRET_NAME = "fynda_idea_notion_token";

type LinkedIdea = { slug: string; body: string };
type NotionPage = {
  archived?: boolean;
  in_trash?: boolean;
  parent?: { database_id?: string };
  properties?: {
    Link?: { url?: string | null };
    Status?: { type?: string; status?: { name?: string } | null };
    "Entry Type"?: { select?: { name?: string } | null };
  };
};
export class NotionStatusError extends Error {
  constructor(message: string, public readonly statusCode = 502) { super(message); }
}

/** Only explicit catalog backlinks count; research/reference links are never write targets. */
export function notionPageIdForIdea(body: string): string {
  const ids = new Set<string>();
  for (const line of body.split(/\r?\n/)) {
    if (!/^\s*(?:Notion|Idea Vault)\s*:/i.test(line)) continue;
    for (const match of line.matchAll(/https:\/\/(?:app\.)?notion\.(?:com|so)\/[^\s)<>]+/gi)) {
      const path = new URL(match[0]).pathname;
      const id = path.match(/([a-f\d]{32}|[a-f\d]{8}(?:-[a-f\d]{4}){3}-[a-f\d]{12})\/?$/i)?.[1];
      if (id) ids.add(id.replaceAll("-", "").toLowerCase());
    }
  }
  if (ids.size !== 1) throw new NotionStatusError("This idea needs one verified Idea Vault link before its status can sync.", 409);
  return [...ids][0];
}

export async function syncIdeaNotionStatus(idea: LinkedIdea, status: IdeaProgressStatus, options?: {
  token: string;
  databaseId?: string;
  request?: typeof fetch;
}) {
  const pageId = notionPageIdForIdea(idea.body);
  const token = options?.token ?? (process.env.NOTION_TOKEN?.trim() || await getVaultSecretByName(IDEA_NOTION_SECRET_NAME));
  if (!token) throw new NotionStatusError("Notion sync is not configured. Your status was not changed.", 503);
  const databaseId = (options?.databaseId ?? process.env.IDEA_VAULT_DATABASE_ID ?? IDEA_VAULT_DATABASE_ID).replaceAll("-", "").toLowerCase();
  const request = options?.request ?? fetch;
  const headers = { Authorization: `Bearer ${token}`, "Notion-Version": "2022-06-28", "Content-Type": "application/json" };
  const url = `https://api.notion.com/v1/pages/${pageId}`;
  async function send(method: "GET" | "PATCH", body?: unknown): Promise<NotionPage> {
    try {
      const response = await request(url, { method, headers, cache: "no-store", signal: AbortSignal.timeout(12000), ...(body ? { body: JSON.stringify(body) } : {}) });
      if (!response.ok) throw new NotionStatusError("Could not sync this stage to Notion. Your tracker was not changed; try again.");
      return await response.json() as NotionPage;
    } catch (error) {
      if (error instanceof NotionStatusError) throw error;
      throw new NotionStatusError("Notion is unavailable. Your tracker was not changed; try again.");
    }
  }
  const page = await send("GET");
  const validParent = page.parent?.database_id?.replaceAll("-", "").toLowerCase() === databaseId;
  const origins = new Set([PRODUCT_SITE_URL, "https://fynda-idea-prod.vercel.app", process.env.NEXT_PUBLIC_APP_URL, process.env.NEXT_PUBLIC_SITE_URL].filter(Boolean).map((value) => { try { return new URL(value!).origin; } catch { return ""; } }));
  let validLink = false;
  try {
    const link = new URL(page.properties?.Link?.url ?? "");
    validLink = origins.has(link.origin) && decodeURIComponent(link.pathname).replace(/\/$/, "") === `/ideas/${idea.slug}`;
  } catch { /* An absent or malformed backlink must never become a write target. */ }
  if (!validParent || !validLink || page.archived || page.in_trash || page.properties?.["Entry Type"]?.select?.name !== "Idea" || page.properties?.Status?.type !== "status") {
    throw new NotionStatusError("The Idea Vault link could not be verified. Sync this idea’s link before changing its status.", 409);
  }
  const updated = await send("PATCH", { properties: { Status: { status: { name: status } } } });
  if (updated.properties?.Status?.status?.name !== status) throw new NotionStatusError("Notion did not confirm the selected stage. Your tracker was not changed; try again.");
}
