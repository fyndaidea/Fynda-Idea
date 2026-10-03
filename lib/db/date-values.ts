/** pg parses DATE as local-midnight Date; format with local parts to avoid a day shift. */
export function toIsoDate(value: Date | string | null | undefined): string | null {
  if (value == null || value === "") return null;
  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) return null;
    const y = value.getFullYear();
    const m = String(value.getMonth() + 1).padStart(2, "0");
    const d = String(value.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(value.trim());
  return match ? `${match[1]}-${match[2]}-${match[3]}` : null;
}

/** Accepts YYYY-MM-DD (or empty to clear); rejects anything else. */
export function parseIsoDateInput(value: string | null | undefined): string | null | undefined {
  if (value === undefined) return undefined;
  if (value === null || value.trim() === "") return null;
  const iso = toIsoDate(value);
  if (!iso) throw new Error(`Invalid date "${value}" — use YYYY-MM-DD`);
  return iso;
}

export function toNumberOrNull(value: string | number | bigint | null | undefined): number | null {
  if (value == null || value === "") return null;
  const n = typeof value === "number" ? value : Number(value);
  return Number.isFinite(n) ? n : null;
}

export function normalizeTagList(tags?: string[] | null): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const raw of tags ?? []) {
    const tag = raw.trim().toLowerCase().replace(/\s+/g, " ");
    if (!tag || seen.has(tag)) continue;
    seen.add(tag);
    out.push(tag);
  }
  return out;
}

export function normalizeUuidList(ids?: Array<string | null | undefined> | null): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const raw of ids ?? []) {
    const id = (raw ?? "").trim().toLowerCase();
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/.test(id)) continue;
    if (seen.has(id)) continue;
    seen.add(id);
    out.push(id);
  }
  return out;
}

export function clampSortOrder(value: number | undefined) {
  const n = Number.isFinite(value) ? Number(value) : 0;
  return Math.max(-10_000, Math.min(10_000, Math.trunc(n)));
}
