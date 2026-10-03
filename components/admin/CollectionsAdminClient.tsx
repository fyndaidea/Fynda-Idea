"use client";

import type { ColumnDef } from "@tanstack/react-table";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { DataTable } from "@/components/admin/DataTable";
import { AdminLoadingState } from "@/components/admin/AdminLoadingState";

type CollectionRow = {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  sort_order: number;
  published: boolean;
  idea_count?: number;
};

export function CollectionsAdminClient() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<CollectionRow[]>([]);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/collections", { credentials: "include" });
      const data = (await res.json().catch(() => ({}))) as {
        collections?: CollectionRow[];
        error?: string;
      };
      if (!res.ok) {
        setError(data.error ?? "Failed to load collections");
        setItems([]);
        return;
      }
      setItems(Array.isArray(data.collections) ? data.collections : []);
    } catch {
      setError("Failed to load collections");
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const remove = async (id: string) => {
    if (!window.confirm("Delete this collection?")) return;
    setError(null);
    const res = await fetch(`/api/admin/collections/${id}`, {
      method: "DELETE",
      credentials: "include",
    });
    const data = (await res.json().catch(() => ({}))) as { error?: string };
    if (!res.ok) {
      setError(data.error ?? "Delete failed");
      return;
    }
    await load();
  };

  const columns = useMemo<ColumnDef<CollectionRow>[]>(
    () => [
      {
        accessorKey: "title",
        header: "Title",
        cell: ({ row }) => (
          <Link
            href={`/admin/collections/${row.original.id}`}
            className="font-medium text-[color:var(--foreground)] hover:text-[color:var(--accent)]"
          >
            {row.original.title}
          </Link>
        ),
        filterFn: "includesString",
      },
      {
        accessorKey: "slug",
        header: "Slug",
        cell: ({ row }) => (
          <span className="text-[color:var(--muted)]">{row.original.slug}</span>
        ),
        filterFn: "includesString",
      },
      {
        accessorKey: "sort_order",
        header: "Order",
        enableColumnFilter: false,
      },
      {
        accessorKey: "published",
        header: "Published",
        cell: ({ row }) => (row.original.published ? "Yes" : "No"),
        filterFn: "includesString",
      },
      {
        id: "actions",
        header: "",
        cell: ({ row }) => (
          <div className="flex items-center justify-end gap-3">
            {row.original.published ? (
              <Link
                href={`/collections/${row.original.slug}`}
                target="_blank"
                className="text-sm font-semibold text-[color:var(--muted)] hover:text-[color:var(--foreground)]"
              >
                View
              </Link>
            ) : null}
            <Link
              href={`/admin/collections/${row.original.id}`}
              className="text-sm font-semibold text-[color:var(--accent)]"
            >
              Edit
            </Link>
            <button
              type="button"
              className="text-sm font-semibold text-red-600"
              onClick={() => void remove(row.original.id)}
            >
              Delete
            </button>
          </div>
        ),
        enableSorting: false,
        enableColumnFilter: false,
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [items]
  );

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3">
      {error ? (
        <div className="shrink-0 rounded-xl border border-red-500/25 bg-red-500/10 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      {loading ? (
        <AdminLoadingState label="Loading collections…" />
      ) : (
        <DataTable
          data={items}
          columns={columns}
          globalSearchPlaceholder="Search collections…"
          pageSize={50}
          fillHeight
          viewStorageKey="admin-collections"
          primaryAction={{
            label: "New collection",
            onClick: () => router.push("/admin/collections/new"),
          }}
        />
      )}
    </div>
  );
}

export default CollectionsAdminClient;
