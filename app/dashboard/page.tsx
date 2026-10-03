import DashboardClient from "@/components/dashboard/DashboardClient";
import { requireUser } from "@/lib/auth/require-user";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export const metadata = {
  title: "Dashboard",
  description: "Your Fynda account — saved ideas and preferences.",
};

type Props = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function DashboardPage({ searchParams }: Props) {
  await searchParams;
  await requireUser("/dashboard");
  return <DashboardClient />;
}
