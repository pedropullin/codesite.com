"use client";

import Image from "next/image";
import Link from "next/link";
import { useRef, ViewTransition } from "react";
import type { ProductCardData } from "@/lib/types";
import { formatPrice } from "@/lib/format";
import { cn } from "@/lib/utils";

export function StatusBadge({ status, className }: { status: ProductCardData["status"]; className?: string }) {
  return (
    <span
      className={cn(
        "label-sm inline-flex items-center gap-1.5",
        status.code === "sold-out" && "opacity-50",
        className,
      )}
    >
      <span
        className={cn(
          "h-1.5 w-1.5 rounded-full",
          status.code === "sold-out" ? "bg-current opacity-40" : status.code === "last-units" ? "chrome-line" : "bg-current",
        )}
      />
      {status.label}
    </span>
  );
}

export function PriceTag({ price, salePrice, className }: { price: number; salePrice: number | null; className?: string }) {
  return (
    <span className={cn("tabular-nums", className)}>
      {salePrice ? (
        <>
          <span>{formatPrice(salePrice)}</span>
          <span className="ml-2 opacity-45 line-through">{formatPrice(price)}</span>
        </>
      ) : (
        formatPrice(price)
      )}
    </span>
  );
}

/**
 * Editorial product card. Hover: image scales and drifts with the pointer,
 * second image crossfades in, "View product" reveals.
 */
export function ProductCard({
  product,
  tone = "light",
  aspect = "aspect-[4/5]",
  sizes = "(max-width: 768px) 50vw, 25vw",
  priority,
  morph,
  index,
  className,
}: {
  product: ProductCardData;
  tone?: "light" | "dark";
  aspect?: string;
  sizes?: string;
  priority?: boolean;
  /** Adds a shared-element view transition name (unique per page). */
  morph?: boolean;
  index?: number;
  className?: string;
}) {
  const media = useRef<HTMLDivElement>(null);
  const second = product.images[1];

  const onMove = (e: React.PointerEvent) => {
    if (e.pointerType !== "mouse" || !media.current) return;
    const r = e.currentTarget.getBoundingClientRect();
    const dx = (e.clientX - r.left) / r.width - 0.5;
    const dy = (e.clientY - r.top) / r.height - 0.5;
    media.current.style.transform = `translate3d(${dx * -14}px, ${dy * -14}px, 0) scale(1.045)`;
  };
  const onLeave = () => {
    if (media.current) media.current.style.transform = "translate3d(0,0,0) scale(1)";
  };

  const image = (
    <div className={cn("relative overflow-hidden", aspect, tone === "light" ? "bg-bone-2" : "bg-bone-3")}>
      <div ref={media} className="absolute inset-0 transition-transform duration-[900ms] ease-[var(--ease-vault)] will-change-transform">
        {product.image ? (
          <Image
            src={product.image}
            alt={product.name}
            fill
            sizes={sizes}
            priority={priority}
            className={cn("object-contain p-[6%] transition-opacity duration-700", second && "group-hover/card:opacity-0")}
          />
        ) : (
          <div className="flex h-full items-center justify-center label text-steel">No image</div>
        )}
        {second && (
          <Image
            src={second}
            alt=""
            fill
            sizes={sizes}
            className="object-contain p-[6%] opacity-0 transition-opacity duration-700 group-hover/card:opacity-100"
          />
        )}
      </div>
      <div className="pointer-events-none absolute inset-x-0 bottom-0 flex translate-y-full items-center justify-between px-4 py-3 transition-transform duration-500 ease-[var(--ease-vault)] group-hover/card:translate-y-0">
        <span className="label-sm text-ink">View product</span>
        <span className="label-sm text-ink">→</span>
      </div>
      <div className="absolute left-3 top-3 flex flex-wrap gap-1.5">
        {product.label && (
          <span className="label-sm bg-ink px-2 py-1 text-bone">{product.label}</span>
        )}
        {product.salePrice && (
          <span className="label-sm border border-ink/30 px-2 py-1 text-ink">Sale</span>
        )}
      </div>
      {typeof index === "number" && (
        <span className="label-sm absolute right-3 top-3 text-ink/50">{String(index + 1).padStart(2, "0")}</span>
      )}
    </div>
  );

  return (
    <Link
      href={`/product/${product.slug}`}
      className={cn("group/card block", className)}
      data-cursor="view"
      data-cursor-label="View"
      onPointerMove={onMove}
      onPointerLeave={onLeave}
      transitionTypes={["nav-forward"]}
    >
      {morph ? (
        <ViewTransition name={`product-${product.slug}`} share="morph" default="none">
          {image}
        </ViewTransition>
      ) : (
        image
      )}
      <div className={cn("mt-4 flex flex-col gap-2 lg:flex-row lg:items-start lg:justify-between lg:gap-4", tone === "light" ? "text-ink" : "text-bone")}>
        <div className="min-w-0">
          <p className="line-clamp-2 text-[12px] uppercase leading-snug tracking-[0.08em] sm:text-[13px] lg:line-clamp-1">{product.name}</p>
          <p className="label-sm mt-1.5 opacity-50">{product.category?.name ?? "—"}</p>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 lg:block lg:shrink-0 lg:text-right">
          <PriceTag price={product.price} salePrice={product.salePrice} className="text-[12px] sm:text-[13px]" />
          <StatusBadge status={product.status} className="opacity-60 lg:mt-1.5 lg:flex lg:justify-end" />
        </div>
      </div>
    </Link>
  );
}

export function ProductCardSkeleton({ tone = "light" }: { tone?: "light" | "dark" }) {
  return (
    <div aria-hidden>
      <div className={cn("aspect-[4/5]", tone === "light" ? "skeleton" : "skeleton-dark")} />
      <div className="mt-4 flex justify-between gap-6">
        <div className="flex-1 space-y-2">
          <div className={cn("h-3 w-3/4", tone === "light" ? "skeleton" : "skeleton-dark")} />
          <div className={cn("h-2 w-1/3", tone === "light" ? "skeleton" : "skeleton-dark")} />
        </div>
        <div className={cn("h-3 w-16", tone === "light" ? "skeleton" : "skeleton-dark")} />
      </div>
    </div>
  );
}
