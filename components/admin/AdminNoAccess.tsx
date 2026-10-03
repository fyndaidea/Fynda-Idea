import Link from "next/link";
import { AdminSignOutButton } from "@/components/admin/AdminSignOutButton";

export function AdminNoAccess() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-[color:var(--background)] px-6 py-16 text-[color:var(--foreground)]">
      <div className="w-full max-w-md text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-md border border-[color:var(--card-border)] bg-[color:var(--card-muted)] text-sm font-bold text-[color:var(--accent)]">
          A
        </div>
        <h1 className="mt-6 text-lg font-semibold tracking-tight">Permission denied</h1>
        <p className="mt-2 text-[13px] leading-6 text-[color:var(--muted)]">
          Your account is signed in, but it doesn&apos;t have admin access for this site.
        </p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
          <Link
            href="/"
            className="inline-flex h-8 items-center justify-center rounded-md bg-[color:var(--accent)] px-3 text-[13px] font-medium text-white hover:bg-[color:var(--accent-hover)]"
          >
            Go back home
          </Link>
          <AdminSignOutButton />
        </div>
      </div>
    </div>
  );
}
