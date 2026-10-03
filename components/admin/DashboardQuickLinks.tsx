import Link from "next/link";

const links = [
  { href: "/admin/ideas", label: "Ideas", description: "Catalog entries" },
  { href: "/admin/submissions", label: "Submissions", description: "Review queue" },
  { href: "/admin/categories", label: "Categories", description: "Browse taxonomy" },
  { href: "/admin/collections", label: "Collections", description: "Curated lists" },
  { href: "/admin/feedback", label: "Feedback", description: "Requests & votes" },
  { href: "/admin/roadmap", label: "Roadmap", description: "Planned work" },
  { href: "/admin/releases", label: "Releases", description: "Changelog & publish" },
  { href: "/admin/users", label: "Users", description: "Accounts & roles" },
  { href: "/admin/docs", label: "Documentation", description: "Operator guides" },
] as const;

export function DashboardQuickLinks() {
  return (
    <section aria-labelledby="dashboard-shortcuts-heading">
      <h2
        id="dashboard-shortcuts-heading"
        className="text-[11px] font-medium uppercase tracking-[0.08em] text-[color:var(--muted-2)]"
      >
        Shortcuts
      </h2>
      <ul className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {links.map((item) => (
          <li key={item.href}>
            <Link
              href={item.href}
              className="flex flex-col rounded-md border border-[color:var(--card-border)] bg-[color:var(--card-muted)]/30 px-3 py-2.5 transition hover:border-[color:var(--accent-border)] hover:bg-[color:var(--card-muted)]"
            >
              <span className="text-[13px] font-medium text-[color:var(--foreground)]">{item.label}</span>
              <span className="mt-0.5 text-[12px] text-[color:var(--muted)]">{item.description}</span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
