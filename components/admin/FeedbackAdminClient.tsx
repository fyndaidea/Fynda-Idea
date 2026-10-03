"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { useCallback, useEffect, useMemo, useState } from "react";
import Dialog, { DialogFooterActions, submitFormById } from "@/components/ui/DialogShell";
import { DataTable } from "@/components/admin/DataTable";
import { AdminLoadingState } from "@/components/admin/AdminLoadingState";
import { SearchableSelect } from "@/components/ui/SearchableMultiSelect";
import { inputClass, labelClass, textareaClass } from "@/lib/ui-classes";

const STATUSES = [
  "open",
  "under_review",
  "planned",
  "in_progress",
  "shipped",
  "closed",
] as const;

type FeedbackPostAdmin = {
  id: string;
  user_id: string | null;
  title: string;
  description: string | null;
  category: string | null;
  status: string;
  created_at: string | Date;
  updated_at: string | Date;
  voteCount: number;
};

function fmtDate(v: string | Date) {
  const d = typeof v === "string" ? new Date(v) : v;
  return Number.isNaN(d.getTime()) ? "—" : d.toLocaleDateString();
}

export function FeedbackAdminClient() {
  const [loading, setLoading] = useState(true);
  const [posts, setPosts] = useState<FeedbackPostAdmin[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState("");
  const [editPost, setEditPost] = useState<FeedbackPostAdmin | null>(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/admin/feedback?limit=200&status=${encodeURIComponent(statusFilter)}`,
        { credentials: "include" }
      );
      const data = (await res.json().catch(() => ({}))) as {
        posts?: FeedbackPostAdmin[];
        error?: string;
      };
      if (!res.ok) {
        setError(data.error ?? "Failed to load feedback");
        setPosts([]);
        return;
      }
      setPosts(Array.isArray(data.posts) ? data.posts : []);
    } catch {
      setError("Failed to load feedback");
      setPosts([]);
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    void load();
  }, [load]);

  const remove = async (id: string) => {
    if (!window.confirm("Delete this feedback post? Votes will be removed too.")) return;
    setError(null);
    const res = await fetch(`/api/admin/feedback/${id}`, {
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

  const saveEdit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editPost) return;
    setSaving(true);
    setError(null);
    const fd = new FormData(e.currentTarget);
    try {
      const res = await fetch(`/api/admin/feedback/${editPost.id}`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: String(fd.get("title") ?? "").trim(),
          description: String(fd.get("description") ?? "") || null,
          category: String(fd.get("category") ?? "") || null,
          status: String(fd.get("status") ?? "").trim(),
        }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setError(data.error ?? "Save failed");
        return;
      }
      setEditPost(null);
      await load();
    } finally {
      setSaving(false);
    }
  };

  const columns = useMemo<ColumnDef<FeedbackPostAdmin>[]>(
    () => [
      {
        accessorKey: "title",
        header: "Title",
        cell: ({ row }) => (
          <div>
            <p className="font-semibold text-[color:var(--foreground)]">{row.original.title}</p>
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
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => (
          <span className="text-[color:var(--muted)]">{row.original.status.replace(/_/g, " ")}</span>
        ),
        filterFn: "includesString",
      },
      {
        accessorKey: "category",
        header: "Category",
        cell: ({ row }) => (
          <span className="text-[color:var(--muted)]">{row.original.category ?? "—"}</span>
        ),
        filterFn: "includesString",
      },
      {
        accessorKey: "voteCount",
        header: "Votes",
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
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={() => setEditPost(row.original)}
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
    [posts]
  );

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3">
      {error ? (
        <div className="shrink-0 rounded-xl border border-red-500/25 bg-red-500/10 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      <div className="flex shrink-0 flex-wrap items-center gap-3">
        <SearchableSelect
          label="Status"
          options={[
            { value: "", label: "All" },
            ...STATUSES.map((s) => ({ value: s, label: s.replace(/_/g, " ") })),
          ]}
          value={statusFilter}
          onChange={setStatusFilter}
        />
      </div>

      {loading ? (
        <AdminLoadingState label="Loading feedback…" />
      ) : (
        <DataTable
          data={posts}
          columns={columns}
          globalSearchPlaceholder="Search feedback…"
          pageSize={50}
          fillHeight
          viewStorageKey="admin-feedback"
        />
      )}

      {editPost ? (
        <Dialog
          title="Edit feedback"
          maxWidth="2xl"
          onClose={() => !saving && setEditPost(null)}
          closeDisabled={saving}
          footer={
            <DialogFooterActions
              onCancel={() => setEditPost(null)}
              onPrimary={() => submitFormById("feedback-edit-form")}
              primaryLabel={saving ? "Saving…" : "Save changes"}
              primaryDisabled={saving}
              cancelDisabled={saving}
            />
          }
        >
          <form
            id="feedback-edit-form"
            key={editPost.id}
            onSubmit={(e) => void saveEdit(e)}
            className="space-y-4"
          >
            <label className="block space-y-1">
              <span className={labelClass}>Title</span>
              <input name="title" required defaultValue={editPost.title} className={inputClass} />
            </label>
            <label className="block space-y-1">
              <span className={labelClass}>Description</span>
              <textarea
                name="description"
                rows={4}
                defaultValue={editPost.description ?? ""}
                className={textareaClass}
              />
            </label>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block space-y-1">
                <span className={labelClass}>Category</span>
                <input name="category" defaultValue={editPost.category ?? ""} className={inputClass} />
              </label>
              <SearchableSelect
                name="status"
                label="Status"
                options={STATUSES.map((s) => ({ value: s, label: s.replace(/_/g, " ") }))}
                defaultValue={editPost.status}
              />
            </div>
            <p className="text-xs text-[color:var(--muted)]">
              {editPost.voteCount} votes
              {editPost.user_id ? ` · user ${editPost.user_id.slice(0, 8)}…` : ""}
            </p>
          </form>
        </Dialog>
      ) : null}
    </div>
  );
}

export default FeedbackAdminClient;
