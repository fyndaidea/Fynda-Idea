import { Suspense } from "react";
import { DashboardQuickLinks } from "@/components/admin/DashboardQuickLinks";
import { DashboardStatsSkeleton } from "@/components/admin/DashboardStatsSkeleton";
import { DashboardStatsLoader } from "./dashboard-stats-loader";

export default function AdminHome() {
  return (
    <main className="admin-scrollbar min-h-0 flex-1 overflow-y-auto py-4 sm:py-5">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8">
        <Suspense fallback={<DashboardStatsSkeleton />}>
          <DashboardStatsLoader />
        </Suspense>
        <DashboardQuickLinks />
      </div>
    </main>
  );
}
