"use client";

import { useSyncExternalStore } from "react";

export type Toast = {
  id: number;
  title: string;
  description?: string;
  tone?: "default" | "success" | "error";
  image?: string | null;
  action?: { label: string; onClick: () => void };
};

let toasts: Toast[] = [];
let nextId = 1;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

export function toast(t: Omit<Toast, "id">, duration = 4200) {
  const id = nextId++;
  toasts = [...toasts, { ...t, id }].slice(-4);
  emit();
  window.setTimeout(() => dismissToast(id), duration);
  return id;
}

export function dismissToast(id: number) {
  toasts = toasts.filter((t) => t.id !== id);
  emit();
}

const EMPTY: Toast[] = [];
export function useToasts() {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    () => toasts,
    () => EMPTY,
  );
}
