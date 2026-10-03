"use client";

import type { ReactNode } from "react";
import { toast as sonnerToast, type ExternalToast } from "sonner";
import { AppToastCard, type AppToastTone } from "@/components/ui/AppToastCard";
import { TOAST_DURATION_MS } from "@/lib/toast-duration";

export { TOAST_DURATION_MS };

function resolveDuration(options?: ExternalToast): number {
  if (options?.duration === Infinity) return Infinity;
  if (typeof options?.duration === "number") return options.duration;
  return TOAST_DURATION_MS;
}

function show(tone: AppToastTone, message: ReactNode, options?: ExternalToast) {
  const duration = resolveDuration(options);
  const { description, duration: _ignored, ...rest } = options ?? {};

  return sonnerToast.custom(
    (id) => (
      <AppToastCard
        id={id}
        tone={tone}
        title={message}
        description={typeof description === "function" ? description() : description}
        duration={duration}
      />
    ),
    {
      ...rest,
      // AppToastCard owns dismiss + progress so they stay in sync with hover pause.
      duration: Infinity,
      unstyled: true,
      className: "app-toast-host",
    }
  );
}

export const toast = Object.assign(
  (message: ReactNode, options?: ExternalToast) => show("message", message, options),
  {
    success: (message: ReactNode, options?: ExternalToast) => show("success", message, options),
    error: (message: ReactNode, options?: ExternalToast) => show("error", message, options),
    info: (message: ReactNode, options?: ExternalToast) => show("info", message, options),
    warning: (message: ReactNode, options?: ExternalToast) => show("warning", message, options),
    message: (message: ReactNode, options?: ExternalToast) => show("message", message, options),
    loading: sonnerToast.loading,
    promise: sonnerToast.promise,
    custom: sonnerToast.custom,
    dismiss: sonnerToast.dismiss,
    getHistory: sonnerToast.getHistory,
    getToasts: sonnerToast.getToasts,
  }
);
