"use client";

import { useRange } from "@/lib/client/use-range";
import Image from "next/image";
import Link from "next/link";
import { motion, useScroll, type MotionValue } from "motion/react";
import { useEffect, useRef, useState } from "react";
import type { Banner } from "@/lib/settings-schema";

/** Horizontal gallery driven by vertical scroll. */
export function GallerySection({ items, title }: { items: Banner[]; title: string }) {
  const section = useRef<HTMLElement>(null);
  const track = useRef<HTMLDivElement>(null);
  const [distance, setDistance] = useState(0);
  const { scrollYProgress: p } = useScroll({ target: section, offset: ["start start", "end end"] });
  const x = useRange(p, [0.04, 0.96], [0, -distance]);
  const bar = useRange(p, [0.04, 0.96], [0, 1]);

  useEffect(() => {
    const measure = () => {
      if (track.current) setDistance(Math.max(0, track.current.scrollWidth - window.innerWidth));
    };
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [items.length]);

  const total = items.length;
  return (
    <section ref={section} className="relative bg-ink text-bone" style={{ height: `${(total + 1) * 90 + 60}svh` }} aria-label={title}>
      <div className="sticky top-0 flex h-svh flex-col justify-center overflow-hidden">
        <motion.div ref={track} className="flex items-center gap-4 pl-5 pr-[8vw] will-change-transform md:gap-6 md:pl-10" style={{ x }}>
          <div className="flex w-[78vw] shrink-0 flex-col justify-center md:w-[34vw]">
            <p className="label text-steel">Lines — {String(total).padStart(2, "0")}</p>
            <h2 className="display-xl mt-6">{title}</h2>
            <p className="mt-6 max-w-sm text-sm leading-relaxed text-bone/60">
              Quatro linhas, uma mesma disciplina. Deslize para percorrer o arquivo.
            </p>
            <p className="label-sm mt-10 flex items-center gap-3 text-steel">
              <span className="h-px w-10 bg-steel" /> Scroll
            </p>
          </div>
          {items.map((item, i) => (
            <GalleryItem key={item.title + i} item={item} index={i} total={total} progress={p} />
          ))}
        </motion.div>
        <div className="absolute inset-x-5 bottom-8 flex items-center gap-4 md:inset-x-10">
          <span className="label-sm text-steel">01</span>
          <div className="relative h-px flex-1 bg-white/10">
            <motion.div className="absolute inset-0 origin-left bg-bone" style={{ scaleX: bar }} />
          </div>
          <span className="label-sm text-steel">{String(total).padStart(2, "0")}</span>
        </div>
      </div>
    </section>
  );
}

function GalleryItem({ item, index, total, progress }: { item: Banner; index: number; total: number; progress: MotionValue<number> }) {
  const start = index / (total + 1);
  const imgX = useRange(progress, [start, start + 2 / (total + 1)], ["8%", "-8%"]);
  return (
    <Link
      href={item.href || "/shop"}
      className="group relative block h-[70svh] w-[84vw] shrink-0 overflow-hidden bg-graphite md:h-[76svh] md:w-[62vw]"
      data-cursor="drag"
      data-cursor-label={item.cta || "Open"}
    >
      <motion.div className="absolute inset-y-0 -left-[10%] -right-[10%]" style={{ x: imgX }}>
        {item.image && (
          <Image src={item.image} alt={item.title} fill sizes="(max-width: 768px) 90vw, 70vw" className="object-cover transition-transform duration-[1400ms] ease-[var(--ease-vault)] group-hover:scale-[1.04]" />
        )}
      </motion.div>
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-black/30" />
      <div className="absolute inset-x-0 top-0 flex items-start justify-between p-5 md:p-8">
        <span className="label text-bone/85">
          {String(index + 1).padStart(2, "0")} / {String(total).padStart(2, "0")}
        </span>
        <span className="label-sm text-bone/60">{item.category}</span>
      </div>
      <div className="absolute inset-x-0 bottom-0 flex flex-col gap-5 p-5 md:flex-row md:items-end md:justify-between md:p-8">
        <div>
          <h3 className="display-lg">{item.title}</h3>
          {item.description && <p className="mt-4 max-w-md text-sm text-bone/70">{item.description}</p>}
        </div>
        <span className="label inline-flex items-center gap-3 self-start border border-white/30 px-5 py-3 transition-colors duration-500 group-hover:bg-bone group-hover:text-ink md:self-auto">
          {item.cta || "Explore"} <span>→</span>
        </span>
      </div>
    </Link>
  );
}
