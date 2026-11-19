"use client";

import { Suspense, useRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Float } from "@react-three/drei";
import * as THREE from "three";
import { GlyphMesh, Keycap, Studio, useInView } from "./parts";
import { whatsappLink } from "@/lib/site";

/** The keys tilt with the pointer and with how far the section has scrolled in. */
function Board() {
  const group = useRef<THREE.Group>(null);
  const { viewport, size } = useThree();
  const scale = Math.min(1, viewport.width / 7.4);

  useFrame((state, delta) => {
    const g = group.current;
    if (!g) return;
    const rect = (state.gl.domElement.parentElement as HTMLElement).getBoundingClientRect();
    // 0 when the canvas enters at the bottom, 1 when it reaches the middle of the screen.
    const p = THREE.MathUtils.clamp((window.innerHeight - rect.top) / (window.innerHeight * 0.6), 0, 1);
    const { x, y } = state.pointer;
    g.rotation.x = THREE.MathUtils.damp(g.rotation.x, 0.62 + (1 - p) * 0.9 - y * 0.12, 5, delta);
    g.rotation.y = THREE.MathUtils.damp(g.rotation.y, -0.18 + x * 0.3 - (1 - p) * 0.4, 5, delta);
    g.position.y = THREE.MathUtils.damp(g.position.y, -0.2 - (1 - p) * 1.6, 5, delta);
  });

  const run = () => window.open(whatsappLink(), "_blank", "noopener,noreferrer");
  const keys = ["C", "O", "D", "E"];
  const narrow = size.width < 640;

  return (
    <group ref={group} scale={scale * (narrow ? 1.15 : 1)}>
      {keys.map((k, i) => (
        <Keycap key={k} label={k} position={[-2.05 + i * 1.02, 0, 0]} />
      ))}
      <Keycap label="RUN" width={1.6} accent position={[2.34, 0, 0]} onPress={run} />
      <Float speed={1.6} floatIntensity={0.8} rotationIntensity={0.5}>
        <group position={[2.4, 1.3, -0.4]} rotation={[-0.5, -0.4, 0.2]}>
          <GlyphMesh char=">_" size={0.6} depth={0.25} kind="brand" />
        </group>
      </Float>
    </group>
  );
}

export default function RunKeys() {
  const [wrap, inView] = useInView<HTMLDivElement>();

  return (
    <div ref={wrap} className="h-full w-full" style={{ touchAction: "pan-y" }}>
      <Canvas
        dpr={[1, 1.5]}
        frameloop={inView ? "always" : "never"}
        camera={{ position: [0, 0.6, 7], fov: 34 }}
        gl={{ antialias: true, alpha: true, toneMapping: THREE.ACESFilmicToneMapping }}
      >
        <ambientLight intensity={0.3} />
        <directionalLight position={[3, 8, 5]} intensity={1.6} />
        <pointLight position={[4, 1, 3]} intensity={30} color="#2b46ff" />
        <Suspense fallback={null}>
          <Studio />
          <Board />
        </Suspense>
      </Canvas>
    </div>
  );
}
