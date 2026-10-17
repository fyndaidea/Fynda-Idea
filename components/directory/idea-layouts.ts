export const IDEA_LAYOUTS = [
  { id: "editorial", name: "Editorial", description: "A spacious story with a quiet information rail." },
  { id: "dossier", name: "Dossier", description: "A structured brief with distinct sections and an at-a-glance sidebar." },
  { id: "focus", name: "Focus", description: "A centered, distraction-free reading layout." },
] as const;

export type IdeaLayout = (typeof IDEA_LAYOUTS)[number]["id"];

export function parseIdeaLayout(value: unknown): IdeaLayout {
  return IDEA_LAYOUTS.find((layout) => layout.id === value)?.id ?? "editorial";
}
