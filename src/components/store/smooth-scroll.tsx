"use client";

import Lenis from "lenis";
import { usePathname } from "next/navigation";
import { useEffect } from "react";

let lenis: Lenis | null = null;

export function getLenis() {
  return lenis;
}

export function scrollToTarget(target: string | number | HTMLElement, opts: { offset?: number; immediate?: boolean } = {}) {
  if (lenis) {
    lenis.scrollTo(target, { offset: opts.offset ?? 0, immediate: opts.immediate, duration: 1.6 });
    return;
  }
  if (typeof target === "number") window.scrollTo({ top: target, behavior: opts.immediate ? "auto" : "smooth" });
  else {
    const el = typeof target === "string" ? document.querySelector(target) : target;
    el?.scrollIntoView({ behavior: opts.immediate ? "auto" : "smooth" });
  }
}

/** Lenis smooth scrolling for the store (disabled for reduced-motion users). */
export function SmoothScroll() {
  const pathname = usePathname();

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    lenis = new Lenis({
      autoRaf: true,
      lerp: 0.085,
      wheelMultiplier: 0.9,
      anchors: true,
      allowNestedScroll: true,
      prevent: (node) => node.closest?.("[data-lenis-prevent]") != null,
    });
    return () => {
      lenis?.destroy();
      lenis = null;
    };
  }, []);

  useEffect(() => {
    if (window.location.hash) return;
    if (lenis) lenis.scrollTo(0, { immediate: true, force: true });
    else window.scrollTo(0, 0);
  }, [pathname]);

  return null;
}
