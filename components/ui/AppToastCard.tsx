"use client";

import { Check, CircleAlert, Info, TriangleAlert, X } from "lucide-react";

import { useEffect, useRef, type ReactNode } from "react";
import { toast as sonnerToast } from "sonner";

export type AppToastTone = "success" | "error" | "info" | "warning" | "message";

type AppToastProps = {
  id: string | number;
  tone: AppToastTone;
  title: ReactNode;
  description?: ReactNode;
  duration: number;
};

function CloseIcon() {
  return <X className="h-3.5 w-3.5" strokeWidth={1.6} aria-hidden />;
}

function ToneIcon({ tone }: { tone: AppToastTone }) {
  if (tone === "success") {
    return <Check className="h-4 w-4" strokeWidth={1.75} aria-hidden />;
  }
  if (tone === "error") {
    return <CircleAlert className="h-4 w-4" strokeWidth={1.75} aria-hidden />;
  }
  if (tone === "warning") {
    return <TriangleAlert className="h-4 w-4" strokeWidth={1.5} aria-hidden />;
  }
  return <Info className="h-4 w-4" strokeWidth={1.6} aria-hidden />;
}

/**
 * Owns auto-dismiss + progress so they stay in sync.
 * Sonner is given duration: Infinity from lib/toast — its hover-paused timer was
 * desyncing from (or blocking) dismiss relative to the visual progress bar.
 */
export function AppToastCard({ id, tone, title, description, duration }: AppToastProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);
  const showProgress = Number.isFinite(duration) && duration > 0 && duration !== Infinity;

  useEffect(() => {
    if (!showProgress) return;

    const root = rootRef.current;
    const progress = progressRef.current;
    if (!root || !progress) return;

    const host = root.closest("[data-sonner-toast]") as HTMLElement | null;
    let remaining = duration;
    let startedAt: number | null = null;
    let timeoutId: ReturnType<typeof setTimeout> | undefined;
    let rafId = 0;

    const setScale = (frac: number) => {
      progress.style.transform = `scaleX(${Math.min(1, Math.max(0, frac))})`;
    };

    const isPaused = () =>
      document.hidden ||
      host?.getAttribute("data-expanded") === "true" ||
      host?.dataset.swiping === "true";

    const stop = () => {
      if (timeoutId !== undefined) {
        clearTimeout(timeoutId);
        timeoutId = undefined;
      }
      if (rafId) {
        cancelAnimationFrame(rafId);
        rafId = 0;
      }
      if (startedAt != null) {
        remaining = Math.max(0, remaining - (Date.now() - startedAt));
        startedAt = null;
      }
    };

    const dismiss = () => {
      stop();
      setScale(0);
      sonnerToast.dismiss(id);
    };

    const paint = () => {
      if (startedAt == null) return;
      const left = Math.max(0, remaining - (Date.now() - startedAt));
      setScale(duration > 0 ? left / duration : 0);
      if (left > 0) rafId = requestAnimationFrame(paint);
    };

    const start = () => {
      if (startedAt != null || remaining <= 0) {
        if (remaining <= 0) dismiss();
        return;
      }
      startedAt = Date.now();
      timeoutId = setTimeout(dismiss, remaining);
      rafId = requestAnimationFrame(paint);
    };

    const reconcile = () => {
      if (isPaused()) stop();
      else start();
    };

    setScale(1);
    reconcile();

    const mo = host
      ? new MutationObserver(reconcile)
      : null;
    mo?.observe(host!, { attributes: true, attributeFilter: ["data-expanded", "data-swiping"] });
    document.addEventListener("visibilitychange", reconcile);

    return () => {
      stop();
      mo?.disconnect();
      document.removeEventListener("visibilitychange", reconcile);
    };
  }, [id, duration, showProgress]);

  return (
    <div ref={rootRef} className={`app-toast app-toast--${tone}`} role="status">
      <span className="app-toast__icon" data-icon>
        <ToneIcon tone={tone} />
      </span>
      <div className="app-toast__body">
        <p className="app-toast__title">{title}</p>
        {description ? <p className="app-toast__description">{description}</p> : null}
      </div>
      <button
        type="button"
        className="app-toast__close"
        aria-label="Dismiss"
        onClick={() => sonnerToast.dismiss(id)}
      >
        <CloseIcon />
      </button>
      {showProgress ? <div ref={progressRef} className="app-toast__progress" aria-hidden /> : null}
    </div>
  );
}
