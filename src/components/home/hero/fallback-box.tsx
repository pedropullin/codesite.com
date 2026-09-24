"use client";

import Image from "next/image";
import { motion, useTransform, type MotionValue } from "motion/react";
import { easeInOut, seg, stages } from "./stages";

const FACE = "absolute left-1/2 top-1/2 [backface-visibility:hidden]";

/**
 * 2.5D fallback for devices without adequate WebGL: a CSS 3D box driven by the
 * same scroll narrative, with product renders floating in layered depth.
 */
export function FallbackBox({ progress, images }: { progress: MotionValue<number>; images: string[] }) {
  const ry = useTransform(progress, (p) => {
    const { s2, s3, s5 } = stages(p);
    return -24 + easeInOut(s2) * 90 + easeInOut(s3) * 90 + easeInOut(s5) * 30;
  });
  const scale = useTransform(progress, (p) => {
    const { s2, s3, s4, s5 } = stages(p);
    return (1 + 0.1 * easeInOut(s2) - 0.1 * easeInOut(s3)) * (1 - 0.3 * easeInOut(s4)) * (1 - 0.35 * easeInOut(s5));
  });
  const x = useTransform(progress, (p) => `${-26 * easeInOut(stages(p).s5)}vw`);
  const y = useTransform(progress, (p) => `${14 * easeInOut(stages(p).s4) - 4 * easeInOut(stages(p).s5)}vh`);
  const lid = useTransform(progress, (p) => {
    const { s3, s5 } = stages(p);
    return -118 * easeInOut(seg(s3, 0.1, 0.6)) * (1 - seg(s5, 0, 0.5));
  });
  const W = "min(46vw, 420px)";
  const D = "calc(min(46vw, 420px) * 0.7)";
  const H = "calc(min(46vw, 420px) * 0.34)";

  return (
    <div className="absolute inset-0 flex items-center justify-center [perspective:1400px]">
      <motion.div style={{ x, y, scale }} className="relative [transform-style:preserve-3d]">
        <motion.div style={{ rotateX: -22, rotateY: ry }} className="relative [transform-style:preserve-3d]">
          {/* walls */}
          {[0, 90, 180, 270].map((deg, i) => {
            const wide = i % 2 === 0;
            return (
              <div
                key={deg}
                className={FACE}
                style={{
                  width: wide ? W : D,
                  height: H,
                  transform: `translate(-50%, -50%) rotateY(${deg}deg) translateZ(calc(${wide ? D : W} / 2))`,
                  background: `linear-gradient(180deg, #1b1b1d 0%, #0b0b0c 70%, #070707 100%)`,
                  boxShadow: "inset 0 1px 0 rgba(255,255,255,0.08)",
                }}
              >
                <div className="absolute inset-x-0 top-[7%] h-px chrome-line opacity-70" />
                {deg === 0 && <div className="absolute left-1/2 top-0 h-[22%] w-[18%] -translate-x-1/2 chrome-line opacity-80" />}
              </div>
            );
          })}
          {/* floor */}
          <div className={FACE} style={{ width: W, height: D, transform: `translate(-50%, -50%) rotateX(90deg) translateZ(calc(${H} / -2))`, background: "#050505" }} />
          {/* interior */}
          <div className={FACE} style={{ width: W, height: D, transform: `translate(-50%, -50%) rotateX(90deg) translateZ(calc(${H} / -2 + 2px))`, background: "#1a1a1c" }} />
          {/* lid, hinged at the back edge */}
          <motion.div
            className="absolute left-1/2 top-1/2 [transform-style:preserve-3d]"
            style={{ width: 0, height: 0, transform: `translateY(calc(${H} / -2)) translateZ(calc(${D} / -2))` }}
          >
            <motion.div className="[transform-style:preserve-3d]" style={{ rotateX: lid, transformOrigin: "0 0" }}>
              <div
                className="absolute flex items-center justify-center"
                style={{
                  width: W,
                  height: D,
                  transform: `translate(-50%, 0) rotateX(90deg)`,
                  transformOrigin: "50% 0",
                  background: "radial-gradient(ellipse at 40% 30%, #222225 0%, #0c0c0d 65%)",
                  boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.06)",
                }}
              >
                <div className="pointer-events-none absolute inset-[7%] border border-white/10" />
                <div className="text-center text-white/25 [text-shadow:0_1px_0_rgba(255,255,255,0.12),0_-1px_0_rgba(0,0,0,0.9)]">
                  <p className="font-display text-[clamp(1.4rem,3.4vw,2.6rem)] tracking-[0.42em]">VAULT</p>
                  <p className="font-display mt-1 text-[clamp(0.45rem,1vw,0.7rem)] tracking-[0.62em]">ASSOCIATION</p>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </motion.div>
        <div className="absolute left-1/2 top-[calc(100%+40px)] h-10 w-[120%] -translate-x-1/2 rounded-[100%] bg-black/70 blur-2xl" />
      </motion.div>

      {images.slice(0, 4).map((src, i) => (
        <FloatingImage key={src} src={src} i={i} progress={progress} />
      ))}
    </div>
  );
}

const SLOTS = [
  { x: 0, y: -26, z: 120 },
  { x: -30, y: -12, z: 40 },
  { x: 30, y: -10, z: 60 },
  { x: -18, y: 22, z: 0 },
];

function FloatingImage({ src, i, progress }: { src: string; i: number; progress: MotionValue<number> }) {
  const slot = SLOTS[i];
  const opacity = useTransform(progress, (p) => {
    const { s3, s4, s5 } = stages(p);
    const rise = seg(s3, 0.35 + i * 0.08, 0.85);
    if (i === 0) return rise * (1 - seg(s5, 0.45, 0.85));
    return rise * (1 - seg(s4, 0.1, 0.7));
  });
  const x = useTransform(progress, (p) => {
    const { s3, s4, s5 } = stages(p);
    const base = slot.x * easeInOut(seg(s3, 0.35, 0.9));
    if (i === 0) return `${base + 22 * easeInOut(seg(s5, 0.05, 0.75))}vw`;
    return `${base * (1 + easeInOut(s4) * 0.8)}vw`;
  });
  const y = useTransform(progress, (p) => {
    const { s3, s4 } = stages(p);
    return `${slot.y * easeInOut(seg(s3, 0.35, 0.9)) + (i === 0 ? 10 * easeInOut(s4) : 0)}vh`;
  });
  const scale = useTransform(progress, (p) => {
    const { s3, s4 } = stages(p);
    return 0.3 + 0.7 * easeInOut(seg(s3, 0.35, 0.9)) + (i === 0 ? 0.5 * easeInOut(s4) : 0.6 * easeInOut(s4));
  });
  return (
    <motion.div className="absolute left-1/2 top-1/2 -ml-[9vmin] -mt-[11vmin] h-[22vmin] w-[18vmin]" style={{ x, y, scale, opacity, translateZ: slot.z }}>
      <Image src={src} alt="" fill sizes="20vmin" className="object-contain drop-shadow-[0_30px_40px_rgba(0,0,0,0.6)]" />
    </motion.div>
  );
}
