export const FAVORITE_ITEM_TYPES = ["idea"] as const;
export type FavoriteItemType = (typeof FAVORITE_ITEM_TYPES)[number];

export function isFavoriteItemType(v: string): v is FavoriteItemType {
  return (FAVORITE_ITEM_TYPES as readonly string[]).includes(v);
}

/** Stored in `profiles.favorites` JSONB */
export type FavoriteItemJson = {
  id: string;
  title: string;
  subtitle: string | null;
  savedAt: string;
};

export type ProfileFavorites = {
  idea: FavoriteItemJson[];
};

/** API / dashboard shape */
export type FavoriteRow = {
  id: string;
  item_type: FavoriteItemType;
  item_id: string;
  item_title: string;
  item_subtitle: string | null;
  created_at: string;
};
