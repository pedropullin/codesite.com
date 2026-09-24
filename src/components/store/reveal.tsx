"use client";

import { motion, useReducedMotion, type HTMLMotionProps } from "motion/react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

const EASE = [0.22, 1, 0.36, 1] as const;

/** Fade + lift + blur in when scrolled into view. */
export function Reveal({
  children,
  delay = 0,
  y = 24,
  blur = 8,
  className,
  once = true,
  amount = 0.25,
  ...rest
}: { children: ReactNode; delay?: number; y?: number; blur?: number; className?: string; once?: boolean; amount?: number } & Omit<HTMLMotionProps<"div">, "children">) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      className={className}
      initial={reduce ? { opacity: 0 } : { opacity: 0, y, filter: `blur(${blur}px)` }}
      whileInView={reduce ? { opacity: 1 } : { opacity: 1, y: 0, filter: "blur(0px)" }}
      viewport={{ once, amount }}
      transition={{ duration: 1.1, delay, ease: EASE }}
      {...rest}
    >
      {children}
    </motion.div>
  );
}

/** Masked line-by-line / word-by-word text reveal (observer sits on the unclipped wrapper). */
export function TextReveal({
  text,
  as = "span",
  className,
  delay = 0,
  stagger = 0.06,
  by = "word",
  once = true,
  animate,
}: {
  text: string;
  as?: "span" | "p" | "div" | "h1" | "h2" | "h3";
  className?: string;
  delay?: number;
  stagger?: number;
  by?: "word" | "line";
  once?: boolean;
  /** Controlled mode: when provided, animates based on this flag instead of viewport. */
  animate?: boolean;
}) {
  const reduce = useReducedMotion();
  const parts = by === "line" ? text.split("\n") : text.split(" ");
  const Tag = motion[as];
  const variants = {
    hidden: reduce ? { opacity: 0 } : { y: "110%", rotate: 2 },
    show: (i: number) => ({
      ...(reduce ? { opacity: 1 } : { y: "0%", rotate: 0 }),
      transition: { duration: 1.05, delay: delay + i * stagger, ease: EASE },
    }),
  };
  const controlled = animate !== undefined;
  return (
    <Tag
      className={cn(className)}
      aria-label={text}
      initial="hidden"
      {...(controlled ? { animate: animate ? "show" : "hidden" } : { whileInView: "show", viewport: { once, amount: 0.3 } })}
    >
      {parts.map((p, i) => (
        <span key={i} aria-hidden className={cn("relative inline-block overflow-hidden pb-[0.08em] -mb-[0.08em] align-top", by === "line" && "block")}>
          <motion.span className="inline-block will-change-transform" variants={variants} custom={i}>
            {p}
            {by === "word" && i < parts.length - 1 ? "\u00a0" : ""}
          </motion.span>
        </span>
      ))}
    </Tag>
  );
}

/** Image reveal: clip-path curtain + subtle scale settle. */
export function ImageReveal({ children, className, delay = 0, direction = "up" }: { children: ReactNode; className?: string; delay?: number; direction?: "up" | "left" }) {
  const reduce = useReducedMotion();
  const from = direction === "up" ? "inset(100% 0% 0% 0%)" : "inset(0% 100% 0% 0%)";
  return (
    <motion.div
      className={cn("overflow-hidden", className)}
      initial={reduce ? { opacity: 0 } : { clipPath: from }}
      whileInView={reduce ? { opacity: 1 } : { clipPath: "inset(0% 0% 0% 0%)" }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 1.3, delay, ease: EASE }}
    >
      <motion.div
        className="h-full w-full"
        initial={reduce ? undefined : { scale: 1.12 }}
        whileInView={reduce ? undefined : { scale: 1 }}
        viewport={{ once: true, amount: 0.2 }}
        transition={{ duration: 1.8, delay, ease: EASE }}
      >
        {children}
      </motion.div>
    </motion.div>
  );
}
