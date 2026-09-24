"use client";

const SESSION_KEY = "vault-sid";

export function getSessionId() {
  try {
    let sid = sessionStorage.getItem(SESSION_KEY);
    if (!sid) {
      sid = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
      sessionStorage.setItem(SESSION_KEY, sid);
    }
    return sid;
  } catch {
    return "anonymous";
  }
}

type TrackPayload = {
  type: "page_view" | "product_view" | "add_to_cart" | "checkout_start";
  path?: string;
  productId?: number;
  value?: number;
};

/** Sends an analytics event to /api/track (fire-and-forget). */
export function track(e: TrackPayload) {
  if (typeof window === "undefined") return;
  const body = JSON.stringify({ ...e, sessionId: getSessionId(), path: e.path ?? location.pathname });
  try {
    if (navigator.sendBeacon) {
      navigator.sendBeacon("/api/track", new Blob([body], { type: "application/json" }));
      return;
    }
  } catch {
    /* fall through */
  }
  fetch("/api/track", { method: "POST", body, headers: { "Content-Type": "application/json" }, keepalive: true }).catch(() => {});
}
