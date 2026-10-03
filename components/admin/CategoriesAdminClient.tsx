"use client";

import type { ColumnDef } from "@tanstack/react-table";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import Dialog, { DialogFooterActions, submitFormById } from "@/components/ui/DialogShell";
import { DataTable } from "@/components/admin/DataTable";
import { AdminLoadingState } from "@/components/admin/AdminLoadingState";
import { inputClass, labelClass, textareaClass } from "@/lib/ui-classes";
import { slugify } from "@/lib/slugify";

type CategoryRow = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  sort_order: number;
  published: boolean;
};

type DialogMode = { type: "create" } | { type: "edit"; row: CategoryRow };

export function CategoriesAdminClient() {
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<CategoryRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [dialog, setDialog] = useState<DialogMode | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/categories", { credentials: "include" });
      const data = (await res.json().catch(() => ({}))) as {
        categories?: CategoryRow[];
        error?: string;
      };
      if (!res.ok) {
        setError(data.error ?? "Failed to load categories");
        setItems([]);
        return;
      }
      setItems(Array.isArray(data.categories) ? data.categories : []);
    } catch {
      setError("Failed to load categories");
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const openCreate = useCallback(() => {
    setError(null);
    setDialog({ type: "create" });
  }, []);

  const remove = async (id: string) => {
    if (!window.confirm("Delete this category?")) return;
    setError(null);
    const res = await fetch(`/api/admin/categories/${id}`, {
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

  const submitDialog = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    const fd = new FormData(e.currentTarget);
    const name = String(fd.get("name") ?? "").trim();
    const slugRaw = String(fd.get("slug") ?? "").trim();
    const payload = {
      name,
      slug: slugRaw || slugify(name),
      description: String(fd.get("description") ?? "").trim(),
      sort_order: parseInt(String(fd.get("sort_order") ?? "0"), 10) || 0,
      published: fd.get("published") === "on",
    };

    try {
      const isCreate = dialog?.type === "create";
      const res = await fetch(
        isCreate ? "/api/admin/categories" : `/api/admin/categories/${dialog!.row.id}`,
        {
          method: isCreate ? "POST" : "PATCH",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setError(data.error ?? (isCreate ? "Create failed" : "Save failed"));
        return;
      }
      setDialog(null);
      await load();
    } finally {
      setSubmitting(false);
    }
  };

  const columns = useMemo<ColumnDef<CategoryRow>[]>(
    () => [
      {
        accessorKey: "name",
        header: "Name",
        cell: ({ row }) => (
          <div>
            <p className="font-semibold text-[color:var(--foreground)]">{row.original.name}</p>
            {row.original.description ? (
              <p className="mt-0.5 line-clamp-1 text-xs text-[color:var(--muted)]">
                {row.original.description}
              </p>
            ) : null}
          </div>
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
                href={`/categories/${row.original.slug}`}
                target="_blank"
                className="text-sm font-semibold text-[color:var(--muted)] hover:text-[color:var(--foreground)]"
              >
                View
              </Link>
            ) : null}
            <button
              type="button"
              className="text-sm font-semibold text-[color:var(--accent)]"
              onClick={() => setDialog({ type: "edit", row: row.original })}
            >
              Edit
            </button>
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

  const editRow = dialog?.type === "edit" ? dialog.row : null;

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3">
      {error && !dialog ? (
        <div className="shrink-0 rounded-xl border border-red-500/25 bg-red-500/10 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      {loading ? (
        <AdminLoadingState label="Loading categories…" />
      ) : (
        <DataTable
          data={items}
          columns={columns}
          globalSearchPlaceholder="Search categories…"
          pageSize={50}
          fillHeight
          viewStorageKey="admin-categories"
          primaryAction={{ label: "New category", onClick: openCreate }}
        />
      )}

      {dialog ? (
        <Dialog
          title={dialog.type === "create" ? "New category" : "Edit category"}
          maxWidth="md"
          onClose={() => !submitting && setDialog(null)}
          closeDisabled={submitting}
          footer={
            <DialogFooterActions
              onCancel={() => setDialog(null)}
              onPrimary={() => submitFormById("category-form")}
              primaryLabel={submitting ? "Saving…" : dialog.type === "create" ? "Create" : "Save"}
              primaryDisabled={submitting}
              cancelDisabled={submitting}
            />
          }
        >
          {error ? (
            <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
              {error}
            </div>
          ) : null}
          <form
            id="category-form"
            key={editRow?.id ?? "create"}
            onSubmit={(e) => void submitDialog(e)}
            className="space-y-4"
          >
            <label className="block space-y-1">
              <span className={labelClass}>Name</span>
              <input
                name="name"
                required
                defaultValue={editRow?.name ?? ""}
                className={inputClass}
              />
            </label>
            <label className="block space-y-1">
              <span className={labelClass}>Slug</span>
              <input
                name="slug"
                defaultValue={editRow?.slug ?? ""}
                placeholder="Auto from name if empty"
                className={inputClass}
              />
            </label>
            <label className="block space-y-1">
              <span className={labelClass}>Description</span>
              <textarea
                name="description"
                rows={3}
                defaultValue={editRow?.description ?? ""}
                className={textareaClass}
              />
            </label>
            <label className="block space-y-1">
              <span className={labelClass}>Sort order</span>
              <input
                name="sort_order"
                type="number"
                defaultValue={editRow?.sort_order ?? 0}
                className={inputClass}
              />
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input
                name="published"
                type="checkbox"
                defaultChecked={editRow?.published ?? true}
                className="h-4 w-4 rounded"
              />
              Published
            </label>
          </form>
        </Dialog>
      ) : null}
    </div>
  );
}

export default CategoriesAdminClient;
