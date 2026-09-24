"use client";

import { useRange } from "@/lib/client/use-range";
import Image from "next/image";
import Link from "next/link";
import { motion, useScroll } from "motion/react";
import { useRef, useState } from "react";
import { TextReveal, Reveal } from "@/components/store/reveal";
import { cn } from "@/lib/utils";

type Category = { id: number; name: string; slug: string; description: string; image: string | null; productCount: number };

export function CategoriesSection({ categories, title, intro }: { categories: Category[]; title: string; intro: string }) {
  const section = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: section, offset: ["start end", "start 30%"] });
  const bg = useRange(scrollYProgress, [0, 1], ["#ecebe6", "#050505"]);
  const fg = useRange(scrollYProgress, [0, 0.6], ["#050505", "#ecebe6"]);
  const [hover, setHover] = useState<number | null>(null);
  const list = categories.slice(0, 4);

  return (
    <motion.section ref={section} id="categories" className="relative scroll-mt-10 py-28 md:py-40" style={{ backgroundColor: bg, color: fg }}>
      <div className="mx-auto max-w-[1600px] px-5 md:px-10">
        <div className="flex flex-col gap-8">
          <div className="min-w-0">
            <p className="label opacity-50">Index — {String(list.length).padStart(2, "0")}</p>
            <TextReveal as="h2" text={title} className="display-xl mt-6 block" />
          </div>
          <Reveal className="max-w-sm md:self-end" delay={0.2}>
            <p className="text-sm leading-relaxed opacity-60">{intro}</p>
          </Reveal>
        </div>

        <div className="mt-16 grid gap-3 sm:grid-cols-2 md:mt-24 lg:flex lg:h-[76svh] lg:flex-row lg:gap-3" onPointerLeave={() => setHover(null)}>
          {list.map((c, i) => (
            <CategoryTile key={c.id} category={c} index={i} total={list.length} hovered={hover} onHover={setHover} />
          ))}
        </div>
      </div>
    </motion.section>
  );
}

function CategoryTile({ category, index, total, hovered, onHover }: { category: Category; index: number; total: number; hovered: number | null; onHover: (i: number) => void }) {
  const img = useRef<HTMLDivElement>(null);
  const active = hovered === index;
  const dimmed = hovered !== null && !active;
  return (
    <Link
      href={`/shop?category=${category.slug}`}
      onPointerEnter={() => onHover(index)}
      onPointerMove={(e) => {
        if (e.pointerType !== "mouse" || !img.current) return;
        const r = e.currentTarget.getBoundingClientRect();
        const dx = (e.clientX - r.left) / r.width - 0.5;
        const dy = (e.clientY - r.top) / r.height - 0.5;
        img.current.style.transform = `scale(1.07) translate3d(${dx * -18}px, ${dy * -18}px, 0) skewX(${dx * -0.6}deg)`;
      }}
      onPointerLeave={() => {
        if (img.current) img.current.style.transform = "";
      }}
      data-cursor="view"
      data-cursor-label="Open"
      className={cn(
        "group relative block h-[62svh] overflow-hidden bg-graphite text-bone transition-[flex-grow,opacity] duration-[900ms] ease-[var(--ease-vault)] sm:h-[52svh] lg:h-auto lg:min-w-0 lg:flex-1",
        active && "lg:flex-[1.75]",
      )}
    >
      <div ref={img} className="absolute inset-0 transition-transform duration-[1200ms] ease-[var(--ease-vault)] will-change-transform">
        {category.image && (
          <Image src={category.image} alt={category.name} fill sizes="(max-width: 768px) 100vw, 40vw" className="object-cover" />
        )}
      </div>
      <div className={cn("absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-black/10 transition-opacity duration-700", dimmed ? "opacity-100" : "opacity-80 group-hover:opacity-100")} />
      <div className={cn("absolute inset-0 bg-black transition-opacity duration-700", dimmed ? "opacity-40" : "opacity-0")} />
      <div className="absolute inset-x-0 top-0 flex justify-between p-5 md:p-6">
        <span className="label-sm text-bone/70">{String(index + 1).padStart(2, "0")} / {String(total).padStart(2, "0")}</span>
        <span className="label-sm text-bone/70">{String(category.productCount).padStart(2, "0")} pieces</span>
      </div>
      <div className="absolute inset-x-0 bottom-0 p-5 md:p-6">
        <p className="display-md origin-bottom-left transition-transform duration-700 ease-[var(--ease-vault)] group-hover:scale-[1.08]">{category.name}</p>
        <p className="mt-3 max-w-xs text-sm text-bone/65 opacity-100 transition-all duration-700 lg:translate-y-2 lg:opacity-0 lg:group-hover:translate-y-0 lg:group-hover:opacity-100">{category.description}</p>
        <span className="label-sm mt-5 inline-flex items-center gap-2 text-bone/80">
          Open category <span className="transition-transform group-hover:translate-x-1">→</span>
        </span>
      </div>
    </Link>
  );
}
