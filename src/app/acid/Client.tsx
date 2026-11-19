"use client";

import dynamic from "next/dynamic";
import { useEffect } from "react";

export const ChromeBlob = dynamic(() => import("./ChromeBlob"), { ssr: false });

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
