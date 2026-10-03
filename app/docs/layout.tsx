import type { Metadata } from "next";
import { Suspense } from "react";
import { DocsShell } from "@/components/docs/docs-shell";
import { PageShimmer } from "@/components/loading/PageShimmer";
import { showAdminDocs } from "@/lib/docs/config";
import { loadManifest } from "@/lib/docs/manifest";

export const metadata: Metadata = {
  title: "Documentation",
  description: "Guides for Fynda Idea — browsing ideas, submissions, and accounts.",
};

export default function DocsLayout({ children }: { children: React.ReactNode }) {
  const manifest = loadManifest();
  const showAdmin = showAdminDocs();

  return (
    <Suspense fallback={<PageShimmer variant="feed" label="Loading documentation" />}>
      <DocsShell manifest={manifest} showAdmin={showAdmin}>
        {children}
      </DocsShell>
    </Suspense>
  );
}
