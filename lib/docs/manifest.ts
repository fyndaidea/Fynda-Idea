import fs from "fs";
import type { DocManifest, DocManifestSummary } from "./types";
import { DOCS_ROOT } from "./paths";

let cached: DocManifest | null = null;

export function loadManifest(): DocManifest {
  if (cached) return cached;
  const raw = fs.readFileSync(`${DOCS_ROOT}/manifest.json`, "utf8");
  cached = JSON.parse(raw) as DocManifest;
  return cached;
}

export function manifestSummary(manifest: DocManifest): {
  user: DocManifestSummary[];
  admin: DocManifestSummary[];
} {
  const map = (entries: DocManifest["user"]) =>
    entries.map((e) => ({
      slug: e.slug || "overview",
      title: e.title,
      description: e.description,
    }));

  return {
    user: map(manifest.user),
    admin: map(manifest.admin),
  };
}
