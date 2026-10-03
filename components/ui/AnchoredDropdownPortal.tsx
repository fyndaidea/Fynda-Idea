"use client";

import {
  useEffect,
  useLayoutEffect,
  useState,
  type CSSProperties,
  type ReactNode,
  type RefObject,
} from "react";
import { createPortal } from "react-dom";
import { AdminThemeScope, useAdminTheme } from "@/components/admin/admin-theme-context";

export function useAnchoredDropdownPosition(
  anchorRef: RefObject<HTMLElement | null>,
  open: boolean,
  minWidth?: number
) {
  const [style, setStyle] = useState<CSSProperties>({ visibility: "hidden" });

  useLayoutEffect(() => {
    if (!open) return;

    function update() {
      const anchor = anchorRef.current;
      if (!anchor) return;
      const rect = anchor.getBoundingClientRect();
      const margin = 8;
      const availableBelow = window.innerHeight - rect.bottom - margin;
      const availableAbove = rect.top - margin;
      const openAbove = availableBelow < 160 && availableAbove > availableBelow;
      const maxHeight = Math.max(
        80,
        Math.min(320, openAbove ? availableAbove : availableBelow)
      );
      const width = Math.max(rect.width, minWidth ?? 0);

      setStyle(
        openAbove
          ? {
              position: "fixed",
              bottom: window.innerHeight - rect.top + 4,
              left: Math.min(rect.left, window.innerWidth - width - margin),
              width,
              maxHeight,
              zIndex: 2010,
            }
          : {
              position: "fixed",
              top: rect.bottom + 4,
              left: Math.min(rect.left, window.innerWidth - width - margin),
              width,
              maxHeight,
              zIndex: 2010,
            }
      );
    }

    update();
    window.addEventListener("resize", update);
    window.addEventListener("scroll", update, true);
    return () => {
      window.removeEventListener("resize", update);
      window.removeEventListener("scroll", update, true);
    };
  }, [anchorRef, minWidth, open]);

  return style;
}

export function AnchoredDropdownPortal({
  open,
  onClose,
  anchorRef,
  children,
  className = "",
  minWidth,
}: {
  open: boolean;
  onClose: () => void;
  anchorRef: RefObject<HTMLElement | null>;
  children: ReactNode;
  className?: string;
  minWidth?: number;
}) {
  const admin = useAdminTheme();
  const style = useAnchoredDropdownPosition(anchorRef, open, minWidth);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  if (!open || typeof document === "undefined") return null;

  const panel = (
    <div
      style={style}
      onPointerDown={(event) => event.stopPropagation()}
      className={[
        "overflow-hidden border border-[color:var(--card-border)] bg-[color:var(--card)] text-[color:var(--foreground)]",
        admin ? "rounded-md shadow-xl shadow-black/40" : "rounded-xl shadow-[var(--card-shadow)]",
        className,
      ].join(" ")}
    >
      {children}
    </div>
  );

  return createPortal(
    <>
      <div
        className="fixed inset-0 z-[2000]"
        aria-hidden
        onPointerDown={(event) => {
          event.preventDefault();
          event.stopPropagation();
          onClose();
        }}
      />
      {admin ? <AdminThemeScope>{panel}</AdminThemeScope> : panel}
    </>,
    document.body
  );
}
