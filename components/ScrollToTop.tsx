"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

function scrollWindowToTop() {
  window.scrollTo(0, 0);
  document.documentElement.scrollTop = 0;
  document.body.scrollTop = 0;
  document.querySelector<HTMLElement>("[data-site-scroll]")?.scrollTo(0, 0);
}

function scrollToTopOrHash() {
  const hash = window.location.hash.replace(/^#/, "");
  if (hash) {
    const target = document.getElementById(hash);
    if (target) {
      target.scrollIntoView({ behavior: "auto", block: "start" });
      return;
    }
  }
  scrollWindowToTop();
}

/** Reset scroll when the route pathname changes (navbar, footer links, etc.). */
export default function ScrollToTop() {
  const pathname = usePathname();

  useEffect(() => {
    if ("scrollRestoration" in window.history) {
      window.history.scrollRestoration = "manual";
    }
  }, []);

  useEffect(() => {
    scrollToTopOrHash();
    // Run again after Next/layout paint in case scroll restoration runs late.
    const id = requestAnimationFrame(() => {
      scrollToTopOrHash();
    });
    return () => cancelAnimationFrame(id);
  }, [pathname]);

  useEffect(() => {
    const onHashChange = () => scrollToTopOrHash();
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, []);

  return null;
}
