import { requireUser } from "@/lib/auth/require-user";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  await requireUser("/dashboard");
  return <>{children}</>;
}
