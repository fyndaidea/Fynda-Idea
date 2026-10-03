import { NextRequest, NextResponse } from "next/server";
import { getApiUser } from "@/lib/auth/get-api-user";
import {
  addFavorite,
  favoriteRowId,
  favoritesToRows,
  getProfileFavorites,
  removeFavorite,
  saveProfileFavorites,
} from "@/lib/favorites/store";
import { isFavoriteItemType, type FavoriteItemType } from "@/lib/favorites/types";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const auth = await getApiUser(request);
    if (!auth?.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const typeParam = request.nextUrl.searchParams.get("type")?.trim() ?? "";
    let typeFilter: FavoriteItemType | undefined;
    if (typeParam) {
      if (!isFavoriteItemType(typeParam)) {
        return NextResponse.json({ error: "Invalid type" }, { status: 400 });
      }
      typeFilter = typeParam;
    }

    const favorites = await getProfileFavorites(auth.userId);
    return NextResponse.json({ favorites: favoritesToRows(favorites, typeFilter) });
  } catch (e) {
    console.error("Favorites GET error:", e);
    return NextResponse.json({ error: "Failed to load favorites" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await getApiUser(request);
    if (!auth?.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
    const itemType = typeof body?.itemType === "string" ? body.itemType.trim() : "";
    const itemId = typeof body?.itemId === "string" ? body.itemId.trim() : "";
    const itemTitle = typeof body?.itemTitle === "string" ? body.itemTitle.trim() : "";
    const itemSubtitle =
      typeof body?.itemSubtitle === "string" ? body.itemSubtitle.trim() : null;

    if (!isFavoriteItemType(itemType)) {
      return NextResponse.json({ error: "Invalid itemType" }, { status: 400 });
    }
    if (!itemId || itemId.length > 200) {
      return NextResponse.json({ error: "Invalid itemId" }, { status: 400 });
    }
    if (!itemTitle || itemTitle.length > 500) {
      return NextResponse.json({ error: "Invalid itemTitle" }, { status: 400 });
    }

    const current = await getProfileFavorites(auth.userId);
    const next = addFavorite(current, itemType, {
      id: itemId,
      title: itemTitle,
      subtitle: itemSubtitle || null,
    });
    await saveProfileFavorites(auth.userId, next);

    const saved = next[itemType].find((x) => x.id === itemId)!;
    return NextResponse.json({
      favorite: {
        id: favoriteRowId(itemType, itemId),
        item_type: itemType,
        item_id: itemId,
        item_title: saved.title,
        item_subtitle: saved.subtitle,
        created_at: saved.savedAt,
      },
    });
  } catch (e) {
    console.error("Favorites POST error:", e);
    return NextResponse.json({ error: "Failed to save favorite" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const auth = await getApiUser(request);
    if (!auth?.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const url = request.nextUrl;
    let itemType = url.searchParams.get("itemType")?.trim() ?? "";
    let itemId = url.searchParams.get("itemId")?.trim() ?? "";

    if (!itemType || !itemId) {
      const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
      itemType = typeof body?.itemType === "string" ? body.itemType.trim() : itemType;
      itemId = typeof body?.itemId === "string" ? body.itemId.trim() : itemId;
    }

    if (!isFavoriteItemType(itemType) || !itemId) {
      return NextResponse.json({ error: "itemType and itemId required" }, { status: 400 });
    }

    const current = await getProfileFavorites(auth.userId);
    const next = removeFavorite(current, itemType, itemId);
    await saveProfileFavorites(auth.userId, next);
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("Favorites DELETE error:", e);
    return NextResponse.json({ error: "Failed to remove favorite" }, { status: 500 });
  }
}
