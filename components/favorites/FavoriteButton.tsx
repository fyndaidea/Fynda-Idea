"use client";

import { Star } from "lucide-react";
import { toast } from "@/lib/toast";
import { useFavoritesContext } from "@/components/favorites/FavoritesProvider";

type Props = {
  itemId: string;
  itemTitle: string;
  itemSubtitle?: string;
  className?: string;
};

export default function FavoriteButton({ itemId, itemTitle, itemSubtitle, className = "" }: Props) {
  const { ready, isFavorite, toggleFavorite } = useFavoritesContext();
  const favorited = isFavorite(itemId);

  const onClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const result = await toggleFavorite({ itemId, itemTitle, itemSubtitle });
    if (!result.ok) {
      if (!favorited) return;
      toast.error("Could not update favorite.");
      return;
    }
    toast.success(result.favorited ? "Saved to your dashboard" : "Removed from favorites");
  };

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!ready}
      aria-pressed={favorited}
      aria-label={favorited ? "Remove from favorites" : "Add to favorites"}
      title={favorited ? "Remove from favorites" : "Save to favorites"}
      className={[
        "inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-[color:var(--card-border)] transition disabled:opacity-40",
        favorited
          ? "bg-[color:var(--accent-muted)] text-[color:var(--accent)]"
          : "bg-[color:var(--card)] text-[color:var(--muted)] hover:text-[color:var(--foreground)]",
        className,
      ].join(" ")}
    >
      <Star
        className="h-4 w-4"
        strokeWidth={1.75}
        fill={favorited ? "currentColor" : "none"}
        aria-hidden
      />
    </button>
  );
}
