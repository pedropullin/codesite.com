"use client";

import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/lib/utils";

type Variant = "solid" | "outline" | "ghost" | "solid-dark" | "outline-dark";

const base =
  "group/btn relative inline-flex select-none items-center justify-center gap-3 overflow-hidden whitespace-nowrap px-7 h-12 label transition-[color,border-color,background-color,opacity] duration-500 ease-[var(--ease-vault)] disabled:pointer-events-none disabled:opacity-40 focus-visible:outline focus-visible:outline-1 focus-visible:outline-offset-4";

const variants: Record<Variant, string> = {
  // Light button on dark backgrounds
  solid: "bg-bone text-ink hover:text-bone focus-visible:outline-bone",
  outline: "border border-bone/35 text-bone hover:text-ink hover:border-bone focus-visible:outline-bone",
  ghost: "px-0 h-auto text-bone/80 hover:text-bone",
  // Dark button on light backgrounds
  "solid-dark": "bg-ink text-bone hover:text-ink focus-visible:outline-ink",
  "outline-dark": "border border-ink/30 text-ink hover:text-bone hover:border-ink focus-visible:outline-ink",
};

const fills: Record<Variant, string> = {
  solid: "bg-ink",
  outline: "bg-bone",
  ghost: "",
  "solid-dark": "bg-bone",
  "outline-dark": "bg-ink",
};

function Inner({ children, variant, arrow }: { children: ReactNode; variant: Variant; arrow?: boolean }) {
  return (
    <>
      {variant !== "ghost" && (
        <span
          aria-hidden
          className={cn(
            "absolute inset-0 origin-bottom scale-y-0 transition-transform duration-500 ease-[var(--ease-vault)] group-hover/btn:scale-y-100",
            fills[variant],
          )}
        />
      )}
      <span className="relative z-10 flex items-center gap-3">
        {children}
        {arrow && (
          <span aria-hidden className="relative inline-flex h-3 w-5 overflow-hidden">
            <span className="absolute inset-0 flex items-center transition-transform duration-500 ease-[var(--ease-vault)] group-hover/btn:translate-x-full">→</span>
            <span className="absolute inset-0 flex -translate-x-full items-center transition-transform duration-500 ease-[var(--ease-vault)] group-hover/btn:translate-x-0">→</span>
          </span>
        )}
      </span>
      {variant === "ghost" && (
        <span aria-hidden className="absolute -bottom-1 left-0 h-px w-full origin-right scale-x-100 bg-current opacity-40 transition-transform duration-500 ease-[var(--ease-vault)] group-hover/btn:origin-left group-hover/btn:animate-none" />
      )}
    </>
  );
}

export function VaultLink({
  href,
  children,
  variant = "solid",
  arrow,
  className,
  ...rest
}: { href: string; children: ReactNode; variant?: Variant; arrow?: boolean; className?: string } & Omit<ComponentProps<typeof Link>, "href" | "children" | "className">) {
  return (
    <Link href={href} className={cn(base, variants[variant], className)} {...rest}>
      <Inner variant={variant} arrow={arrow}>
        {children}
      </Inner>
    </Link>
  );
}

export function VaultButton({
  children,
  variant = "solid",
  arrow,
  className,
  ...rest
}: { children: ReactNode; variant?: Variant; arrow?: boolean; className?: string } & Omit<ComponentProps<"button">, "children" | "className">) {
  return (
    <button className={cn(base, variants[variant], className)} {...rest}>
      <Inner variant={variant} arrow={arrow}>
        {children}
      </Inner>
    </button>
  );
}
