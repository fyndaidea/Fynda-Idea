import { requireAdmin } from "@/lib/auth/require-admin";
import { AdminNoAccess } from "@/components/admin/AdminNoAccess";
import AdminShell from "./admin-shell";
import "./admin-theme.css";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const { isAdmin } = await requireAdmin();

  if (!isAdmin) {
    return (
      <div data-admin>
        <AdminNoAccess />
      </div>
    );
  }

  return <AdminShell>{children}</AdminShell>;
}
