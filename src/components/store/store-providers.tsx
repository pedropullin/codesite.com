"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { cart } from "@/lib/client/cart-store";
import { track } from "@/lib/client/analytics";
import { SmoothScroll } from "./smooth-scroll";
import { Cursor } from "./cursor";
import { Toaster } from "./toaster";

export function StoreProviders() {
  const pathname = usePathname();

  useEffect(() => {
    cart.hydrate();
  }, []);

  useEffect(() => {
    track({ type: "page_view", path: pathname });
  }, [pathname]);

  return (
    <>
      <SmoothScroll />
      <Cursor />
      <Toaster theme="dark" />
    </>
  );
}
