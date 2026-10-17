export const IDEA_LAYOUTS = [
  { id: "brief", name: "Brief", description: "Product overview with a clear reading panel and key details alongside." },
  { id: "canvas", name: "Canvas", description: "A bold opening, visual key points, and an open reading canvas." },
  { id: "workspace", name: "Workspace", description: "A compact document with navigation to its actual sections." },
] as const;

export type IdeaLayout = (typeof IDEA_LAYOUTS)[number]["id"];

export function parseIdeaLayout(value: unknown): IdeaLayout {
  // Keep links to the first design round usable.
  if (value === "editorial") return "brief";
  if (value === "dossier") return "canvas";
  if (value === "focus") return "workspace";
  return IDEA_LAYOUTS.find((layout) => layout.id === value)?.id ?? "brief";
}
