"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { useCallback, useEffect, useMemo, useState } from "react";
import Dialog, { DialogFooterActions, submitFormById } from "@/components/ui/DialogShell";
import { DataTable } from "@/components/admin/DataTable";
import { AdminLoadingState } from "@/components/admin/AdminLoadingState";
import { SearchableSelect } from "@/components/ui/SearchableMultiSelect";
import { inputClass, labelClass, textareaClass } from "@/lib/ui-classes";

const STATUSES = ["planned", "in_progress", "shipped"] as const;

type RoadmapRow = {
  id: string;
  title: string;
  description: string | null;
  status: string;
  target_date: string | Date | null;
  sort_order: number;
  created_at: string | Date;
  updated_at: string | Date;
};

type DialogMode = { type: "create" } | { type: "edit"; row: RoadmapRow };

function toDateInput(v: string | Date | null | undefined): string {
  if (!v) return "";
  const d = typeof v === "string" ? new Date(v) : v;
  if (!(d instanceof Date) || Number.isNaN(d.getTime())) return "";
  return d.toISOString().slice(0, 10);
}

export function RoadmapAdminClient() {
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<RoadmapRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [dialog, setDialog] = useState<DialogMode | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/roadmap", { credentials: "include" });
      const data = (await res.json().catch(() => ({}))) as { items?: RoadmapRow[]; error?: string };
      if (!res.ok) {
        setError(data.error ?? "Failed to load roadmap");
        setItems([]);
        return;
      }
      setItems(Array.isArray(data.items) ? data.items : []);
    } catch {
      setError("Failed to load roadmap");
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
    if (!window.confirm("Delete this roadmap item?")) return;
    setError(null);
    const res = await fetch(`/api/admin/roadmap/${id}`, { method: "DELETE", credentials: "include" });
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
    const payload = {
      title: String(fd.get("title") ?? "").trim(),
      description: String(fd.get("description") ?? "").trim(),
      status: String(fd.get("status") ?? "planned"),
      target_date: String(fd.get("target_date") ?? ""),
      sort_order: parseInt(String(fd.get("sort_order") ?? "0"), 10) || 0,
    };

    try {
      const isCreate = dialog?.type === "create";
      const res = await fetch(isCreate ? "/api/admin/roadmap" : `/api/admin/roadmap/${dialog!.row.id}`, {
        method: isCreate ? "POST" : "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
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

  const columns = useMemo<ColumnDef<RoadmapRow>[]>(
    () => [
      {
        accessorKey: "title",
        header: "Title",
        cell: ({ row }) => (
          <div>
            <p className="font-semibold text-[color:var(--foreground)]">{row.original.title}</p>
            {row.original.description ? (
              <p className="mt-0.5 line-clamp-1 text-xs text-[color:var(--muted)]">{row.original.description}</p>
            ) : null}
          </div>
        ),
        filterFn: "includesString",
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => (
          <span className="text-[color:var(--muted)]">{row.original.status.replace(/_/g, " ")}</span>
        ),
        filterFn: "includesString",
      },
      {
        accessorKey: "target_date",
        header: "Target",
        cell: ({ row }) => (
          <span className="text-[color:var(--muted)]">
            {row.original.target_date ? toDateInput(row.original.target_date) : "—"}
          </span>
        ),
        enableColumnFilter: false,
      },
      {
        accessorKey: "sort_order",
        header: "Order",
        enableColumnFilter: false,
      },
      {
        id: "actions",
        header: "",
        cell: ({ row }) => (
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={() => setDialog({ type: "edit", row: row.original })}
              className="text-sm font-semibold text-[color:var(--accent)]"
            >
              Edit
            </button>
            <button
              type="button"
              onClick={() => void remove(row.original.id)}
              className="text-sm font-semibold text-red-600"
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
      {error ? (
        <div className="shrink-0 rounded-xl border border-red-500/25 bg-red-500/10 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      {loading ? (
        <AdminLoadingState label="Loading roadmap…" />
      ) : (
        <DataTable
          data={items}
          columns={columns}
          globalSearchPlaceholder="Search roadmap…"
          pageSize={50}
          fillHeight
          viewStorageKey="admin-roadmap"
          primaryAction={{ label: "New item", onClick: openCreate }}
        />
      )}

      {dialog ? (
        <Dialog
          title={dialog.type === "create" ? "New roadmap item" : "Edit roadmap item"}
          maxWidth="2xl"
          onClose={() => !submitting && setDialog(null)}
          closeDisabled={submitting}
          footer={
            <DialogFooterActions
              onCancel={() => setDialog(null)}
              onPrimary={() => submitFormById("roadmap-form")}
              primaryLabel={submitting ? "Saving…" : dialog.type === "create" ? "Create" : "Save changes"}
              primaryDisabled={submitting}
              cancelDisabled={submitting}
            />
          }
        >
          <form
            id="roadmap-form"
            key={editRow?.id ?? "create"}
            onSubmit={(e) => void submitDialog(e)}
            className="space-y-4"
          >
            <label className="block space-y-1">
              <span className={labelClass}>Title</span>
              <input
                name="title"
                required
                maxLength={140}
                defaultValue={editRow?.title ?? ""}
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
            <div className="grid gap-4 sm:grid-cols-3">
              <SearchableSelect
                name="status"
                label="Status"
                options={STATUSES.map((s) => ({ value: s, label: s.replace(/_/g, " ") }))}
                defaultValue={editRow?.status ?? "planned"}
              />
              <label className="block space-y-1">
                <span className={labelClass}>Target date</span>
                <input
                  name="target_date"
                  type="date"
                  defaultValue={toDateInput(editRow?.target_date)}
                  className={inputClass}
                />
              </label>
              <label className="block space-y-1">
                <span className={labelClass}>Sort order</span>
                <input
                  name="sort_order"
                  inputMode="numeric"
                  defaultValue={String(editRow?.sort_order ?? 0)}
                  className={inputClass}
                />
              </label>
            </div>
          </form>
        </Dialog>
      ) : null}
    </div>
  );
}
