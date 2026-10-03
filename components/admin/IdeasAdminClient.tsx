"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/components/admin/DataTable";
import { toast } from "@/lib/toast";

type Idea = {
  id: string;
  title: string;
  slug: string;
  status: string;
  featured: boolean;
  score: number;
};

export default function IdeasAdminClient({ ideas }: { ideas: Idea[] }) {
  const router = useRouter();
  const [busyId, setBusyId] = useState<string | null>(null);

  const remove = async (id: string) => {
    if (!confirm("Delete this idea?")) return;
    setBusyId(id);
    try {
      const res = await fetch(`/api/admin/ideas/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("fail");
      toast.success("Deleted");
      router.refresh();
    } catch {
      toast.error("Delete failed");
    } finally {
      setBusyId(null);
    }
  };

  const columns = useMemo<ColumnDef<Idea, unknown>[]>(
    () => [
      {
        id: "title",
        accessorKey: "title",
        header: "Title",
        cell: ({ row }) => (
          <div>
            <Link
              href={`/admin/ideas/${row.original.id}`}
              className="font-medium hover:text-[color:var(--accent)]"
            >
              {row.original.title}
            </Link>
            <p className="text-[11px] text-[color:var(--muted-2)]">{row.original.slug}</p>
          </div>
        ),
      },
      {
        id: "status",
        accessorFn: (row) => `${row.status}${row.featured ? " featured" : ""}`,
        header: "Status",
        cell: ({ row }) => (
          <span>
            {row.original.status}
            {row.original.featured ? " · featured" : ""}
          </span>
        ),
      },
      {
        id: "score",
        accessorKey: "score",
        header: "Score",
        cell: ({ row }) => <span className="tabular-nums">{row.original.score}</span>,
      },
      {
        id: "actions",
        header: "",
        enableSorting: false,
        cell: ({ row }) => (
          <button
            type="button"
            disabled={busyId === row.original.id}
            onClick={() => void remove(row.original.id)}
            className="text-[color:var(--muted)] hover:text-red-500"
          >
            Delete
          </button>
        ),
      },
    ],
    [busyId]
  );

  return (
    <div className="admin-scrollbar flex min-h-0 flex-1 flex-col overflow-hidden py-2">
      <DataTable
        data={ideas}
        columns={columns}
        globalSearchPlaceholder="Search ideas…"
        pageSize={50}
        fillHeight
        viewStorageKey="admin-ideas"
        stickyColumns={{ left: "title", leftWidth: 220, right: "actions", rightWidth: 88 }}
        primaryAction={{
          label: "New idea",
          onClick: () => router.push("/admin/ideas/new"),
        }}
      />
    </div>
  );
}
