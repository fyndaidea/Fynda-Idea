export const STORE_LAYOUTS = [
  { id: "editorial", name: "Editorial", description: "A large introduction, product cards, and a short path from discovery to download." },
  { id: "shelf", name: "Shelf", description: "A compact shop list with a category rail and one product per row." },
  { id: "spotlight", name: "Spotlight", description: "One featured product up front, then the rest of the collection." },
] as const;

export type StoreLayout = (typeof STORE_LAYOUTS)[number]["id"];

export function parseStoreLayout(value: unknown): StoreLayout {
  return STORE_LAYOUTS.find((layout) => layout.id === value)?.id ?? "editorial";
}
