"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/components/admin/DataTable";
import { toast } from "@/lib/toast";

type Sub = {
  id: string;
  title: string;
  summary: string;
  category: string;
  status: string;
  submitter_email: string | null;
  created_at: string;
};

export default function SubmissionsAdminClient({ submissions }: { submissions: Sub[] }) {
  const router = useRouter();
  const [busyId, setBusyId] = useState<string | null>(null);

  const approveCreate = async (id: string) => {
    setBusyId(id);
    try {
      const res = await fetch(`/api/admin/submissions/${id}/approve-create-idea`, {
        method: "POST",
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(typeof data.error === "string" ? data.error : "Approve failed");
        return;
      }
      toast.success(data.idea?.slug ? `Published as /ideas/${data.idea.slug}` : "Approved");
      router.refresh();
    } finally {
      setBusyId(null);
    }
  };

  const reject = async (id: string) => {
    setBusyId(id);
    try {
      const res = await fetch(`/api/admin/submissions/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "rejected" }),
      });
      if (!res.ok) toast.error("Reject failed");
      else {
        toast.success("Rejected");
        router.refresh();
      }
    } finally {
      setBusyId(null);
    }
  };

  const columns = useMemo<ColumnDef<Sub, unknown>[]>(
    () => [
      {
        id: "title",
        accessorKey: "title",
        header: "Submission",
        cell: ({ row }) => (
          <div className="max-w-md">
            <p className="font-medium">{row.original.title}</p>
            <p className="mt-0.5 line-clamp-2 text-[12px] text-[color:var(--muted)]">
              {row.original.summary}
            </p>
          </div>
        ),
      },
      {
        id: "status",
        accessorKey: "status",
        header: "Status",
      },
      {
        id: "category",
        accessorKey: "category",
        header: "Category",
        cell: ({ row }) => row.original.category || "—",
      },
      {
        id: "submitter",
        accessorFn: (row) => row.submitter_email || "anon",
        header: "Submitter",
        cell: ({ row }) => (
          <span className="text-[12px] text-[color:var(--muted)]">
            {row.original.submitter_email || "anon"}
          </span>
        ),
      },
      {
        id: "actions",
        header: "",
        enableSorting: false,
        cell: ({ row }) => {
          const pending = row.original.status === "pending";
          return (
            <div className="flex gap-2">
              {pending ? (
                <>
                  <button
                    type="button"
                    disabled={busyId === row.original.id}
                    onClick={() => void approveCreate(row.original.id)}
                    className="text-[color:var(--accent)]"
                  >
                    Approve
                  </button>
                  <button
                    type="button"
                    disabled={busyId === row.original.id}
                    onClick={() => void reject(row.original.id)}
                    className="text-[color:var(--muted)]"
                  >
                    Reject
                  </button>
                </>
              ) : (
                <span className="text-[12px] text-[color:var(--muted-2)]">—</span>
              )}
            </div>
          );
        },
      },
    ],
    [busyId]
  );

  return (
    <div className="admin-scrollbar flex min-h-0 flex-1 flex-col overflow-hidden py-2">
      <DataTable
        data={submissions}
        columns={columns}
        globalSearchPlaceholder="Search submissions…"
        pageSize={50}
        fillHeight
        viewStorageKey="admin-submissions"
        stickyColumns={{ left: "title", leftWidth: 260, right: "actions", rightWidth: 140 }}
      />
    </div>
  );
}
