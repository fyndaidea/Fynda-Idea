"use client";

import { useEffect, type RefObject } from "react";

/** Close popovers/menus when the user clicks or taps outside the container. */
export function useClickOutside(
  ref: RefObject<Element | null>,
  onClose: () => void,
  enabled = true
) {
  useEffect(() => {
    if (!enabled) return;

    function shouldIgnore(target: Node | null) {
      const root = ref.current;
      return !root || !target || root.contains(target);
    }

    function onPointerDown(event: PointerEvent) {
      if (shouldIgnore(event.target as Node | null)) return;
      onClose();
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }

    document.addEventListener("pointerdown", onPointerDown, true);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown, true);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [enabled, onClose, ref]);
}
