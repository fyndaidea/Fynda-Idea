import { redirect } from "next/navigation";

const SLUG_MAP: Record<string, string> = {
  overview: "/docs/admin",
  environment: "/docs/admin/environment",
  database: "/docs/admin/database",
  authentication: "/docs/admin/authentication",
  "vault-secrets": "/docs/admin/vault-secrets",
  "proxy-session": "/docs/admin/proxy-session",
  "admin-ui": "/docs/admin/admin-ui",
  "api-routes": "/docs/admin/api-routes",
  "docs-site": "/docs/admin/docs-site",
  mcp: "/docs/admin/mcp",
};

export default async function AdminDocRedirectPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  redirect(SLUG_MAP[slug] ?? "/docs");
}
