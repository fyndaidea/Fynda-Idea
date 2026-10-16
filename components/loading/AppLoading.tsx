"use client";

import { usePathname } from "next/navigation";
import { PageShimmer } from "@/components/loading/PageShimmer";
import SiteChromeClient from "@/components/SiteChromeClient";
import { DashboardPageShimmer } from "@/components/dashboard/DashboardNav";

/** Covers layout-level navigation queries, before route loading.tsx can render. */
export function AppLoading() {
  const path = usePathname() ?? "/";
  const variant = path === "/" ? "home"
    : /^\/(login|register|forgot-password|reset-password)(\/|$)/.test(path) ? "form"
    : path.startsWith("/admin") ? "admin"
    : path.startsWith("/docs") ? "feed"
    : path === "/store" ? "store"
    : path === "/store/purchases" ? "list"
    : /^\/(ideas|store)\/[^/]+$/.test(path) ? "detail"
    : path === "/ideas" ? "ideas" : "grid";

  return (
    <SiteChromeClient navVisibility={{ showIdeas: true, showCategories: true, showCollections: true }}>
      {path === "/dashboard" ? <DashboardPageShimmer /> : <PageShimmer variant={variant} label="Loading page" />}
    </SiteChromeClient>
  );
}
