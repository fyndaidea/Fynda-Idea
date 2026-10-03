/** Maps pathname to header title, optional link back to the section root, and primary CTA label for list pages. */

export function isAdminNavActive(href: string, pathname: string): boolean {
  const p = pathname.replace(/\/$/, "") || "/";
  const h = href.replace(/\/$/, "") || "/";
  if (h === "/admin") return p === "/admin";
  return p === h || p.startsWith(`${h}/`);
}

export function getAdminHeaderMeta(pathname: string): {
  title: string;
  titleHref?: string;
  subtitle?: string;
  action?: { label: string };
} {
  const p = pathname.replace(/\/$/, "") || "/";

  if (p === "/admin") {
    return { title: "Dashboard", titleHref: "/admin" };
  }
  if (p === "/admin/ideas") {
    return { title: "Ideas", titleHref: "/admin/ideas", action: { label: "New idea" } };
  }
  if (p === "/admin/ideas/new") {
    return { title: "New idea", titleHref: "/admin/ideas" };
  }
  if (/^\/admin\/ideas\/[^/]+$/.test(p) && p !== "/admin/ideas/new") {
    return { title: "Edit idea", titleHref: "/admin/ideas" };
  }
  if (p === "/admin/categories") {
    return { title: "Categories", titleHref: "/admin/categories", action: { label: "New category" } };
  }
  if (p === "/admin/collections") {
    return { title: "Collections", titleHref: "/admin/collections", action: { label: "New collection" } };
  }
  if (p === "/admin/collections/new") {
    return { title: "New collection", titleHref: "/admin/collections" };
  }
  if (/^\/admin\/collections\/[^/]+$/.test(p) && p !== "/admin/collections/new") {
    return { title: "Edit collection", titleHref: "/admin/collections" };
  }
  if (p === "/admin/submissions") {
    return { title: "Submissions", titleHref: "/admin/submissions" };
  }
  if (p === "/admin/feedback") {
    return { title: "Feedback", titleHref: "/admin/feedback" };
  }
  if (p === "/admin/roadmap") {
    return { title: "Roadmap", titleHref: "/admin/roadmap", action: { label: "New item" } };
  }
  if (p === "/admin/releases") {
    return { title: "Releases", titleHref: "/admin/releases", action: { label: "New release" } };
  }
  if (p === "/admin/users") {
    return { title: "Users", titleHref: "/admin/users" };
  }
  if (p === "/admin/utilities") {
    return { title: "Utilities", titleHref: "/admin/utilities" };
  }
  if (p === "/admin/login") {
    return { title: "Admin login", titleHref: "/login" };
  }
  if (p === "/admin/register") {
    return { title: "Admin register", titleHref: "/register" };
  }

  return { title: "Admin", titleHref: "/admin" };
}
