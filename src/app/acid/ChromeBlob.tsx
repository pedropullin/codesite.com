"use client";

import { useEffect, useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Environment, Float, Lightformer, MeshDistortMaterial } from "@react-three/drei";
import * as THREE from "three";

/** A mercury-like blob that ripples, follows the pointer and twists as the page scrolls. */
function Blob() {
  const mesh = useRef<THREE.Mesh>(null);
  useFrame((state, delta) => {
    const m = mesh.current;
    if (!m) return;
    const p = Math.min(1, window.scrollY / window.innerHeight);
    m.rotation.y = THREE.MathUtils.damp(m.rotation.y, state.pointer.x * 0.8 + p * 2.4, 3, delta);
    m.rotation.x = THREE.MathUtils.damp(m.rotation.x, -state.pointer.y * 0.5 + p * 0.8, 3, delta);
    m.scale.setScalar(THREE.MathUtils.damp(m.scale.x, 1 + p * 0.25, 3, delta));
  });
  return (
    <Float speed={1.6} rotationIntensity={0.6} floatIntensity={1.2}>
      <mesh ref={mesh}>
        <icosahedronGeometry args={[1.55, 48]} />
        <MeshDistortMaterial color="#ffffff" metalness={1} roughness={0.12} distort={0.42} speed={1.8} envMapIntensity={1.4} />
      </mesh>
    </Float>
  );
}

/** Studio in the brand colours: the chrome reflects blue, light blue and white strips. */
function NeonStudio() {
  return (
    <Environment resolution={256}>
      <color attach="background" args={["#000000"]} />
      <Lightformer form="rect" intensity={5} color="#2b46ff" position={[-5, 2, 2]} rotation-y={Math.PI / 2} scale={[8, 2, 1]} />
      <Lightformer form="rect" intensity={5} color="#7b9bff" position={[5, -1, 2]} rotation-y={-Math.PI / 2} scale={[8, 2, 1]} />
      <Lightformer form="rect" intensity={4} color="#9fd2ff" position={[0, 5, -3]} rotation-x={Math.PI / 2} scale={[10, 2, 1]} />
      <Lightformer form="circle" intensity={6} color="#ffffff" position={[2, 2, 6]} scale={2} />
      <Lightformer form="rect" intensity={2} color="#ffffff" position={[0, -5, 0]} rotation-x={-Math.PI / 2} scale={[10, 10, 1]} />
      <Lightformer form="ring" intensity={3} color="#2b46ff" position={[-3, -3, 4]} scale={3} />
      <Lightformer form="ring" intensity={3} color="#ffffff" position={[3, 3, -4]} scale={4} />
      <Lightformer form="circle" intensity={2} color="#4f86ff" position={[-4, 4, 3]} scale={3} />
    </Environment>
  );
}

export default function ChromeBlob() {
  const wrap = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(true);
  useEffect(() => {
    const el = wrap.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setInView(e.isIntersecting));
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div ref={wrap} className="h-full w-full" aria-hidden>
      <Canvas
        dpr={[1, 1.6]}
        frameloop={inView ? "always" : "never"}
        camera={{ position: [0, 0, 5.2], fov: 40 }}
        gl={{ antialias: true, alpha: true, toneMapping: THREE.ACESFilmicToneMapping }}
      >
        <NeonStudio />
        <Blob />
      </Canvas>
    </div>
  );
}
