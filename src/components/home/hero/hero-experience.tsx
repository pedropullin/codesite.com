"use client";

import { useRange } from "@/lib/client/use-range";
import dynamic from "next/dynamic";
import Image from "next/image";
import Link from "next/link";
import { motion, useMotionValueEvent, useReducedMotion, useScroll, useTransform, type MotionValue } from "motion/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { detectDeviceTier, type DeviceTier } from "@/lib/client/device";
import { useClientValue } from "@/lib/client/use-client-value";
import type { ProductCardData } from "@/lib/types";
import type { HeroSettings } from "@/lib/settings-schema";
import { formatPrice } from "@/lib/format";
import { Magnetic } from "@/components/store/magnetic";
import { VaultLink } from "@/components/store/vault-button";
import { scrollToTarget } from "@/components/store/smooth-scroll";
import { cn } from "@/lib/utils";
import { FallbackBox } from "./fallback-box";
import { activeStage, seg, STAGE_BOUNDS, STAGE_LABELS, stages } from "./stages";
import type { CardTarget } from "./vault-scene";

let cachedTier: DeviceTier | null = null;
/** ?tier=high|medium|low|none forces a rendering tier (QA / demos). */
function readTier(): DeviceTier {
  if (cachedTier) return cachedTier;
  const forced = new URLSearchParams(window.location.search).get("tier") as DeviceTier | null;
  cachedTier = forced && ["high", "medium", "low", "none"].includes(forced) ? forced : detectDeviceTier();
  return cachedTier;
}

const VaultScene = dynamic(() => import("./vault-scene"), { ssr: false });

type Props = {
  hero: HeroSettings;
  brandName: string;
  collectionLabel: string;
  foundedYear: string;
  heroProduct: ProductCardData | null;
  fallbackImages: string[];
  objectCount: number;
};

/** Maps progress to an opacity window: fade in [a,b], hold, fade out [c,d]. */
function useWindow(p: MotionValue<number>, a: number, b: number, c = 2, d = 2) {
  return useTransform(p, (v) => Math.min(seg(v, a, b), 1 - seg(v, c, d)));
}

export function HeroExperience({ hero, brandName, collectionLabel, foundedYear, heroProduct, fallbackImages, objectCount }: Props) {
  const section = useRef<HTMLElement>(null);
  const cardImage = useRef<HTMLDivElement>(null);
  const cardTarget = useRef<CardTarget | null>(null);
  const reduce = useReducedMotion() ?? false;
  const tier = useClientValue<DeviceTier | null>(readTier, null);
  const [ready, setReady] = useState(false);
  const [active, setActive] = useState(true);
  const [stage, setStage] = useState(0);

  const { scrollYProgress } = useScroll({ target: section, offset: ["start start", "end end"] });
  useMotionValueEvent(scrollYProgress, "change", (v) => {
    const s = activeStage(v);
    setStage((prev) => (prev === s ? prev : s));
  });


  // Pause rendering when the hero is off-screen.
  useEffect(() => {
    const el = section.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setActive(e.isIntersecting), { rootMargin: "100px" });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  // Screen-space target of the first product card (for the 3D → card morph).
  useEffect(() => {
    const measure = () => {
      const el = cardImage.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      const sticky = el.closest("[data-hero-sticky]")?.getBoundingClientRect();
      const top = sticky ? r.top - sticky.top : r.top;
      cardTarget.current = {
        x: ((r.left + r.width / 2) / window.innerWidth) * 2 - 1,
        y: -(((top + r.height / 2) / window.innerHeight) * 2 - 1),
        h: r.height / window.innerHeight,
      };
    };
    measure();
    window.addEventListener("resize", measure);
    const ro = new ResizeObserver(measure);
    if (cardImage.current) ro.observe(cardImage.current);
    return () => {
      window.removeEventListener("resize", measure);
      ro.disconnect();
    };
  }, []);

  const onReady = useCallback(() => setReady(true), []);

  const p = scrollYProgress;
  const bg = useRange(p, [0, 0.14, 0.34, 0.8, 1], ["#050505", "#050505", "#0e0e10", "#0e0e10", "#0c0c0d"]);
  const titleOpacity = useRange(p, [0, 0.1, 0.2], [1, 0.9, 0]);
  const titleY = useRange(p, [0, 0.2], ["0vh", "-8vh"]);
  const titleBlur = useRange(p, [0.06, 0.2], ["blur(0px)", "blur(12px)"]);
  const uiOpacity = useRange(p, [0, 0.07, 0.12], [1, 1, 0]);
  const uiY = useRange(p, [0, 0.12], [0, -40]);
  const scrollCue = useRange(p, [0, 0.03], [1, 0]);
  const annotations = useWindow(p, 0.16, 0.24, 0.33, 0.38);
  const inside = useWindow(p, 0.44, 0.52, 0.6, 0.66);
  const focus = useWindow(p, 0.7, 0.77, 0.83, 0.88);
  const outro = useWindow(p, 0.86, 0.95);
  const cardOpacity = useTransform(p, (v) => seg(stages(v).s5, 0.35, 0.8));
  const cardBlur = useTransform(p, (v) => `blur(${(1 - seg(stages(v).s5, 0.35, 0.85)) * 10}px)`);
  const cardScale = useTransform(p, (v) => 0.94 + 0.06 * seg(stages(v).s5, 0.35, 0.9));

  const heroImage = heroProduct ? heroProduct.images[1] ?? heroProduct.image : null;

  return (
    <section ref={section} className="relative h-[520svh] md:h-[620svh]" aria-label={`${brandName} — experiência`}>
      <div data-hero-sticky className="sticky top-0 h-svh w-full overflow-hidden text-bone">
        <motion.div className="absolute inset-0" style={{ backgroundColor: bg }} />
        <div aria-hidden className="absolute inset-0 bg-[radial-gradient(ellipse_60%_50%_at_50%_58%,rgba(255,255,255,0.07),transparent_70%)]" />
        <div aria-hidden className="absolute inset-0 opacity-[0.06] [background-image:linear-gradient(rgba(255,255,255,0.5)_1px,transparent_1px)] [background-size:100%_25vh]" />

        {/* Giant title — sits behind the object */}
        <motion.h1
          className="pointer-events-none absolute inset-0 flex flex-col items-center justify-between pb-[22svh] pt-[21svh] text-center md:py-[16svh]"
          style={{ opacity: titleOpacity, y: titleY, filter: titleBlur }}
        >
          <span className="display-xl block whitespace-nowrap" style={{ fontSize: "clamp(1.75rem, 8.6vw, 11rem)" }}>{hero.titleLine1}</span>
          <span className="display-xl block whitespace-nowrap text-bone/90" style={{ fontSize: "clamp(1.75rem, 8.6vw, 11rem)" }}>{hero.titleLine2}</span>
        </motion.h1>

        {/* WebGL scene (or 2.5D fallback) */}
        <div className={cn("absolute inset-0 transition-[opacity,transform] duration-[1600ms] ease-[var(--ease-vault)]", ready || tier === "none" ? "scale-100 opacity-100" : "scale-[1.04] opacity-0")}>
          {tier === "none" ? (
            <FallbackBox progress={p} images={fallbackImages} />
          ) : tier ? (
            <VaultScene progress={p} tier={tier} cardTarget={cardTarget} active={active} reducedMotion={reduce} onReady={onReady} />
          ) : null}
        </div>

        {/* Loader */}
        <div
          aria-hidden={ready}
          className={cn(
            "pointer-events-none absolute left-1/2 top-1/2 flex -translate-x-1/2 -translate-y-1/2 flex-col items-center gap-3 transition-opacity duration-700",
            ready || tier === "none" ? "opacity-0" : "opacity-100",
          )}
        >
          <span className="label-sm text-steel">Opening the vault</span>
          <span className="relative block h-px w-24 overflow-hidden bg-white/10">
            <span className="absolute inset-y-0 left-0 w-1/3 bg-white/60" style={{ animation: "loader-slide 1.4s var(--ease-soft) infinite" }} />
          </span>
        </div>

        {/* Stage 1 UI */}
        <motion.div className="absolute inset-x-0 top-0 px-5 pt-20 md:px-10 md:pt-28" style={{ opacity: uiOpacity, y: uiY }}>
          <div className="flex items-start justify-between">
            <div>
              <p className="label text-bone/90">{hero.eyebrow}</p>
              <p className="label-sm mt-2 hidden text-steel md:block">N° 001 — Est. {foundedYear}</p>
            </div>
            <div className="hidden text-right md:block">
              <p className="label-sm text-steel">{collectionLabel}</p>
              <p className="label-sm mt-2 text-steel">Curated objects</p>
            </div>
          </div>
        </motion.div>
        <motion.div className="absolute inset-x-0 bottom-0 px-5 pb-5 md:px-10 md:pb-10" style={{ opacity: uiOpacity, y: uiY }}>
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between md:gap-6">
            <p className="max-w-[300px] text-xs leading-relaxed text-bone/70 md:text-sm">{hero.subtitle}</p>
            <div className="flex items-center gap-2 md:gap-3">
              <Magnetic>
                <VaultLink href="#collection" variant="solid" arrow className="h-11 px-3 text-[10px] tracking-[0.12em] md:h-12 md:px-7 md:text-[11px] md:tracking-[0.16em]" onClick={(e) => { e.preventDefault(); scrollToTarget("#collection"); }}>
                  {hero.ctaPrimary}
                </VaultLink>
              </Magnetic>
              <Magnetic>
                <VaultLink href="/shop" variant="outline" className="h-11 px-3 text-[10px] tracking-[0.12em] md:h-12 md:px-7 md:text-[11px] md:tracking-[0.16em]">
                  {hero.ctaSecondary}
                </VaultLink>
              </Magnetic>
            </div>
          </div>
        </motion.div>
        <motion.button
          type="button"
          onClick={() => scrollToTarget(window.innerHeight * 1.2)}
          className="absolute bottom-8 left-1/2 hidden -translate-x-1/2 flex-col items-center gap-3 md:flex"
          style={{ opacity: scrollCue }}
        >
          <span className="label-sm text-bone/70">{hero.scrollLabel}</span>
          <span className="relative block h-12 w-px overflow-hidden bg-white/15">
            <span className="absolute inset-0 animate-scroll-line bg-bone" />
          </span>
        </motion.button>

        {/* Stage 2: annotations around the object */}
        <motion.div aria-hidden className="pointer-events-none absolute inset-0" style={{ opacity: annotations }}>
          {hero.annotations.slice(0, 4).map((a, i) => {
            const pos = [
              "left-[6%] top-[30%] md:left-[14%] md:top-[30%]",
              "right-[6%] top-[24%] text-right md:right-[14%] md:top-[26%]",
              "left-[6%] bottom-[24%] md:left-[16%] md:bottom-[24%]",
              "right-[6%] bottom-[28%] text-right md:right-[16%] md:bottom-[26%]",
            ][i];
            return (
              <div key={a} className={cn("absolute max-w-[42vw]", pos)}>
                <p className="label-sm text-steel">0{i + 1}</p>
                <p className="label mt-2 text-bone/90">{a}</p>
                <span className={cn("mt-3 block h-px w-16 chrome-line opacity-70 md:w-24", i % 2 === 1 && "ml-auto")} />
              </div>
            );
          })}
        </motion.div>

        {/* Stage 3 */}
        <motion.div className="pointer-events-none absolute inset-x-0 top-[13svh] px-5 text-center" style={{ opacity: inside }}>
          <p className="label text-steel">Inside the vault</p>
          <p className="display-md mx-auto mt-4 max-w-3xl">
            {String(objectCount).padStart(2, "0")} objects. One association.
          </p>
        </motion.div>

        {/* Stage 4 */}
        {heroProduct && (
          <motion.div className="pointer-events-none absolute bottom-[10svh] left-5 max-w-sm md:left-10" style={{ opacity: focus }}>
            <p className="label-sm text-steel">N° 01 — {heroProduct.category?.name}</p>
            <p className="display-md mt-3">{heroProduct.name}</p>
            <p className="label mt-3 text-bone/60">{heroProduct.label ?? "Archive piece"}</p>
          </motion.div>
        )}

        {/* Stage 5: the object becomes the first product card */}
        <motion.div className="pointer-events-none absolute inset-0 flex items-start px-5 pt-[16svh] md:px-10 md:pt-[18svh]" style={{ opacity: outro }}>
          <div className="pointer-events-auto max-w-xl">
            <p className="label text-steel">The collection</p>
            <p className="display-lg mt-5">Begins<br />here.</p>
            <div className="mt-8 hidden md:block">
              <VaultLink href="#collection" variant="ghost" arrow onClick={(e) => { e.preventDefault(); scrollToTarget("#collection"); }}>
                Explore the collection
              </VaultLink>
            </div>
          </div>
        </motion.div>
        {heroProduct && (
          <motion.div
            className="absolute bottom-[6svh] right-5 w-[46vw] max-w-[340px] md:bottom-auto md:right-[9vw] md:top-1/2 md:w-[24vw] md:-translate-y-1/2"
            style={{ opacity: cardOpacity, filter: cardBlur, scale: cardScale }}
          >
            <Link href={`/product/${heroProduct.slug}`} className="group block" data-cursor="view" data-cursor-label="View">
              <div ref={cardImage} className="relative aspect-[4/5] overflow-hidden bg-graphite-2">
                {heroImage && (
                  <Image src={heroImage} alt={heroProduct.name} fill sizes="(max-width: 768px) 46vw, 24vw" className="object-contain p-[8%] transition-transform duration-700 group-hover:scale-105" />
                )}
                <span className="label-sm absolute left-3 top-3 text-bone/60">01</span>
                {heroProduct.label && <span className="label-sm absolute right-3 top-3 bg-bone px-2 py-1 text-ink">{heroProduct.label}</span>}
              </div>
              <div className="mt-4 flex items-start justify-between gap-3">
                <div>
                  <p className="text-[13px] uppercase tracking-[0.08em]">{heroProduct.name}</p>
                  <p className="label-sm mt-1.5 text-steel">{heroProduct.category?.name}</p>
                </div>
                <p className="text-[13px] tabular-nums">{formatPrice(heroProduct.effectivePrice)}</p>
              </div>
              <p className="label-sm mt-4 flex items-center gap-2 text-bone/80">
                View product <span className="transition-transform group-hover:translate-x-1">→</span>
              </p>
            </Link>
          </motion.div>
        )}

        {/* Stage rail */}
        <nav aria-label="Etapas" className="absolute right-5 top-1/2 hidden -translate-y-1/2 flex-col gap-4 lg:flex">
          {STAGE_LABELS.map((label, i) => (
            <button
              key={label}
              type="button"
              onClick={() => {
                const el = section.current;
                if (!el) return;
                const top = el.getBoundingClientRect().top + window.scrollY;
                const span = el.offsetHeight - window.innerHeight;
                scrollToTarget(top + span * (STAGE_BOUNDS[i] + 0.02));
              }}
              className={cn("group flex items-center justify-end gap-3 transition-opacity duration-500", stage === i ? "opacity-100" : "opacity-35 hover:opacity-70")}
            >
              <span className="label-sm">{label}</span>
              <span className={cn("block h-px bg-bone transition-all duration-500", stage === i ? "w-8" : "w-3")} />
            </button>
          ))}
        </nav>

      </div>
    </section>
  );
}
