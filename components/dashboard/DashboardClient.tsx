"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import ApiKeysContent from "@/components/dashboard/ApiKeysContent";
import PreferencesContent from "@/components/dashboard/PreferencesContent";
import {
  DashboardMasthead,
  DashboardPageShimmer,
  resolveDashboardSection,
  type DashboardSection,
} from "@/components/dashboard/DashboardNav";
import {
  DashboardOverview,
  DashboardSavedSection,
  firstName,
  greetingTitle,
} from "@/components/dashboard/UserDashboard";
import { isAdminRole } from "@/lib/auth/roles";
import { useAuth } from "@/lib/auth-context";

function sectionCopy(active: DashboardSection): string | undefined {
  switch (active) {
    case "overview":
      return "Here’s what’s live on your account.";
    case "saved":
      return "Ideas you’ve starred across the site.";
    case "preferences":
      return "Update your display name and profile.";
    case "api":
      return "Keys for MCP connectors and programmatic access.";
  }
}

function mastheadTitle(active: DashboardSection, name: string): string {
  if (active === "overview") return greetingTitle(name);
  if (active === "saved") return "Saved";
  if (active === "api") return "API & MCP";
  return "Preferences";
}

function DashboardBody() {
  const searchParams = useSearchParams();
  const { user, loading: authLoading } = useAuth();

  const group = searchParams.get("group");
  const tab = searchParams.get("tab");
  const sectionParam = searchParams.get("section");
  const active = resolveDashboardSection(group, tab, sectionParam);

  if (authLoading) {
    return <DashboardPageShimmer />;
  }

  const name = firstName(user?.name, user?.email);
  const planLabel = isAdminRole(user?.role) ? "Admin" : "Member";

  return (
    <div className="min-h-[70vh] bg-[color:var(--background)]">
      <DashboardMasthead
        active={active}
        title={mastheadTitle(active, name)}
        planLabel={planLabel}
        meta={sectionCopy(active)}
      />

      <div className="mx-auto max-w-6xl px-5 py-8 sm:px-8 sm:py-10 lg:px-10">
        {active === "api" ? (
          <ApiKeysContent />
        ) : active === "preferences" ? (
          <PreferencesContent />
        ) : active === "saved" ? (
          <DashboardSavedSection />
        ) : (
          <DashboardOverview />
        )}
      </div>
    </div>
  );
}

export default function DashboardClient() {
  return (
    <Suspense fallback={<DashboardPageShimmer />}>
      <DashboardBody />
    </Suspense>
  );
}
