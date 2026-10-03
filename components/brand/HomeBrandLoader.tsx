"use client";

import { useEffect, useLayoutEffect, useState } from "react";
import { createPortal } from "react-dom";
import SiteLogo from "@/components/brand/SiteLogo";
import { PRODUCT_NAME } from "@/lib/brand/product";

const BOUNCE_MS = 2000;
const MORPH_MS = 700;
const HOLD_MS = 700;
const EXIT_MS = 350;
const SEEN_KEY = "fynda-home-loader-seen";

type Phase = "bounce" | "morph" | "hold" | "exit" | "done";

type Props = {
  children: React.ReactNode;
};

function readSeen(): boolean {
  try {
    return window.sessionStorage.getItem(SEEN_KEY) === "1";
  } catch {
    return false;
  }
}

function markSeen() {
  try {
    window.sessionStorage.setItem(SEEN_KEY, "1");
  } catch {
    /* ignore */
  }
}

function HomeLoaderOverlay({ phase }: { phase: Exclude<Phase, "done"> }) {
  const showMark = phase === "morph" || phase === "hold" || phase === "exit";
  const showDots = phase === "bounce" || phase === "morph";

  return (
    <div
      className={`home-loader home-loader--${phase}`}
      role="status"
      aria-live="polite"
      aria-label={`Loading ${PRODUCT_NAME}`}
    >
      <div className="home-loader__stage" aria-hidden>
        {showDots ? (
          <>
            <span className="home-loader__dot home-loader__dot--a" />
            <span className="home-loader__dot home-loader__dot--b" />
            <span className="home-loader__dot home-loader__dot--c" />
          </>
        ) : null}
        {showMark ? (
          <div className="home-loader__mark">
            <SiteLogo
              size={40}
              wordmark="ynda"
              className="home-loader__lockup gap-2.5 [&_span]:text-[1.65rem] [&_span]:font-bold [&_span]:tracking-tight"
            />
          </div>
        ) : null}
      </div>
    </div>
  );
}

/** Home-only loader: bouncing dots morph into the Fynda wordmark. Once per browser session. */
export default function HomeBrandLoader({ children }: Props) {
  const [phase, setPhase] = useState<Phase>("bounce");
  const [skipChecked, setSkipChecked] = useState(false);
  const [portalTarget, setPortalTarget] = useState<HTMLElement | null>(null);

  useLayoutEffect(() => {
    if (readSeen()) setPhase("done");
    setSkipChecked(true);
    setPortalTarget(document.body);
  }, []);

  useEffect(() => {
    if (!skipChecked) return;
    if (phase !== "bounce") return;

    const t1 = window.setTimeout(() => setPhase("morph"), BOUNCE_MS);
    const t2 = window.setTimeout(() => setPhase("hold"), BOUNCE_MS + MORPH_MS);
    const t3 = window.setTimeout(() => setPhase("exit"), BOUNCE_MS + MORPH_MS + HOLD_MS);
    const t4 = window.setTimeout(() => {
      markSeen();
      setPhase("done");
    }, BOUNCE_MS + MORPH_MS + HOLD_MS + EXIT_MS);
    return () => {
      window.clearTimeout(t1);
      window.clearTimeout(t2);
      window.clearTimeout(t3);
      window.clearTimeout(t4);
    };
    // Intentionally only re-run when skip settles into bounce — not on later phase ticks.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [skipChecked]);

  useEffect(() => {
    if (phase === "done") return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [phase]);

  if (phase === "done") {
    return <>{children}</>;
  }

  const overlay = <HomeLoaderOverlay phase={phase} />;

  return (
    <>
      {portalTarget ? createPortal(overlay, portalTarget) : overlay}
      {phase === "exit" ? children : null}
    </>
  );
}
