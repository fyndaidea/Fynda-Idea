export type AdminNavIconName =
  | "dashboard"
  | "users"
  | "ideas"
  | "categories"
  | "collections"
  | "submissions"
  | "feedback"
  | "roadmap"
  | "releases";

export type AdminNavItem = {
  href: string;
  label: string;
  secondary?: string;
  icon: AdminNavIconName;
};

export type AdminNavGroup = {
  label: string;
  items: AdminNavItem[];
};

export const ADMIN_NAV_GROUPS: AdminNavGroup[] = [
  {
    label: "Overview",
    items: [{ href: "/admin", label: "Dashboard", icon: "dashboard" }],
  },
  {
    label: "Catalog",
    items: [
      { href: "/admin/ideas", label: "Ideas", icon: "ideas" },
      { href: "/admin/categories", label: "Categories", icon: "categories" },
      { href: "/admin/collections", label: "Collections", icon: "collections" },
    ],
  },
  {
    label: "Community",
    items: [
      { href: "/admin/submissions", label: "Submissions", icon: "submissions" },
      { href: "/admin/feedback", label: "Feedback", icon: "feedback" },
    ],
  },
  {
    label: "Product",
    items: [
      { href: "/admin/roadmap", label: "Roadmap", icon: "roadmap" },
      { href: "/admin/releases", label: "Releases", icon: "releases" },
    ],
  },
  {
    label: "System",
    items: [{ href: "/admin/users", label: "Users", icon: "users" }],
  },
];

export const ADMIN_NAV_FLAT: AdminNavItem[] = ADMIN_NAV_GROUPS.flatMap((group) => group.items);
