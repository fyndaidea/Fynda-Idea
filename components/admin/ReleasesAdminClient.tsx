"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { useCallback, useEffect, useMemo, useState } from "react";
import Dialog, { DialogFooterActions, submitFormById } from "@/components/ui/DialogShell";
import { DataTable } from "@/components/admin/DataTable";
import { AdminLoadingState } from "@/components/admin/AdminLoadingState";
import { inputClass, labelClass, textareaClass } from "@/lib/ui-classes";

type Note = {
  id: string;
  title: string;
  body_md: string;
  published_at: string | Date | null;
  created_at: string | Date;
  updated_at: string | Date;
};

type DialogMode = { type: "create" } | { type: "edit"; note: Note };

function fmtDate(v: string | Date | null | undefined) {
  if (!v) return "—";
  const d = typeof v === "string" ? new Date(v) : v;
  if (!(d instanceof Date) || Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
}

export function ReleasesAdminClient() {
  const [loading, setLoading] = useState(true);
  const [notes, setNotes] = useState<Note[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [dialog, setDialog] = useState<DialogMode | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/release-notes?limit=200", { credentials: "include" });
      const data = (await res.json().catch(() => ({}))) as { notes?: Note[]; error?: string };
      if (!res.ok) {
        setError(data.error ?? "Failed to load release notes");
        setNotes([]);
        return;
      }
      setNotes(Array.isArray(data.notes) ? data.notes : []);
    } catch {
      setError("Failed to load release notes");
      setNotes([]);
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

  const setPublished = async (id: string, publish: boolean) => {
    setError(null);
    const res = await fetch(`/api/admin/release-notes/${id}/publish`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ publish }),
    });
    const data = (await res.json().catch(() => ({}))) as { error?: string };
    if (!res.ok) {
      setError(data.error ?? "Update failed");
      return;
    }
    await load();
  };

  const remove = async (id: string) => {
    if (!window.confirm("Delete this release note?")) return;
    setError(null);
    const res = await fetch(`/api/admin/release-notes/${id}`, {
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
    const payload = {
      title: String(fd.get("title") ?? "").trim(),
      body_md: String(fd.get("body_md") ?? "").trim(),
    };

    try {
      const isCreate = dialog?.type === "create";
      const res = await fetch(
        isCreate ? "/api/admin/release-notes" : `/api/admin/release-notes/${dialog!.note.id}`,
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

  const columns = useMemo<ColumnDef<Note>[]>(
    () => [
      {
        accessorKey: "title",
        header: "Title",
        cell: ({ row }) => (
          <p className="font-semibold text-[color:var(--foreground)]">{row.original.title}</p>
        ),
        filterFn: "includesString",
      },
      {
        id: "status",
        header: "Status",
        cell: ({ row }) => (
          <span className="text-[color:var(--muted)]">
            {row.original.published_at ? "Published" : "Draft"}
          </span>
        ),
        enableColumnFilter: false,
      },
      {
        accessorKey: "published_at",
        header: "Published at",
        cell: ({ row }) => (
          <span className="text-[color:var(--muted)]">{fmtDate(row.original.published_at)}</span>
        ),
        enableColumnFilter: false,
      },
      {
        accessorKey: "updated_at",
        header: "Updated",
        cell: ({ row }) => (
          <span className="text-[color:var(--muted)]">{fmtDate(row.original.updated_at)}</span>
        ),
        enableColumnFilter: false,
      },
      {
        id: "actions",
        header: "",
        cell: ({ row }) => (
          <div className="flex flex-wrap justify-end gap-2">
            <button
              type="button"
              onClick={() => setDialog({ type: "edit", note: row.original })}
              className="text-sm font-semibold text-[color:var(--accent)]"
            >
              Edit
            </button>
            {row.original.published_at ? (
              <button
                type="button"
                onClick={() => void setPublished(row.original.id, false)}
                className="text-sm font-semibold text-amber-700"
              >
                Unpublish
              </button>
            ) : (
              <button
                type="button"
                onClick={() => void setPublished(row.original.id, true)}
                className="text-sm font-semibold text-emerald-700"
              >
                Publish
              </button>
            )}
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
    [notes]
  );

  const editNote = dialog?.type === "edit" ? dialog.note : null;

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3">
      {error ? (
        <div className="shrink-0 rounded-xl border border-red-500/25 bg-red-500/10 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      {loading ? (
        <AdminLoadingState label="Loading release notes…" />
      ) : (
        <DataTable
          data={notes}
          columns={columns}
          globalSearchPlaceholder="Search release notes…"
          pageSize={50}
          fillHeight
          viewStorageKey="admin-releases"
          primaryAction={{ label: "New note", onClick: openCreate }}
        />
      )}

      {dialog ? (
        <Dialog
          title={dialog.type === "create" ? "New release note" : "Edit release note"}
          maxWidth="2xl"
          onClose={() => !submitting && setDialog(null)}
          closeDisabled={submitting}
          footer={
            <DialogFooterActions
              onCancel={() => setDialog(null)}
              onPrimary={() => submitFormById("releases-form")}
              primaryLabel={
                submitting ? "Saving…" : dialog.type === "create" ? "Create draft" : "Save changes"
              }
              primaryDisabled={submitting}
              cancelDisabled={submitting}
            />
          }
        >
          {dialog.type === "create" ? (
            <p className="mb-4 text-sm text-[color:var(--muted)]">
              Markdown body. Publish from the table after saving.
            </p>
          ) : null}
          <form
            id="releases-form"
            key={editNote?.id ?? "create"}
            onSubmit={(e) => void submitDialog(e)}
            className="space-y-4"
          >
            <label className="block space-y-1">
              <span className={labelClass}>Title</span>
              <input
                name="title"
                required
                maxLength={140}
                defaultValue={editNote?.title ?? ""}
                className={inputClass}
              />
            </label>
            <label className="block space-y-1">
              <span className={labelClass}>Body (markdown)</span>
              <textarea
                name="body_md"
                required
                rows={10}
                defaultValue={editNote?.body_md ?? ""}
                className={`${textareaClass} font-mono`}
              />
            </label>
          </form>
        </Dialog>
      ) : null}
    </div>
  );
}
