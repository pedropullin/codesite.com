"use client";

import { useRange } from "@/lib/client/use-range";
import Image from "next/image";
import { motion, useScroll } from "motion/react";
import { useRef } from "react";
import type { ProductDetail } from "@/lib/types";
import { formatPrice } from "@/lib/format";
import { Magnetic } from "@/components/store/magnetic";
import { VaultLink } from "@/components/store/vault-button";

export function FeaturedSection({ product, label, image }: { product: ProductDetail; label: string; image?: string }) {
  const section = useRef<HTMLElement>(null);
  const { scrollYProgress: p } = useScroll({ target: section, offset: ["start start", "end end"] });

  // Product enters from the side, rotates a few degrees and settles in the centre.
  const x = useRange(p, [0, 0.4], ["62vw", "0vw"]);
  const rotate = useRange(p, [0, 0.4, 0.55], [14, -3, 0]);
  const scale = useRange(p, [0, 0.4, 1], [0.78, 1, 1.04]);
  const imgOpacity = useRange(p, [0, 0.15], [0, 1]);
  const ghostX = useRange(p, [0, 1], ["10%", "-30%"]);
  // Text appears progressively; price, then CTA last.
  const t1 = useRange(p, [0.36, 0.46], [0, 1]);
  const t2 = useRange(p, [0.46, 0.56], [0, 1]);
  const t3 = useRange(p, [0.56, 0.66], [0, 1]);
  const t4 = useRange(p, [0.66, 0.74], [0, 1]);
  const t5 = useRange(p, [0.76, 0.84], [0, 1]);
  const y1 = useRange(t1, [0, 1], [30, 0]);
  const y2 = useRange(t2, [0, 1], [30, 0]);
  const y3 = useRange(t3, [0, 1], [30, 0]);
  const y4 = useRange(t4, [0, 1], [24, 0]);
  const y5 = useRange(t5, [0, 1], [24, 0]);
  const src = image || product.image;

  return (
    <section ref={section} className="relative h-[300svh] bg-graphite text-bone" aria-label="Produto em destaque">
      <div className="sticky top-0 h-svh overflow-hidden">
        <div aria-hidden className="absolute inset-0 bg-[radial-gradient(ellipse_55%_45%_at_58%_55%,rgba(255,255,255,0.09),transparent_70%)]" />
        <motion.p
          aria-hidden
          className="font-display pointer-events-none absolute top-1/2 -translate-y-1/2 whitespace-nowrap uppercase leading-none tracking-[-0.04em] text-white/[0.035]"
          style={{ x: ghostX, fontSize: "clamp(8rem, 26vw, 28rem)" }}
        >
          {product.name}
        </motion.p>
        <div className="absolute inset-x-0 top-0 flex justify-between px-5 pt-24 md:px-10 md:pt-28">
          <p className="label text-steel">{label}</p>
          <p className="label-sm text-steel">{product.sku}</p>
        </div>

        <motion.div className="absolute inset-0 flex items-center justify-center md:justify-end md:pr-[6vw]" style={{ x, rotate, scale, opacity: imgOpacity }}>
          <div className="relative h-[46svh] w-[92vw] md:h-[72svh] md:w-[64vw]">
            {src && <Image src={src} alt={product.name} fill sizes="(max-width: 768px) 92vw, 64vw" className="object-contain drop-shadow-[0_60px_60px_rgba(0,0,0,0.55)]" />}
          </div>
        </motion.div>

        <div className="absolute inset-x-0 bottom-0 px-5 pb-10 md:inset-y-0 md:left-0 md:right-auto md:flex md:w-[38vw] md:flex-col md:justify-center md:pb-0 md:pl-10">
          <motion.p className="label-sm text-steel" style={{ opacity: t1, y: y1 }}>{product.category?.name} — {product.label ?? "Archive"}</motion.p>
          <motion.h2 className="display-lg mt-4" style={{ opacity: t1, y: y1 }}>{product.name}</motion.h2>
          <motion.p className="mt-6 hidden max-w-sm text-sm leading-relaxed text-bone/65 md:block" style={{ opacity: t2, y: y2 }}>{product.description}</motion.p>
          <motion.ul className="mt-6 hidden space-y-2 md:block" style={{ opacity: t3, y: y3 }}>
            {product.details.slice(0, 3).map((d) => (
              <li key={d} className="label-sm flex items-center gap-3 text-bone/70"><span className="h-px w-4 chrome-line" />{d}</li>
            ))}
          </motion.ul>
          <motion.p className="mt-8 text-2xl tabular-nums" style={{ opacity: t4, y: y4 }}>
            {product.salePrice ? (
              <>
                {formatPrice(product.salePrice)} <span className="ml-2 text-base text-steel line-through">{formatPrice(product.price)}</span>
              </>
            ) : (
              formatPrice(product.price)
            )}
          </motion.p>
          <motion.div className="mt-8" style={{ opacity: t5, y: y5 }}>
            <Magnetic>
              <VaultLink href={`/product/${product.slug}`} variant="solid" arrow>
                View product
              </VaultLink>
            </Magnetic>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
