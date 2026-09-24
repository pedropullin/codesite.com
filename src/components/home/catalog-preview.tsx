"use client";

import { useRange } from "@/lib/client/use-range";
import Link from "next/link";
import { motion, useScroll } from "motion/react";
import { useRef } from "react";
import type { ProductCardData } from "@/lib/types";
import { ProductCard } from "@/components/store/product-card";
import { Reveal, TextReveal } from "@/components/store/reveal";
import { VaultLink } from "@/components/store/vault-button";

type Category = { name: string; slug: string; productCount: number };

export function CatalogPreview({ products, categories, title, intro }: { products: ProductCardData[]; categories: Category[]; title: string; intro: string }) {
  const section = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: section, offset: ["start end", "start 20%"] });
  const clip = useRange(scrollYProgress, [0, 1], ["inset(12% 6% 0% 6%)", "inset(0% 0% 0% 0%)"]);

  return (
    <section ref={section} className="relative bg-ink" aria-label={title}>
      <motion.div className="bg-paper pb-28 pt-24 text-ink md:pb-40 md:pt-36" style={{ clipPath: clip }}>
        <div className="mx-auto max-w-[1600px] px-5 md:px-10">
          <div className="flex flex-col gap-8">
            <div className="min-w-0">
              <p className="label text-ink/50">Archive — Complete</p>
              <TextReveal as="h2" text={title} className="display-xl mt-6 block" />
            </div>
            <Reveal className="max-w-sm md:self-end" delay={0.15}>
              <p className="text-sm leading-relaxed text-ink/60">{intro}</p>
            </Reveal>
          </div>
          <Reveal className="mt-12 flex flex-wrap gap-2 border-y border-ink/10 py-5" delay={0.1}>
            <Link href="/shop" className="label border border-ink bg-ink px-4 py-2 text-bone">All</Link>
            {categories.map((c) => (
              <Link key={c.slug} href={`/shop?category=${c.slug}`} className="label border border-ink/20 px-4 py-2 transition-colors hover:border-ink">
                {c.name} <span className="ml-1 opacity-40">{c.productCount}</span>
              </Link>
            ))}
            <Link href="/shop?filter=new" className="label border border-ink/20 px-4 py-2 transition-colors hover:border-ink">New</Link>
            <Link href="/shop?filter=featured" className="label border border-ink/20 px-4 py-2 transition-colors hover:border-ink">Featured</Link>
          </Reveal>
          <div className="mt-14 grid grid-cols-2 gap-x-3 gap-y-12 md:grid-cols-3 md:gap-x-6 lg:grid-cols-4">
            {products.map((p, i) => (
              <Reveal key={p.id} y={30} delay={(i % 4) * 0.08}>
                <ProductCard product={p} sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw" />
              </Reveal>
            ))}
          </div>
          <div className="mt-20 flex justify-center">
            <VaultLink href="/shop" variant="solid-dark" arrow>
              View full catalog
            </VaultLink>
          </div>
        </div>
      </motion.div>
    </section>
  );
}
