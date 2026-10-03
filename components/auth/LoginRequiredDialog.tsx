"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { DialogPanel, DialogOverlay } from "@/components/ui/DialogShell";
import { btnPrimaryClass, btnSecondaryClass } from "@/lib/ui-classes";

type Props = {
  open: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
};

export default function LoginRequiredDialog({
  open,
  onClose,
  title = "Sign in to save favorites",
  description = "Create a free account or sign in to save items to your dashboard.",
}: Props) {
  const pathname = usePathname() || "/";
  const next =
    typeof window !== "undefined"
      ? `${pathname}${window.location.search}`
      : pathname;

  if (!open) return null;

  return (
    <DialogOverlay onClose={onClose} zIndex={60}>
      <DialogPanel title={title} onClose={onClose} maxWidth="sm">
        <p className="text-sm leading-relaxed text-[color:var(--muted)]">{description}</p>
        <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-end">
          <Link href={`/register?next=${encodeURIComponent(next)}`} className={btnSecondaryClass}>
            Create account
          </Link>
          <Link href={`/login?next=${encodeURIComponent(next)}`} className={btnPrimaryClass}>
            Sign in
          </Link>
        </div>
      </DialogPanel>
    </DialogOverlay>
  );
}
