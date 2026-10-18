// Canvas is the selected page layout; these variations affect only its details area.
export const IDEA_BODY_LAYOUTS = [
  { id: "split", name: "Split", description: "Open reading space with a compact details rail." },
  { id: "panels", name: "Panels", description: "A contained document with key points and details alongside." },
  { id: "reading", name: "Reading", description: "A narrow reading column with details at the end." },
] as const;
export type IdeaBodyLayout = (typeof IDEA_BODY_LAYOUTS)[number]["id"];
export function parseIdeaBodyLayout(value: unknown): IdeaBodyLayout {
  return IDEA_BODY_LAYOUTS.find((layout) => layout.id === value)?.id ?? "panels";
}
