"use client";

import { useRange } from "@/lib/client/use-range";
import { motion, useScroll } from "motion/react";
import { useRef } from "react";
import type { ProductCardData } from "@/lib/types";
import { ProductCard } from "@/components/store/product-card";
import { Reveal, TextReveal } from "@/components/store/reveal";
import { VaultLink } from "@/components/store/vault-button";
import { cn } from "@/lib/utils";

const LAYOUT = [
  { cls: "md:col-span-5 md:col-start-1", aspect: "aspect-[4/5]", speed: 0 },
  { cls: "md:col-span-3 md:col-start-8 md:mt-44", aspect: "aspect-[3/4]", speed: -60 },
  { cls: "md:col-span-4 md:col-start-2 md:mt-28", aspect: "aspect-[4/5]", speed: 40 },
  { cls: "md:col-span-5 md:col-start-7 md:-mt-24", aspect: "aspect-[5/6]", speed: -30 },
  { cls: "md:col-span-3 md:col-start-3 md:mt-16", aspect: "aspect-[3/4]", speed: 50 },
  { cls: "md:col-span-4 md:col-start-8 md:mt-36", aspect: "aspect-[4/5]", speed: -40 },
];

function Parallax({ speed, children, className }: { speed: number; children: React.ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const y = useRange(scrollYProgress, [0, 1], [speed, -speed]);
  return (
    <motion.div ref={ref} style={{ y }} className={className}>
      {children}
    </motion.div>
  );
}

export function CollectionSection({ products, title, intro, label }: { products: ProductCardData[]; title: string; intro: string; label: string }) {
  return (
    <section id="collection" className="relative scroll-mt-10 bg-bone pb-32 pt-28 text-ink md:pb-48 md:pt-40">
      <div className="mx-auto max-w-[1600px] px-5 md:px-10">
        <div className="flex flex-col gap-8">
          <div className="min-w-0">
            <p className="label text-ink/50">{label} — {String(products.length).padStart(2, "0")} pieces</p>
            <TextReveal as="h2" text={title} className="display-xl mt-6 block" />
          </div>
          <Reveal className="max-w-sm md:self-end" delay={0.2}>
            <p className="text-sm leading-relaxed text-ink/60">{intro}</p>
          </Reveal>
        </div>
        <div className="mt-10 h-px w-full bg-ink/15 md:mt-16" />

        {products.length === 0 ? (
          <div className="py-32 text-center">
            <p className="display-md">The archive is being prepared</p>
            <p className="mt-4 text-sm text-ink/60">Novas peças em breve.</p>
          </div>
        ) : (
          <div className="mt-16 grid grid-cols-2 gap-x-4 gap-y-14 md:mt-24 md:grid-cols-12 md:gap-x-6 md:gap-y-0">
            {products.slice(0, 6).map((p, i) => {
              const l = LAYOUT[i % LAYOUT.length];
              return (
                <Parallax key={p.id} speed={l.speed} className={cn(l.cls, i % 2 === 1 && "mt-16 md:mt-0")}>
                  <Reveal y={40} delay={(i % 2) * 0.12}>
                    <ProductCard product={p} aspect={l.aspect} index={i} sizes="(max-width: 768px) 50vw, 40vw" />
                  </Reveal>
                </Parallax>
              );
            })}
          </div>
        )}
        <div className="mt-24 flex justify-center md:mt-40">
          <VaultLink href="/shop" variant="outline-dark" arrow>
            View all products
          </VaultLink>
        </div>
      </div>
    </section>
  );
}
