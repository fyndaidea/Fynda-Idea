"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { ExternalLink, PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { useAdminSidebar } from "@/components/admin/admin-sidebar-context";
import { AdminThemeScope } from "@/components/admin/admin-theme-context";
import { AdminNavIcon } from "@/components/admin/AdminNavIcon";
import { isAdminNavActive } from "@/lib/admin/header-meta";
import { ADMIN_NAV_GROUPS } from "@/lib/admin/nav";
import { adminSectionLabelClass } from "@/lib/admin/ui-classes";

function SidebarTooltip({ label, children }: { label: string; children: ReactNode }) {
  const anchorRef = useRef<HTMLSpanElement>(null);
  const [visible, setVisible] = useState(false);
  const [position, setPosition] = useState<{ top: number; left: number } | null>(null);

  const show = useCallback(() => {
    const rect = anchorRef.current?.getBoundingClientRect();
    if (!rect) return;
    setPosition({ top: rect.top + rect.height / 2, left: rect.right + 10 });
    setVisible(true);
  }, []);

  const hide = useCallback(() => {
    setVisible(false);
    setPosition(null);
  }, []);

  return (
    <>
      <span
        ref={anchorRef}
        className="relative inline-flex"
        onMouseEnter={show}
        onMouseLeave={hide}
        onFocus={show}
        onBlur={hide}
      >
        {children}
      </span>
      {visible && position && typeof document !== "undefined"
        ? createPortal(
            <AdminThemeScope>
              <span
                role="tooltip"
                style={{ position: "fixed", top: position.top, left: position.left, transform: "translateY(-50%)" }}
                className={[
                  "pointer-events-none z-[200] whitespace-nowrap",
                  "rounded-md border border-[color:var(--card-border)] bg-[color:var(--foreground)] px-2 py-1",
                  "text-[11px] font-medium text-[color:var(--background)] shadow-lg shadow-black/40",
                ].join(" ")}
              >
                {label}
              </span>
            </AdminThemeScope>,
            document.body
          )
        : null}
    </>
  );
}

function SidebarToggleIcon({ collapsed, large }: { collapsed: boolean; large?: boolean }) {
  const className = large ? "h-[18px] w-[18px]" : "h-4 w-4";
  const Icon = collapsed ? PanelLeftOpen : PanelLeftClose;
  return <Icon className={className} strokeWidth={1.6} aria-hidden="true" />;
}

function NavItem({
  href,
  label,
  secondary,
  icon,
  isActive,
  collapsed,
}: {
  href: string;
  label: string;
  secondary?: string;
  icon: Parameters<typeof AdminNavIcon>[0]["name"];
  isActive: boolean;
  collapsed: boolean;
}) {
  const tooltip = secondary ? `${label} — ${secondary}` : label;
  const link = (
    <Link
      href={href}
      aria-current={isActive ? "page" : undefined}
      aria-label={collapsed ? tooltip : undefined}
      className={[
        "flex items-center rounded-md text-[13px] font-medium transition",
        collapsed ? "mx-auto h-9 w-9 justify-center" : "gap-2.5 px-2 py-1.5",
        isActive
          ? "bg-[color:var(--accent-muted)] text-[color:var(--foreground)]"
          : "text-[color:var(--muted)] hover:bg-[color:var(--card-muted)] hover:text-[color:var(--foreground)]",
      ].join(" ")}
    >
      <AdminNavIcon name={icon} className={collapsed ? "h-5 w-5 shrink-0" : "h-4 w-4 shrink-0"} />
      {!collapsed ? (
        secondary ? (
          <span className="min-w-0 flex-1 leading-tight">
            <span className="block truncate text-[13px] font-medium text-[color:var(--foreground)]">
              {label}
            </span>
            <span className="block truncate text-[10px] font-normal text-[color:var(--muted-2)]">
              {secondary}
            </span>
          </span>
        ) : (
          <span className="truncate">{label}</span>
        )
      ) : null}
    </Link>
  );

  return collapsed ? <SidebarTooltip label={tooltip}>{link}</SidebarTooltip> : link;
}

export default function AdminSidebar() {
  const pathname = usePathname() ?? "/admin";
  const { collapsed, toggleCollapsed } = useAdminSidebar();

  return (
    <aside
      className={[
        "hidden shrink-0 flex-col overflow-hidden border-r border-[color:var(--card-border)] bg-[color:var(--card)] lg:flex",
        "transition-[width] duration-200 ease-out",
        collapsed ? "w-[var(--admin-sidebar-collapsed-w)]" : "w-[var(--admin-sidebar-w)]",
      ].join(" ")}
    >
      <div
        className={[
          "flex shrink-0 border-b border-[color:var(--card-border)]",
          collapsed
            ? "flex-col items-center gap-1.5 px-2 py-2.5"
            : "h-[var(--admin-topbar-h)] items-center justify-between px-3",
        ].join(" ")}
      >
        {!collapsed ? (
          <Link href="/admin" className="min-w-0 truncate text-[13px] font-semibold tracking-tight text-[color:var(--foreground)]">
            Admin
          </Link>
        ) : (
          <SidebarTooltip label="Admin dashboard">
            <Link
              href="/admin"
              className="flex h-8 w-8 items-center justify-center rounded-md bg-[color:var(--accent-muted)] text-[12px] font-bold text-[color:var(--accent)]"
              aria-label="Admin dashboard"
            >
              A
            </Link>
          </SidebarTooltip>
        )}
        {collapsed ? (
          <SidebarTooltip label="Expand sidebar">
            <button
              type="button"
              onClick={toggleCollapsed}
              className="inline-flex h-8 w-8 items-center justify-center rounded-md text-[color:var(--muted)] transition hover:bg-[color:var(--card-muted)] hover:text-[color:var(--foreground)]"
              aria-label="Expand sidebar"
            >
              <SidebarToggleIcon collapsed={collapsed} large />
            </button>
          </SidebarTooltip>
        ) : (
          <button
            type="button"
            onClick={toggleCollapsed}
            className="inline-flex h-7 w-7 items-center justify-center rounded-md text-[color:var(--muted)] transition hover:bg-[color:var(--card-muted)] hover:text-[color:var(--foreground)]"
            aria-label="Collapse sidebar"
          >
            <SidebarToggleIcon collapsed={collapsed} />
          </button>
        )}
      </div>

      <nav
        className={[
          "min-h-0 flex-1 overflow-x-hidden overflow-y-auto py-3",
          collapsed ? "admin-scrollbar-hidden px-1.5" : "admin-scrollbar px-2",
        ].join(" ")}
        aria-label="Admin navigation"
      >
        {ADMIN_NAV_GROUPS.map((group, groupIndex) => (
          <div key={group.label} className={groupIndex > 0 ? (collapsed ? "mt-2" : "mt-4") : ""}>
            {!collapsed ? <p className={`${adminSectionLabelClass} mb-1.5`}>{group.label}</p> : null}
            <div className={collapsed ? "flex flex-col items-center gap-0.5" : "space-y-0.5"}>
              {group.items.map((item) => (
                <NavItem
                  key={item.href}
                  href={item.href}
                  label={item.label}
                  secondary={item.secondary}
                  icon={item.icon}
                  isActive={isAdminNavActive(item.href, pathname)}
                  collapsed={collapsed}
                />
              ))}
            </div>
          </div>
        ))}
      </nav>

      <div className="shrink-0 border-t border-[color:var(--card-border)] p-2">
        {collapsed ? (
          <SidebarTooltip label="View site">
            <Link
              href="/"
              target="_blank"
              aria-label="View site"
              className="mx-auto flex h-9 w-9 items-center justify-center rounded-md text-[color:var(--muted)] transition hover:bg-[color:var(--card-muted)] hover:text-[color:var(--foreground)]"
            >
              <ExternalLink className="h-5 w-5 shrink-0" strokeWidth={1.6} aria-hidden />
            </Link>
          </SidebarTooltip>
        ) : (
          <Link
            href="/"
            target="_blank"
            className="flex items-center gap-2 rounded-md px-2 py-1.5 text-[13px] text-[color:var(--muted)] transition hover:bg-[color:var(--card-muted)] hover:text-[color:var(--foreground)]"
          >
            <ExternalLink className="h-4 w-4 shrink-0" strokeWidth={1.6} aria-hidden />
            <span>View site</span>
          </Link>
        )}
      </div>
    </aside>
  );
}
