"use client";

import Image from "next/image";
import { AnimatePresence, motion } from "motion/react";
import { dismissToast, useToasts } from "@/lib/client/toast-store";
import { cn } from "@/lib/utils";

export function Toaster({ theme = "dark" }: { theme?: "dark" | "light" }) {
  const toasts = useToasts();
  return (
    <div className="pointer-events-none fixed bottom-4 left-4 right-4 z-[150] flex flex-col items-start gap-2 md:bottom-6 md:left-6 md:right-auto" aria-live="polite">
      <AnimatePresence initial={false}>
        {toasts.map((t) => (
          <motion.div
            key={t.id}
            layout
            initial={{ opacity: 0, y: 24, filter: "blur(6px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            exit={{ opacity: 0, x: -24, transition: { duration: 0.25 } }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className={cn(
              "pointer-events-auto flex w-full max-w-sm items-center gap-4 border p-3 pr-4 shadow-2xl backdrop-blur-xl",
              theme === "dark" ? "border-white/10 bg-graphite/90 text-bone" : "rounded-lg border-border bg-white text-foreground",
            )}
            role="status"
          >
            {t.image ? (
              <div className={cn("relative h-14 w-12 shrink-0", theme === "dark" ? "bg-bone-3" : "bg-muted")}>
                <Image src={t.image} alt="" fill sizes="48px" className="object-contain p-1" />
              </div>
            ) : (
              <span
                className={cn(
                  "ml-1 h-2 w-2 shrink-0 rounded-full",
                  t.tone === "error" ? "bg-red-500" : t.tone === "success" ? "bg-emerald-500" : theme === "dark" ? "bg-silver" : "bg-foreground",
                )}
              />
            )}
            <div className="min-w-0 flex-1">
              <p className={cn("text-sm", theme === "dark" && "uppercase tracking-[0.08em]")}>{t.title}</p>
              {t.description && <p className={cn("mt-0.5 text-xs", theme === "dark" ? "text-steel" : "text-muted-foreground")}>{t.description}</p>}
            </div>
            {t.action && (
              <button type="button" className="label-sm shrink-0 underline underline-offset-4" onClick={() => { t.action?.onClick(); dismissToast(t.id); }}>
                {t.action.label}
              </button>
            )}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
