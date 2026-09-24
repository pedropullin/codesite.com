"use client";

import { useEffect } from "react";

/** Opens WhatsApp automatically when the browser blocked the popup during checkout. */
export function AutoOpen({ href }: { href: string }) {
  useEffect(() => {
    const t = setTimeout(() => {
      window.location.href = href;
    }, 1200);
    return () => clearTimeout(t);
  }, [href]);
  return null;
}
