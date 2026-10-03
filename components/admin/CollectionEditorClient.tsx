"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { toast } from "@/lib/toast";
import { SimilarIdeasSelect } from "@/components/admin/SimilarIdeasSelect";
import { AdminLoadingState } from "@/components/admin/AdminLoadingState";
import { SourceSlugFields } from "@/components/admin/SourceSlugFields";
import { btnPrimaryClass, btnSecondaryClass, inputClass, labelClass, textareaClass } from "@/lib/ui-classes";

type CollectionDetail = {
  id: string;
  title: string;
  slug: string;
  description: string;
  published: boolean;
  sort_order: number;
};

export function CollectionEditorClient({ collectionId }: { collectionId: string }) {
  const router = useRouter();
  const isNew = collectionId === "new";
  const [collection, setCollection] = useState<CollectionDetail | null>(
    isNew
      ? {
          id: "",
          title: "",
          slug: "",
          description: "",
          published: false,
          sort_order: 0,
        }
      : null
  );
  const [ideaSlugs, setIdeaSlugs] = useState<string[]>([]);
  const [loading, setLoading] = useState(!isNew);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (isNew) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/collections/${collectionId}`, { credentials: "include" });
      const data = (await res.json().catch(() => ({}))) as {
        collection?: CollectionDetail;
        idea_slugs?: string[];
        error?: string;
      };
      if (!res.ok || !data.collection) {
        setError(data.error ?? "Failed to load collection");
        setCollection(null);
        return;
      }
      setCollection(data.collection);
      setIdeaSlugs(Array.isArray(data.idea_slugs) ? data.idea_slugs : []);
    } catch {
      setError("Failed to load collection");
      setCollection(null);
    } finally {
      setLoading(false);
    }
  }, [collectionId, isNew]);

  useEffect(() => {
    void load();
  }, [load]);

  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    const fd = new FormData(e.currentTarget);
    const payload = {
      title: String(fd.get("title") ?? "").trim(),
      slug: String(fd.get("slug") ?? "").trim(),
      description: String(fd.get("description") ?? "").trim(),
      published: fd.get("published") === "on",
      sort_order: parseInt(String(fd.get("sort_order") ?? "0"), 10) || 0,
      idea_slugs: ideaSlugs,
    };

    try {
      const res = await fetch(
        isNew ? "/api/admin/collections" : `/api/admin/collections/${collectionId}`,
        {
          method: isNew ? "POST" : "PATCH",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );
      const data = (await res.json().catch(() => ({}))) as {
        collection?: { id: string };
        error?: string;
      };
      if (!res.ok) {
        setError(data.error ?? (isNew ? "Create failed" : "Save failed"));
        return;
      }
      if (isNew && data.collection?.id) {
        toast.success("Collection created");
        router.push(`/admin/collections/${data.collection.id}`);
        router.refresh();
        return;
      }
      toast.success("Changes saved");
      await load();
    } finally {
      setSubmitting(false);
    }
  };

  const remove = async () => {
    if (isNew || !collection) return;
    if (!window.confirm("Delete this collection permanently?")) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/collections/${collectionId}`, {
        method: "DELETE",
        credentials: "include",
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setError(data.error ?? "Delete failed");
        return;
      }
      router.push("/admin/collections");
      router.refresh();
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <AdminLoadingState label="Loading collection…" />;
  }

  if (!collection) {
    return (
      <div className="flex flex-1 items-center justify-center px-6 py-20">
        <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {error ?? "Collection not found"}
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-6 sm:px-6 sm:py-8">
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <Link
          href="/admin/collections"
          className="text-sm font-medium text-[color:var(--muted)] hover:text-[color:var(--foreground)]"
        >
          ← Collections
        </Link>
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-xl font-bold tracking-tight">
            {isNew ? "New collection" : collection.title}
          </h1>
          {collection.slug ? (
            <p className="text-xs text-[color:var(--muted)]">/collections/{collection.slug}</p>
          ) : null}
        </div>
        {!isNew && collection.slug ? (
          <Link href={`/collections/${collection.slug}`} target="_blank" className={btnSecondaryClass}>
            Preview
          </Link>
        ) : null}
      </div>

      {error ? (
        <p className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {error}
        </p>
      ) : null}

      <form onSubmit={submit} className="space-y-6">
        <div className="space-y-4 rounded-xl border border-[color:var(--card-border)] bg-[color:var(--card)] p-5">
          <SourceSlugFields
            sourceLabel="Title"
            sourceName="title"
            initialSource={collection.title}
            initialSlug={collection.slug}
            lockSlugFromSource={!isNew}
            slugPlaceholder="best-startup-ideas-2026"
          />
          <div>
            <label className={labelClass} htmlFor="description">
              Description
            </label>
            <textarea
              id="description"
              name="description"
              rows={3}
              className={textareaClass}
              defaultValue={collection.description}
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className={labelClass} htmlFor="sort_order">
                Sort order
              </label>
              <input
                id="sort_order"
                name="sort_order"
                type="number"
                className={inputClass}
                defaultValue={collection.sort_order}
              />
            </div>
            <label className="flex items-center gap-2 pt-7 text-sm">
              <input type="checkbox" name="published" defaultChecked={collection.published} />
              Published
            </label>
          </div>
        </div>

        <div className="space-y-3 rounded-xl border border-[color:var(--card-border)] bg-[color:var(--card)] p-5">
          <div>
            <h2 className="text-sm font-semibold">Ideas in this collection</h2>
            <p className="mt-1 text-xs text-[color:var(--muted)]">
              Search and add ideas. Order follows selection order.
            </p>
          </div>
          <SimilarIdeasSelect
            name="idea_slugs"
            label="Ideas in this collection"
            defaultValue={ideaSlugs}
            onChange={setIdeaSlugs}
          />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button type="submit" className={btnPrimaryClass} disabled={submitting}>
            {submitting ? "Saving…" : isNew ? "Create collection" : "Save changes"}
          </button>
          {!isNew ? (
            <button
              type="button"
              onClick={() => void remove()}
              className="text-sm font-medium text-red-600 hover:underline"
              disabled={submitting}
            >
              Delete collection
            </button>
          ) : null}
        </div>
      </form>
    </div>
  );
}
