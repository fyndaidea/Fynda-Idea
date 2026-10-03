"use client";

import type { ReactNode } from "react";
import { createPortal } from "react-dom";
import { AdminThemeScope, useAdminTheme } from "@/components/admin/admin-theme-context";
import { adminBtnPrimaryClass, adminBtnSecondaryClass } from "@/lib/admin/ui-classes";
import { btnPrimaryClass, btnSecondaryClass } from "@/lib/ui-classes";

const MAX_WIDTH = {
  sm: "max-w-sm",
  md: "max-w-md",
  lg: "max-w-lg",
  xl: "max-w-xl",
  "2xl": "max-w-2xl",
  "3xl": "max-w-3xl",
  "4xl": "max-w-4xl",
  "5xl": "max-w-5xl",
} as const;

export type DialogMaxWidth = keyof typeof MAX_WIDTH;

export function DialogOverlay({
  onClose,
  children,
  zIndex = 50,
  closeOnBackdrop = true,
  admin = false,
}: {
  onClose: () => void;
  children: ReactNode;
  zIndex?: number;
  closeOnBackdrop?: boolean;
  admin?: boolean;
}) {
  return (
    <div
      className={[
        "fixed inset-0 flex items-center justify-center p-4",
        admin ? "bg-black/70 backdrop-blur-[2px]" : "bg-black/40 backdrop-blur-sm",
      ].join(" ")}
      style={{ zIndex }}
      onClick={() => closeOnBackdrop && onClose()}
      role="presentation"
    >
      <div
        className="flex max-h-[min(90vh,100dvh)] w-full cursor-default items-center justify-center"
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
}

export function DialogPanel({
  title,
  onClose,
  children,
  footer,
  maxWidth = "md",
  closeDisabled = false,
  headerExtra,
  className = "",
  contentClassName = "",
  admin = false,
}: {
  title: ReactNode;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
  maxWidth?: DialogMaxWidth;
  closeDisabled?: boolean;
  headerExtra?: ReactNode;
  className?: string;
  contentClassName?: string;
  admin?: boolean;
}) {
  return (
    <div
      className={[
        `flex max-h-[min(90vh,100dvh)] w-full ${MAX_WIDTH[maxWidth]} flex-col overflow-hidden border border-[color:var(--card-border)] bg-[color:var(--card)]`,
        admin ? "rounded-lg shadow-2xl shadow-black/50" : "rounded-2xl shadow-[var(--card-shadow)]",
        className,
      ].join(" ")}
      role="dialog"
      aria-modal="true"
      aria-labelledby="dialog-title"
    >
      <div
        className={[
          "flex shrink-0 items-center justify-between gap-3 border-b border-[color:var(--card-border)]",
          admin ? "px-4 py-3" : "px-6 py-4",
        ].join(" ")}
      >
        <h2
          id="dialog-title"
          className={[
            "font-semibold text-[color:var(--foreground)]",
            admin ? "text-[15px]" : "text-lg",
          ].join(" ")}
        >
          {title}
        </h2>
        <div className="flex shrink-0 items-center gap-2">
          {headerExtra}
          <button
            type="button"
            onClick={onClose}
            disabled={closeDisabled}
            className="rounded-md p-1 text-[color:var(--muted)] transition hover:bg-[color:var(--card-muted)] hover:text-[color:var(--foreground)] disabled:opacity-50"
            aria-label="Close"
          >
            <span aria-hidden className="text-lg leading-none">
              ×
            </span>
          </button>
        </div>
      </div>
      <div
        className={[
          "min-h-0 flex-1 overflow-y-auto overscroll-contain",
          admin ? "px-4 py-3" : "px-6 py-4",
          contentClassName,
        ].join(" ")}
      >
        {children}
      </div>
      {footer ? (
        <div
          className={[
            "shrink-0 border-t border-[color:var(--card-border)] bg-[color:var(--card)]",
            admin ? "px-4 py-3" : "px-6 py-4",
          ].join(" ")}
        >
          {footer}
        </div>
      ) : null}
    </div>
  );
}

export default function Dialog({
  title,
  onClose,
  children,
  footer,
  maxWidth = "md",
  closeDisabled = false,
  closeOnBackdrop = true,
  zIndex = 50,
  headerExtra,
  className,
  contentClassName,
}: {
  title: ReactNode;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
  maxWidth?: DialogMaxWidth;
  closeDisabled?: boolean;
  closeOnBackdrop?: boolean;
  zIndex?: number;
  headerExtra?: ReactNode;
  className?: string;
  contentClassName?: string;
}) {
  const admin = Boolean(useAdminTheme());

  if (typeof document === "undefined") return null;

  const dialog = (
    <DialogOverlay
      onClose={onClose}
      zIndex={zIndex}
      closeOnBackdrop={closeOnBackdrop && !closeDisabled}
      admin={admin}
    >
      <DialogPanel
        title={title}
        onClose={onClose}
        footer={footer}
        maxWidth={maxWidth}
        closeDisabled={closeDisabled}
        headerExtra={headerExtra}
        className={className}
        contentClassName={contentClassName}
        admin={admin}
      >
        {children}
      </DialogPanel>
    </DialogOverlay>
  );

  return createPortal(admin ? <AdminThemeScope>{dialog}</AdminThemeScope> : dialog, document.body);
}

export function submitFormById(formId: string) {
  (document.getElementById(formId) as HTMLFormElement | null)?.requestSubmit();
}

export function DialogFooterActions({
  onCancel,
  onPrimary,
  cancelLabel = "Cancel",
  primaryLabel,
  primaryDisabled,
  cancelDisabled,
  primaryClassName,
}: {
  onCancel: () => void;
  onPrimary: () => void;
  cancelLabel?: string;
  primaryLabel: string;
  primaryDisabled?: boolean;
  cancelDisabled?: boolean;
  primaryClassName?: string;
}) {
  const admin = useAdminTheme();
  const secondaryClass = admin ? adminBtnSecondaryClass : btnSecondaryClass;
  const primaryClass = primaryClassName ?? (admin ? adminBtnPrimaryClass : btnPrimaryClass);

  return (
    <div className="flex items-center justify-end gap-2">
      <button
        type="button"
        onClick={onCancel}
        disabled={cancelDisabled}
        className={`${secondaryClass} whitespace-nowrap`}
      >
        {cancelLabel}
      </button>
      <button
        type="button"
        onClick={onPrimary}
        disabled={primaryDisabled}
        className={`${primaryClass} whitespace-nowrap`}
      >
        {primaryLabel}
      </button>
    </div>
  );
}
