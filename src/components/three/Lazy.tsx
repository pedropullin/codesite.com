"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState, type ReactNode } from "react";

// WebGL only exists in the browser, so the scenes are never prerendered.
const HeroGlyphsScene = dynamic(() => import("./HeroGlyphs"), { ssr: false });
const RunKeysScene = dynamic(() => import("./RunKeys"), { ssr: false });

/**
 * Mounts a 3D scene only when it can run well: a wide screen, a fine pointer,
 * no reduced-motion or data-saver preference, and only once the page is idle
 * and the spot is near the viewport. Otherwise nothing is downloaded.
 */
function Gate({ children, className = "" }: { children: ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [show, setShow] = useState(false);

  useEffect(() => {
    const capable =
      window.matchMedia("(min-width: 900px) and (pointer: fine) and (prefers-reduced-motion: no-preference)").matches &&
      !(navigator as Navigator & { connection?: { saveData?: boolean } }).connection?.saveData &&
      (navigator.hardwareConcurrency ?? 8) >= 4;
    const el = ref.current;
    if (!capable || !el) return;

    let idle = 0;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        io.disconnect();
        const ric = window.requestIdleCallback ?? ((cb: () => void) => window.setTimeout(cb, 300));
        idle = ric(() => setShow(true)) as number;
      },
      { rootMargin: "400px 0px" }
    );
    io.observe(el);
    return () => {
      io.disconnect();
      window.cancelIdleCallback?.(idle);
    };
  }, []);

  return (
    <div ref={ref} className={className}>
      {show ? children : null}
    </div>
  );
}

export function HeroGlyphs() {
  return (
    <Gate className="absolute inset-0">
      <HeroGlyphsScene />
    </Gate>
  );
}

export function RunKeys() {
  return (
    <Gate className="h-full w-full">
      <RunKeysScene />
    </Gate>
  );
}
