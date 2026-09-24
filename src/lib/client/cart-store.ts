"use client";

import { useSyncExternalStore } from "react";
import type { CartItem } from "@/lib/types";

type CartState = { items: CartItem[]; open: boolean; hydrated: boolean };

const STORAGE_KEY = "vault-cart-v1";
const EMPTY: CartState = { items: [], open: false, hydrated: false };

let state: CartState = EMPTY;
const listeners = new Set<() => void>();

function set(next: Partial<CartState>) {
  state = { ...state, ...next };
  listeners.forEach((l) => l());
}

function persist() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state.items));
  } catch {
    /* storage unavailable (private mode) — cart stays in memory */
  }
}

export const cart = {
  hydrate() {
    if (state.hydrated) return;
    let items: CartItem[] = [];
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) items = (JSON.parse(raw) as CartItem[]).filter((i) => i && i.variantId && i.quantity > 0);
    } catch {
      items = [];
    }
    set({ items, hydrated: true });
  },
  add(item: Omit<CartItem, "key" | "quantity">, quantity = 1) {
    const key = `${item.productId}:${item.variantId}`;
    const existing = state.items.find((i) => i.key === key);
    const items = existing
      ? state.items.map((i) =>
          i.key === key ? { ...i, ...item, key, quantity: Math.min(i.quantity + quantity, item.maxStock) } : i,
        )
      : [...state.items, { ...item, key, quantity: Math.min(quantity, item.maxStock) }];
    set({ items });
    persist();
  },
  setQuantity(key: string, quantity: number) {
    const items = state.items
      .map((i) => (i.key === key ? { ...i, quantity: Math.max(0, Math.min(quantity, i.maxStock)) } : i))
      .filter((i) => i.quantity > 0);
    set({ items });
    persist();
  },
  remove(key: string) {
    set({ items: state.items.filter((i) => i.key !== key) });
    persist();
  },
  clear() {
    set({ items: [] });
    persist();
  },
  replace(items: CartItem[]) {
    set({ items });
    persist();
  },
  open() {
    set({ open: true });
  },
  close() {
    set({ open: false });
  },
  get snapshot() {
    return state;
  },
};

function subscribe(l: () => void) {
  listeners.add(l);
  const onStorage = (e: StorageEvent) => {
    if (e.key === STORAGE_KEY) {
      try {
        set({ items: e.newValue ? JSON.parse(e.newValue) : [] });
      } catch {
        /* ignore malformed */
      }
    }
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(l);
    window.removeEventListener("storage", onStorage);
  };
}

export function useCart() {
  const s = useSyncExternalStore(subscribe, () => state, () => EMPTY);
  const count = s.items.reduce((a, i) => a + i.quantity, 0);
  const subtotal = s.items.reduce((a, i) => a + i.quantity * i.unitPrice, 0);
  return { ...s, count, subtotal };
}
