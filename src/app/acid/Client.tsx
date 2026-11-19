"use client";

import dynamic from "next/dynamic";
import { useEffect, useSyncExternalStore } from "react";

const ChromeBlobScene = dynamic(() => import("./ChromeBlob"), { ssr: false });

const WIDE = "(min-width: 768px)";
const subscribe = (cb: () => void) => {
  const mq = window.matchMedia(WIDE);
  mq.addEventListener("change", cb);
  return () => mq.removeEventListener("change", cb);
};

/** The 3D blob only on wider screens: on phones it is skipped entirely (nothing downloaded). */
export function ChromeBlob() {
  const wide = useSyncExternalStore(subscribe, () => window.matchMedia(WIDE).matches, () => false);
  return wide ? <ChromeBlobScene /> : null;
}

/** Adds .in to every .rise element the first time it scrolls into view. */
export function Rise() {
  useEffect(() => {
    const els = document.querySelectorAll(".acid .rise");
    const io = new IntersectionObserver(
      (entries) =>
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("in");
            io.unobserve(e.target);
          }
        }),
      { rootMargin: "0px 0px -10% 0px" }
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);
  return null;
}
