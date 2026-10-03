import fs from "fs";
import type { DocManifestEntry } from "./types";
import { loadManifest } from "./manifest";
import { docFileAbsolute } from "./paths";
import { showAdminDocs } from "./config";

export type ResolvedDoc = {
  entry: DocManifestEntry;
  kind: "user" | "admin";
  content: string;
  title: string;
  description?: string;
};

function findEntry(entries: DocManifestEntry[], slugKey: string): DocManifestEntry | undefined {
  return entries.find((e) => e.slug === slugKey);
}

export function resolveDoc(admin: boolean, slugParam: string[]): ResolvedDoc | null {
  const manifest = loadManifest();
  const innerKey = slugParam.length ? slugParam.join("/") : "";

  if (admin && !showAdminDocs()) {
    return null;
  }

  const pool = admin ? manifest.admin : manifest.user;
  let entry = findEntry(pool, innerKey);

  if (!entry && innerKey === "") {
    entry = pool.find((e) => e.slug === "") ?? pool[0];
  }

  if (!entry) {
    return null;
  }

  const abs = docFileAbsolute(entry.file);
  if (!fs.existsSync(abs)) {
    return null;
  }

  const content = fs.readFileSync(abs, "utf8");

  return {
    entry,
    kind: admin ? "admin" : "user",
    content,
    title: entry.title,
    description: entry.description,
  };
}

export function manifestToStaticSlugs(): { slug: string[] }[] {
  const manifest = loadManifest();
  const out: { slug: string[] }[] = [];

  if (manifest.user.length > 0) {
    out.push({ slug: [] });
  }
  for (const u of manifest.user) {
    if (!u.slug) continue;
    out.push({ slug: u.slug.split("/").filter(Boolean) });
  }

  if (showAdminDocs() && manifest.admin.length > 0) {
    out.push({ slug: ["admin"] });
    for (const a of manifest.admin) {
      if (!a.slug) continue;
      out.push({ slug: ["admin", ...a.slug.split("/").filter(Boolean)] });
    }
  }

  return out;
}
