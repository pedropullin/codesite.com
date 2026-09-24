"use client";

import { useSyncExternalStore } from "react";

const noopSubscribe = () => () => {};

/** Reads a browser-only value without a hydration mismatch (server snapshot = fallback). */
export function useClientValue<T>(read: () => T, fallback: T): T {
  return useSyncExternalStore(noopSubscribe, read, () => fallback);
}

/** Subscribes to a media query. */
export function useMediaQuery(query: string, fallback = false) {
  return useSyncExternalStore(
    (cb) => {
      const mq = window.matchMedia(query);
      mq.addEventListener("change", cb);
      return () => mq.removeEventListener("change", cb);
    },
    () => window.matchMedia(query).matches,
    () => fallback,
  );
}
