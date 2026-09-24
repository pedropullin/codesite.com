"use client";

import { useEffect, useRef, useState } from "react";
import { useMediaQuery } from "@/lib/client/use-client-value";

/**
 * Custom cursor: a precise dot plus a trailing ring. Elements can opt into
 * states with data-cursor="view|link|drag|hide" and data-cursor-label.
 */
export function Cursor() {
  const dot = useRef<HTMLDivElement>(null);
  const ring = useRef<HTMLDivElement>(null);
  const [mode, setMode] = useState<"default" | "link" | "view" | "drag" | "hide">("default");
  const [label, setLabel] = useState("");
  const enabled = useMediaQuery("(hover: hover) and (pointer: fine)");

  useEffect(() => {
    if (!enabled) return;
    document.documentElement.classList.add("has-custom-cursor");
    let x = -100;
    let y = -100;
    let rx = -100;
    let ry = -100;
    let raf = 0;
    let visible = false;

    const move = (e: PointerEvent) => {
      x = e.clientX;
      y = e.clientY;
      if (!visible) {
        visible = true;
        rx = x;
        ry = y;
        if (dot.current) dot.current.style.opacity = "1";
        if (ring.current) ring.current.style.opacity = "1";
      }
      if (dot.current) dot.current.style.transform = `translate3d(${x}px, ${y}px, 0)`;
    };
    const loop = () => {
      rx += (x - rx) * 0.16;
      ry += (y - ry) * 0.16;
      if (ring.current) ring.current.style.transform = `translate3d(${rx}px, ${ry}px, 0)`;
      raf = requestAnimationFrame(loop);
    };
    const over = (e: PointerEvent) => {
      const t = e.target as HTMLElement | null;
      const el = t?.closest<HTMLElement>("[data-cursor], a, button, [role='button'], input, textarea, select, label");
      if (!el) {
        setMode("default");
        setLabel("");
        return;
      }
      const m = el.dataset.cursor as typeof mode | undefined;
      if (m) {
        setMode(m);
        setLabel(el.dataset.cursorLabel ?? "");
      } else if (/INPUT|TEXTAREA|SELECT/.test(el.tagName)) {
        setMode("hide");
        setLabel("");
      } else {
        setMode("link");
        setLabel("");
      }
    };
    const leave = () => {
      visible = false;
      if (dot.current) dot.current.style.opacity = "0";
      if (ring.current) ring.current.style.opacity = "0";
    };
    window.addEventListener("pointermove", move, { passive: true });
    window.addEventListener("pointerover", over, { passive: true });
    document.addEventListener("pointerleave", leave);
    raf = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerover", over);
      document.removeEventListener("pointerleave", leave);
      document.documentElement.classList.remove("has-custom-cursor");
    };
  }, [enabled]);

  if (!enabled) return null;

  const ringSize = mode === "view" ? 92 : mode === "drag" ? 76 : mode === "link" ? 44 : 30;
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-[200] mix-blend-difference">
      <div
        ref={dot}
        className="absolute left-0 top-0 opacity-0 transition-opacity duration-300"
        style={{ willChange: "transform" }}
      >
        <div
          className="-translate-x-1/2 -translate-y-1/2 rounded-full bg-white transition-[width,height,opacity] duration-300"
          style={{ width: mode === "view" || mode === "drag" ? 0 : 5, height: mode === "view" || mode === "drag" ? 0 : 5, opacity: mode === "hide" ? 0 : 1 }}
        />
      </div>
      <div ref={ring} className="absolute left-0 top-0 opacity-0 transition-opacity duration-300" style={{ willChange: "transform" }}>
        <div
          className="flex -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-white/70 text-white transition-[width,height,background-color,border-color,opacity] duration-500 ease-[var(--ease-vault)]"
          style={{
            width: ringSize,
            height: ringSize,
            opacity: mode === "hide" ? 0 : 1,
            backgroundColor: mode === "view" || mode === "drag" ? "rgba(255,255,255,1)" : "transparent",
            borderColor: mode === "view" || mode === "drag" ? "transparent" : undefined,
          }}
        >
          {(mode === "view" || mode === "drag") && (
            <span className="label-sm text-black">{label || (mode === "drag" ? "Drag" : "View")}</span>
          )}
        </div>
      </div>
    </div>
  );
}
