"use client";

import type { CSSProperties } from "react";
import { Toaster } from "sonner";
import { TOAST_DURATION_MS } from "@/lib/toast-duration";

export function AppToaster() {
  return (
    <Toaster
      position="bottom-right"
      expand={false}
      duration={TOAST_DURATION_MS}
      offset={20}
      gap={10}
      visibleToasts={4}
      toastOptions={{
        duration: TOAST_DURATION_MS,
        unstyled: true,
        className: "app-toast-host",
      }}
      style={
        {
          "--width": "22rem",
        } as CSSProperties
      }
    />
  );
}
