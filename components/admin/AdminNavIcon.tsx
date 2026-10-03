import type { AdminNavIconName } from "@/lib/admin/nav";
import {
  LayoutDashboard,
  Users,
  Lightbulb,
  LayoutGrid,
  Bookmark,
  Mail,
  MessageSquare,
  Map,
  Rocket,
} from "lucide-react";

const ICONS: Record<AdminNavIconName, typeof LayoutDashboard> = {
  dashboard: LayoutDashboard,
  users: Users,
  ideas: Lightbulb,
  categories: LayoutGrid,
  collections: Bookmark,
  submissions: Mail,
  feedback: MessageSquare,
  roadmap: Map,
  releases: Rocket,
};

export function AdminNavIcon({
  name,
  className = "h-4 w-4 shrink-0",
}: {
  name: AdminNavIconName;
  className?: string;
}) {
  const Icon = ICONS[name];
  if (!Icon) return null;
  return <Icon className={className} strokeWidth={1.6} aria-hidden />;
}
