import type { FavoriteItemJson, FavoriteItemType, FavoriteRow, ProfileFavorites } from "@/lib/favorites/types";
import { FAVORITE_ITEM_TYPES } from "@/lib/favorites/types";

export const EMPTY_FAVORITES: ProfileFavorites = { idea: [] };

function isItem(v: unknown): v is FavoriteItemJson {
  if (!v || typeof v !== "object") return false;
  const o = v as Record<string, unknown>;
  return (
    typeof o.id === "string" &&
    typeof o.title === "string" &&
    (o.subtitle === null || typeof o.subtitle === "string") &&
    typeof o.savedAt === "string"
  );
}

function normalizeList(raw: unknown): FavoriteItemJson[] {
  if (!Array.isArray(raw)) return [];
  return raw.filter(isItem).map((item) => ({
    id: item.id.trim(),
    title: item.title.trim(),
    subtitle: item.subtitle?.trim() || null,
    savedAt: item.savedAt,
  }));
}

export function parseFavorites(raw: unknown): ProfileFavorites {
  if (!raw || typeof raw !== "object") return { ...EMPTY_FAVORITES };
  const o = raw as Record<string, unknown>;
  return {
    idea: normalizeList(o.idea ?? o.ideas),
  };
}

export function favoriteRowId(type: FavoriteItemType, itemId: string) {
  return `${type}:${itemId}`;
}

export function favoritesToRows(favorites: ProfileFavorites, typeFilter?: FavoriteItemType): FavoriteRow[] {
  const types: FavoriteItemType[] = typeFilter ? [typeFilter] : [...FAVORITE_ITEM_TYPES];
  const rows: FavoriteRow[] = [];

  for (const type of types) {
    for (const item of favorites[type]) {
      rows.push({
        id: favoriteRowId(type, item.id),
        item_type: type,
        item_id: item.id,
        item_title: item.title,
        item_subtitle: item.subtitle,
        created_at: item.savedAt,
      });
    }
  }

  return rows.sort((a, b) => b.created_at.localeCompare(a.created_at));
}

export function addFavorite(
  favorites: ProfileFavorites,
  type: FavoriteItemType,
  item: { id: string; title: string; subtitle: string | null }
): ProfileFavorites {
  const savedAt = new Date().toISOString();
  const entry: FavoriteItemJson = {
    id: item.id,
    title: item.title,
    subtitle: item.subtitle,
    savedAt,
  };

  const list = favorites[type].filter((x) => x.id !== item.id);
  return {
    ...favorites,
    [type]: [entry, ...list],
  };
}

export function removeFavorite(
  favorites: ProfileFavorites,
  type: FavoriteItemType,
  itemId: string
): ProfileFavorites {
  return {
    ...favorites,
    [type]: favorites[type].filter((x) => x.id !== itemId),
  };
}

export async function getProfileFavorites(userId: string): Promise<ProfileFavorites> {
  const { getDb } = await import("@/lib/db");
  const row = await getDb()
    .selectFrom("profiles")
    .select("favorites")
    .where("id", "=", userId)
    .executeTakeFirst();

  return parseFavorites(row?.favorites);
}

export async function saveProfileFavorites(userId: string, favorites: ProfileFavorites): Promise<void> {
  const { getDb } = await import("@/lib/db");
  await getDb()
    .updateTable("profiles")
    .set({
      favorites: JSON.parse(JSON.stringify(favorites)),
      updated_at: new Date(),
    })
    .where("id", "=", userId)
    .execute();
}
