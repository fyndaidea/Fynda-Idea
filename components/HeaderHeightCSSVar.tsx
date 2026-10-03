"use client";

import { useEffect } from "react";

export default function HeaderHeightCSSVar() {
  useEffect(() => {
    const header = document.querySelector<HTMLElement>("[data-site-header]");
    if (!header) return;

    const apply = () => {
      document.documentElement.style.setProperty("--site-header-h", `${header.offsetHeight}px`);
    };

    apply();

    const ro = new ResizeObserver(() => apply());
    ro.observe(header);
    window.addEventListener("resize", apply);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", apply);
    };
  }, []);

  return null;
}

