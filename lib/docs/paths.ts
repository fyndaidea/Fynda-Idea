import path from "path";

export const DOCS_ROOT = path.join(process.cwd(), "data/docs");

export function docFileAbsolute(relativeFile: string): string {
  const abs = path.join(DOCS_ROOT, relativeFile);
  const normalized = path.normalize(abs);
  if (!normalized.startsWith(DOCS_ROOT)) {
    throw new Error("Invalid doc path");
  }
  return normalized;
}
