"use client";

import { Suspense } from "react";
import { usePathname } from "next/navigation";
import { AdminActionProvider } from "@/components/admin/admin-action-context";
import { AdminSidebarProvider } from "@/components/admin/admin-sidebar-context";
import {
  AdminThemeProvider,
  useAdminTheme,
} from "@/components/admin/admin-theme-context";
import { AdminMainFallback } from "@/components/admin/AdminMainFallback";
import AdminSidebar from "@/components/admin/AdminSidebar";
import { AdminTopBar } from "@/components/admin/AdminTopBar";

function isIdeaEditorPath(pathname: string) {
  return /^\/admin\/ideas\/(new|[^/]+)$/.test(pathname.replace(/\/$/, ""));
}

function AdminShellFrame({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() ?? "";
  const fullBleed = isIdeaEditorPath(pathname);
  const adminTheme = useAdminTheme();
  const appearance = adminTheme?.theme ?? "dark";

  return (
    <div
      data-admin
      data-admin-theme={appearance}
      className="h-[100dvh] overflow-hidden bg-[color:var(--background)] text-[color:var(--foreground)] antialiased"
    >
      <div className="flex h-[100dvh]">
        <AdminSidebar />

        <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
          <AdminTopBar />

          <div
            className={[
              "flex min-h-0 flex-1 flex-col overflow-hidden",
              fullBleed ? "" : "px-3 py-2 sm:px-4",
            ].join(" ")}
          >
            <Suspense fallback={<AdminMainFallback />}>{children}</Suspense>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AdminShell({ children }: { children: React.ReactNode }) {
  return (
    <AdminActionProvider>
      <AdminSidebarProvider>
        <AdminThemeProvider>
          <AdminShellFrame>{children}</AdminShellFrame>
        </AdminThemeProvider>
      </AdminSidebarProvider>
    </AdminActionProvider>
  );
}
