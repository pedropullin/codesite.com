"use client";

import { useRange } from "@/lib/client/use-range";
import Image from "next/image";
import { motion, useScroll } from "motion/react";
import { useRef } from "react";
import type { BrandSettings } from "@/lib/settings-schema";

export function BrandSection({ brand, statement }: { brand: BrandSettings; statement: string }) {
  const section = useRef<HTMLElement>(null);
  const { scrollYProgress: enter } = useScroll({ target: section, offset: ["start end", "start start"] });
  const { scrollYProgress: p } = useScroll({ target: section, offset: ["start start", "end end"] });

  const clip = useRange(enter, [0, 1], ["inset(22% 14% 0% 14%)", "inset(0% 0% 0% 0%)"]);
  const scale = useRange(p, [0, 0.62], [0.34, 2.6]);
  const x = useRange(p, [0, 0.25, 0.62], ["0%", "0%", "-22%"]);
  const y = useRange(p, [0, 0.62], ["0vh", "-4vh"]);
  const rotX = useRange(p, [0, 0.4, 0.8], [10, 0, -4]);
  const camZ = useRange(p, [0, 0.8], [0, 120]);
  const wordOpacity = useRange(p, [0.55, 0.72], [1, 0.08]);
  const lineA = useRange(p, [0.05, 0.3], [0, 1]);
  const lineB = useRange(p, [0.15, 0.4], [0, 1]);
  const marks = useRange(p, [0.12, 0.28], [0, 1]);
  const textOpacity = useRange(p, [0.6, 0.75], [0, 1]);
  const textY = useRange(p, [0.6, 0.8], [60, 0]);
  const imgY = useRange(p, [0.5, 1], ["20%", "-10%"]);

  const [first, ...rest] = brand.name.toUpperCase().split(" ");

  return (
    <section ref={section} id="brand" className="relative h-[320svh] text-ink">
      <motion.div className="sticky top-0 h-svh overflow-hidden bg-bone" style={{ clipPath: clip }}>
        {/* Minimal technical grid */}
        <motion.div aria-hidden className="absolute inset-x-0 top-[22%] h-px origin-left bg-ink/15" style={{ scaleX: lineA }} />
        <motion.div aria-hidden className="absolute inset-x-0 bottom-[22%] h-px origin-right bg-ink/15" style={{ scaleX: lineA }} />
        <motion.div aria-hidden className="absolute inset-y-0 left-[12%] w-px origin-top bg-ink/10" style={{ scaleY: lineB }} />
        <motion.div aria-hidden className="absolute inset-y-0 right-[12%] w-px origin-bottom bg-ink/10" style={{ scaleY: lineB }} />
        <motion.div aria-hidden className="pointer-events-none absolute inset-0" style={{ opacity: marks }}>
          {[
            "left-[12%] top-[22%]",
            "right-[12%] top-[22%]",
            "left-[12%] bottom-[22%]",
            "right-[12%] bottom-[22%]",
          ].map((pos) => (
            <span key={pos} className={`absolute ${pos} -translate-x-1/2 -translate-y-1/2 text-[11px] text-ink/50`}>+</span>
          ))}
          <p className="label-sm absolute left-5 top-24 text-ink/50 md:left-10">N° 002 — Identity</p>
          <p className="label-sm absolute right-5 top-24 text-right text-ink/50 md:right-10">{brand.location}<br />23°33′S 46°39′W</p>
          <p className="label-sm absolute bottom-8 left-5 text-ink/50 md:left-10">Est. {brand.foundedYear}</p>
          <p className="label-sm absolute bottom-8 right-5 text-ink/50 md:right-10">Scroll ↓</p>
          <span className="absolute left-1/2 top-[22%] h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full border border-ink/30" />
        </motion.div>

        {/* Virtual camera follows the wordmark */}
        <motion.div className="absolute inset-0 flex items-center justify-center [perspective:1200px]" style={{ y }}>
          <motion.div style={{ rotateX: rotX, z: camZ }} className="[transform-style:preserve-3d]">
            <motion.h2
              className="font-display whitespace-nowrap uppercase leading-none tracking-[-0.04em]"
              style={{ scale, x, opacity: wordOpacity, fontSize: "clamp(3rem, 11vw, 12rem)" }}
            >
              {first}
              <span className="text-ink/35"> {rest.join(" ")}</span>
            </motion.h2>
          </motion.div>
        </motion.div>

        {/* Manifesto */}
        <motion.div className="absolute inset-0 grid items-center px-5 md:grid-cols-12 md:px-10" style={{ opacity: textOpacity, y: textY }}>
          <div className="md:col-span-5 md:col-start-2">
            <p className="label text-ink/50">The association</p>
            <p className="mt-6 text-balance text-[clamp(1.25rem,2.1vw,2rem)] leading-[1.3] tracking-[-0.01em]">{statement}</p>
            <p className="mt-6 max-w-md text-sm leading-relaxed text-ink/60">{brand.manifesto}</p>
            <dl className="mt-10 grid max-w-md grid-cols-3 gap-6 border-t border-ink/15 pt-6">
              {[
                ["250", "Units / edition"],
                ["04", "Disciplines"],
                [brand.foundedYear, "Established"],
              ].map(([n, l]) => (
                <div key={l}>
                  <dt className="font-display text-xl">{n}</dt>
                  <dd className="label-sm mt-2 text-ink/50">{l}</dd>
                </div>
              ))}
            </dl>
          </div>
          <div className="relative hidden h-[62svh] md:col-span-4 md:col-start-8 md:block">
            <div className="relative h-full overflow-hidden bg-ink">
              <motion.div className="absolute inset-[-12%]" style={{ y: imgY }}>
                <Image src="/renders/brand-detail.webp" alt="Detalhe do logotipo em baixo-relevo na caixa Vault" fill sizes="33vw" className="object-cover" />
              </motion.div>
            </div>
            <p className="label-sm mt-3 text-ink/50">Fig. 01 — Debossed identity, matte black</p>
          </div>
        </motion.div>
      </motion.div>
    </section>
  );
}
