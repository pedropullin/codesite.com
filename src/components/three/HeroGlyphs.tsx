"use client";

import { Suspense, useRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Float } from "@react-three/drei";
import * as THREE from "three";
import { GlyphMesh, Studio, useInView, type GlyphMaterialKind } from "./parts";

type G = {
  char: string;
  /** Position as fractions of the visible area: x -0.5..0.5, y 0.5 (top)..-0.5 (bottom). */
  at: [number, number];
  z: number;
  size: number;
  depth: number;
  kind: GlyphMaterialKind;
  rot: [number, number, number];
  speed: number;
  /** Phone placement, kept to the edges and gaps so nothing sits on the text; omitted pieces are hidden. */
  mAt?: [number, number];
};

// Braces frame the headline; smaller pieces of code drift around the hero.
const GLYPHS: G[] = [
  { char: "{", at: [-0.4, 0.2], z: -0.5, size: 2.1, depth: 0.5, kind: "chrome", rot: [0, 0.45, 0.08], speed: 1.1, mAt: [-0.5, 0.41] },
  { char: "}", at: [0.4, 0.2], z: -0.5, size: 2.1, depth: 0.5, kind: "chrome", rot: [0, -0.45, -0.08], speed: 1.2, mAt: [0.5, 0.41] },
  { char: "</>", at: [-0.34, -0.12], z: -1.5, size: 1.1, depth: 0.42, kind: "brand", rot: [0.2, 0.5, -0.12], speed: 1.6, mAt: [-0.46, 0.03] },
  { char: "#", at: [0.33, -0.08], z: -1, size: 1.05, depth: 0.45, kind: "glass", rot: [0.3, -0.4, 0.2], speed: 1.9, mAt: [0.47, 0.05] },
  { char: ";", at: [0.3, 0.45], z: -3, size: 0.9, depth: 0.4, kind: "brand", rot: [0.1, -0.3, 0.3], speed: 2.1 },
  { char: "=>", at: [-0.3, 0.45], z: -3.5, size: 0.8, depth: 0.32, kind: "glass", rot: [0.2, 0.3, -0.1], speed: 1.7 },
  { char: "()", at: [0.42, -0.36], z: -2, size: 0.8, depth: 0.3, kind: "chrome", rot: [-0.2, -0.5, 0.15], speed: 2.3 },
  { char: "*", at: [-0.43, -0.4], z: -2.5, size: 1, depth: 0.4, kind: "glass", rot: [0.4, 0.2, 0.3], speed: 2 },
];

function Piece({ g, index }: { g: G; index: number }) {
  const ref = useRef<THREE.Group>(null);
  const { viewport, size } = useThree();
  const narrow = size.width < 768;
  const at = narrow ? g.mAt : g.at;
  const scale = narrow ? 0.5 : 1;

  useFrame((state, delta) => {
    const el = ref.current;
    if (!el) return;
    // Scroll: 0 at the top of the page, 1 once the hero has scrolled away.
    const p = Math.min(1, window.scrollY / Math.max(1, size.height));
    const spread = 1 + p * 0.9;
    if (!at) return;
    const [fx, fy] = at;
    const x = fx * viewport.width * spread;
    const y = fy * viewport.height + p * viewport.height * 0.25;
    el.position.x = THREE.MathUtils.damp(el.position.x, x, 5, delta);
    el.position.y = THREE.MathUtils.damp(el.position.y, y, 5, delta);
    el.position.z = THREE.MathUtils.damp(el.position.z, g.z + p * 3, 5, delta);
    // Each piece turns as you scroll and leans toward the pointer.
    const { x: px, y: py } = state.pointer;
    const turn = p * Math.PI * (index % 2 ? -1.2 : 1.2);
    el.rotation.y = THREE.MathUtils.damp(el.rotation.y, g.rot[1] + turn + px * 0.35, 4, delta);
    el.rotation.x = THREE.MathUtils.damp(el.rotation.x, g.rot[0] - py * 0.25 + p * 0.6, 4, delta);
    el.rotation.z = g.rot[2];
  });

  if (!at) return null;
  return (
    <group ref={ref} scale={scale}>
      <Float speed={g.speed} rotationIntensity={0.4} floatIntensity={0.9}>
        {/* Glass needs an extra render pass; phones get the solid blue instead. */}
        <GlyphMesh char={g.char} size={g.size} depth={g.depth} kind={narrow && g.kind === "glass" ? "brand" : g.kind} />
      </Float>
    </group>
  );
}

export default function HeroGlyphs() {
  const [wrap, inView] = useInView<HTMLDivElement>();

  return (
    <div ref={wrap} className="absolute inset-0" aria-hidden>
      <Canvas
        dpr={typeof window !== "undefined" && window.innerWidth < 768 ? [1, 1.25] : [1, 1.6]}
        frameloop={inView ? "always" : "never"}
        camera={{ position: [0, 0, 12], fov: 38 }}
        gl={{ antialias: true, alpha: true, toneMapping: THREE.ACESFilmicToneMapping }}
        eventSource={typeof document !== "undefined" ? (document.getElementById("topo") ?? undefined) : undefined}
        eventPrefix="client"
        style={{ pointerEvents: "none" }}
      >
        <ambientLight intensity={0.25} />
        <directionalLight position={[4, 8, 6]} intensity={1.4} />
        <pointLight position={[-6, -2, 4]} intensity={40} color="#2b46ff" />
        <Suspense fallback={null}>
          <Studio />
          {GLYPHS.map((g, i) => (
            <Piece key={g.char} g={g} index={i} />
          ))}
        </Suspense>
      </Canvas>
    </div>
  );
}
