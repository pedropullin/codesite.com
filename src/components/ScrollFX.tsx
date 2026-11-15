"use client";

import { useEffect } from "react";

/**
 * Writes a scroll progress value (--p, 0 to 1) onto every [data-scroll]
 * element so CSS can tie transforms to the scroll position.
 *   data-scroll="exit"    0 while the element's top sits at the viewport top, 1 once it has scrolled past
 *   data-scroll="enter"   0 when its top touches the viewport bottom, 1 once it is fully on screen
 *   data-scroll="through" 0 entering at the bottom, 1 leaving at the top
 * With reduced motion nothing is written and the CSS rest values apply.
 */
export default function ScrollFX() {
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const els = Array.from(document.querySelectorAll<HTMLElement>("[data-scroll]"));
    if (!els.length) return;

    let frame = 0;
    const clamp = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);

    const update = () => {
      frame = 0;
      const vh = window.innerHeight;
      for (const el of els) {
        const r = el.getBoundingClientRect();
        if (r.bottom < -vh || r.top > vh * 2) continue;
        const mode = el.dataset.scroll;
        let p: number;
        if (mode === "exit") p = clamp(-r.top / r.height);
        else if (mode === "enter") p = clamp((vh - r.top) / Math.min(r.height, vh * 0.8));
        else p = clamp((vh - r.top) / (vh + r.height));
        el.style.setProperty("--p", p.toFixed(4));
      }
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };

    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  return null;
}
