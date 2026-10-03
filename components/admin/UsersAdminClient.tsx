"use client";

import { useEffect, useMemo, useState } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/components/admin/DataTable";
import { AdminLoadingState } from "@/components/admin/AdminLoadingState";
import { toast } from "@/lib/toast";

type User = {
  id: string;
  email: string;
  fullName: string | null;
  role: string;
  createdAt: string | null;
  lastSignInAt: string | null;
};

export default function UsersAdminClient() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/users", { credentials: "include" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Failed");
      setUsers(Array.isArray(data.users) ? data.users : []);
    } catch {
      toast.error("Could not load users");
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const setRole = async (id: string, role: "user" | "admin") => {
    setBusyId(id);
    try {
      const res = await fetch(`/api/admin/users/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role }),
      });
      if (!res.ok) toast.error("Update failed");
      else {
        toast.success("Role updated");
        setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, role } : u)));
      }
    } finally {
      setBusyId(null);
    }
  };

  const columns = useMemo<ColumnDef<User, unknown>[]>(
    () => [
      {
        id: "name",
        accessorFn: (row) => row.fullName || row.email || row.id,
        header: "User",
        cell: ({ row }) => (
          <div>
            <p className="font-medium">{row.original.fullName || "Unnamed"}</p>
            <p className="text-[12px] text-[color:var(--muted)]">
              {row.original.email || "No email"}
            </p>
          </div>
        ),
      },
      {
        id: "role",
        accessorKey: "role",
        header: "Role",
      },
      {
        id: "lastSignIn",
        accessorFn: (row) => row.lastSignInAt || "",
        header: "Last sign-in",
        cell: ({ row }) => {
          const v = row.original.lastSignInAt;
          if (!v) return <span className="text-[color:var(--muted-2)]">—</span>;
          return (
            <span className="text-[12px] text-[color:var(--muted)]">
              {new Date(v).toLocaleDateString()}
            </span>
          );
        },
      },
      {
        id: "actions",
        header: "",
        enableSorting: false,
        cell: ({ row }) => (
          <button
            type="button"
            disabled={busyId === row.original.id}
            onClick={() =>
              void setRole(row.original.id, row.original.role === "admin" ? "user" : "admin")
            }
            className="text-[color:var(--muted)] hover:text-[color:var(--foreground)]"
          >
            Make {row.original.role === "admin" ? "user" : "admin"}
          </button>
        ),
      },
    ],
    [busyId]
  );

  if (loading) return <AdminLoadingState label="Loading users…" />;

  return (
    <div className="admin-scrollbar flex min-h-0 flex-1 flex-col overflow-hidden py-2">
      <DataTable
        columns={columns}
        data={users}
        globalSearchPlaceholder="Search users…"
        fillHeight
        viewStorageKey="admin-users"
        stickyColumns={{ left: "name", leftWidth: 240, right: "actions", rightWidth: 120 }}
      />
    </div>
  );
}
