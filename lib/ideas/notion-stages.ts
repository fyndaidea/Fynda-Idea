import "server-only";
import { PRODUCT_SITE_URL } from "@/lib/brand/product";
import { getVaultSecretByName } from "@/lib/vault/secrets";
import { IDEA_NOTION_SECRET_NAME, IDEA_VAULT_DATABASE_ID, NotionStatusError, notionPageIdForIdea } from "./notion-status";
import { isIdeaProgressStatus, type IdeaProgressStatus } from "./progress";

type VaultStage = { pageId: string; slug: string; status: IdeaProgressStatus | null };
type QueryOptions = { token?: string; request?: typeof fetch; databaseId?: string };
type VaultPage = { id: string; archived?: boolean; in_trash?: boolean; parent?: { database_id?: string }; properties?: { Link?: { url?: string }; Status?: { type?: string; status?: { name?: string } | null }; "Entry Type"?: { select?: { name?: string } } } };
const normalize = (id: string) => id.replaceAll("-", "").toLowerCase();

export function vaultStageFromPage(page: VaultPage, databaseId: string): VaultStage | null {
  if (page.archived || page.in_trash || normalize(page.parent?.database_id ?? "") !== normalize(databaseId) || page.properties?.["Entry Type"]?.select?.name !== "Idea" || page.properties.Status?.type !== "status") return null;
  const origins = new Set([PRODUCT_SITE_URL, "https://fynda-idea-prod.vercel.app", process.env.NEXT_PUBLIC_APP_URL, process.env.NEXT_PUBLIC_SITE_URL].filter(Boolean).map(v => { try { return new URL(v!).origin; } catch { return ""; } }));
  try {
    const link = new URL(page.properties.Link?.url ?? "");
    const match = decodeURIComponent(link.pathname).match(/^\/ideas\/([^/]+)\/?$/);
    if (!origins.has(link.origin) || !match) return null;
    const status = page.properties.Status.status?.name;
    if (status !== undefined && !isIdeaProgressStatus(status)) throw new NotionStatusError("Idea Vault has an unsupported stage. Refresh the available status options before editing.", 409);
    return { pageId: normalize(page.id), slug: match[1], status: status ?? null };
  } catch (error) { if (error instanceof NotionStatusError) throw error; return null; }
}

async function queryStages(filter: unknown, options?: QueryOptions): Promise<VaultStage[]> {
  const token = options?.token ?? (process.env.NOTION_TOKEN?.trim() || await getVaultSecretByName(IDEA_NOTION_SECRET_NAME));
  if (!token) throw new NotionStatusError("Notion status sync is not configured.", 503);
  const databaseId = options?.databaseId ?? process.env.IDEA_VAULT_DATABASE_ID ?? IDEA_VAULT_DATABASE_ID;
  let cursor: string | undefined;
  const stages: VaultStage[] = [];
  do {
    let response: Response;
    try {
      response = await (options?.request ?? fetch)(`https://api.notion.com/v1/databases/${databaseId}/query`, {
        method: "POST", cache: "no-store", signal: AbortSignal.timeout(12000),
        headers: { Authorization: `Bearer ${token}`, "Notion-Version": "2022-06-28", "Content-Type": "application/json" },
        body: JSON.stringify({ page_size: 100, filter: { and: [{ property: "Entry Type", select: { equals: "Idea" } }, filter] }, ...(cursor ? { start_cursor: cursor } : {}) }),
      });
    } catch { throw new NotionStatusError("Could not read the Notion stages. Try again."); }
    if (!response.ok) throw new NotionStatusError("Could not read the Notion stages. Try again.");
    const result = await response.json() as { results: VaultPage[]; has_more: boolean; next_cursor?: string };
    if (!Array.isArray(result.results) || (result.has_more && !result.next_cursor)) throw new NotionStatusError("Notion returned an incomplete stage list. Try again.");
    for (const page of result.results) { const stage = vaultStageFromPage(page, databaseId); if (stage) stages.push(stage); }
    cursor = result.has_more ? result.next_cursor : undefined;
    if (cursor) await new Promise(resolve => setTimeout(resolve, 350));
  } while (cursor);
  return stages;
}

/** Batch reads visible ideas; the reverse catalog backlink must also match. No body-status fallback. */
export async function readIdeaNotionStages(ideas: { id: string; slug: string; body: string }[], options?: QueryOptions) {
  const statuses: Record<string, IdeaProgressStatus | null> = {};
  const errors: Record<string, string> = {};
  const linked = ideas.flatMap(idea => {
    try { return [{ ...idea, pageId: notionPageIdForIdea(idea.body) }]; }
    catch { errors[idea.id] = "Verify this idea’s Idea Vault link to load its stage."; return []; }
  });
  // Match both production/custom URL spellings, then verify the exact page ID.
  for (let start = 0; start < linked.length; start += 25) {
    const batch = linked.slice(start, start + 25);
    const origins = [...new Set([PRODUCT_SITE_URL, "https://fynda-idea-prod.vercel.app", process.env.NEXT_PUBLIC_APP_URL, process.env.NEXT_PUBLIC_SITE_URL].flatMap(origin => { try { return origin ? [new URL(origin).origin] : []; } catch { return []; } }))];
    const urls = batch.flatMap(idea => origins.flatMap(origin => [`${origin.replace(/\/$/, "")}/ideas/${idea.slug}`, `${origin.replace(/\/$/, "")}/ideas/${idea.slug}/`]));
    // Notion compound filters permit at most 100 conditions.
    const rows: VaultStage[] = [];
    for (let n = 0; n < urls.length; n += 100) {
      rows.push(...await queryStages({ or: urls.slice(n, n + 100).map(url => ({ property: "Link", rich_text: { equals: url } })) }, options));
    }
    for (const idea of batch) {
      const matches = rows.filter(row => row.slug === idea.slug && row.pageId === idea.pageId);
      if (matches.length === 1) statuses[idea.id] = matches[0].status;
      else errors[idea.id] = "The Idea Vault stage could not be verified. Check its reciprocal link.";
    }
  }
  return { statuses, errors };
}

export async function notionSlugsAtStage(stage: IdeaProgressStatus | "none", options?: QueryOptions) {
  const rows = await queryStages({ property: "Status", status: stage === "none" ? { is_empty: true } : { equals: stage } }, options);
  return [...new Set(rows.map(row => row.slug))];
}
