"use client";

import { useEffect, useRef, useState } from "react";
import { useFrame, type ThreeEvent } from "@react-three/fiber";
import { Center, Environment, Lightformer, RoundedBox, Text3D } from "@react-three/drei";
import * as THREE from "three";

export const FONT = "/fonts/plex-mono-bold.typeface.json";

export const COLORS = {
  brand: "#2b46ff",
  brandLight: "#6f97ff",
  ink: "#0b0b0c",
  paper: "#f2f2f4",
};

export function useCursor(active: boolean) {
  useEffect(() => {
    document.body.style.cursor = active ? "pointer" : "";
    return () => {
      document.body.style.cursor = "";
    };
  }, [active]);
}

export type GlyphMaterialKind = "brand" | "chrome" | "glass" | "ceramic";

export function GlyphMaterial({ kind, hovered = false }: { kind: GlyphMaterialKind; hovered?: boolean }) {
  switch (kind) {
    case "brand":
      return (
        <meshPhysicalMaterial
          color={COLORS.brand}
          roughness={0.16}
          metalness={0.1}
          clearcoat={1}
          clearcoatRoughness={0.06}
          emissive={COLORS.brand}
          emissiveIntensity={hovered ? 0.5 : 0.22}
        />
      );
    case "chrome":
      return <meshPhysicalMaterial color="#e9ecf5" roughness={0.1} metalness={1} clearcoat={0.6} />;
    case "glass":
      return (
        // Frosted look without transmission, which costs a whole extra render pass.
        <meshStandardMaterial color="#9fb6ff" roughness={0.18} metalness={0.35} />
      );
    case "ceramic":
    default:
      return (
        <meshPhysicalMaterial
          color={hovered ? "#ffffff" : COLORS.paper}
          roughness={0.3}
          clearcoat={0.8}
          clearcoatRoughness={0.2}
        />
      );
  }
}

/** One extruded, bevelled code character. */
export function GlyphMesh({ char, size, depth, kind }: { char: string; size: number; depth: number; kind: GlyphMaterialKind }) {
  return (
    <Center>
      <Text3D
        font={FONT}
        size={size}
        height={depth}
        curveSegments={5}
        bevelEnabled
        bevelThickness={depth * 0.16}
        bevelSize={size * 0.014}
        bevelSegments={2}
      >
        {char}
        <GlyphMaterial kind={kind} />
      </Text3D>
    </Center>
  );
}

/** A dark studio: soft white key lights and a strip of brand blue for the reflections. */
export function Studio() {
  return (
    <Environment resolution={128}>
      <group rotation={[-Math.PI / 3, 0, 1]}>
        <Lightformer form="circle" intensity={3} rotation-x={Math.PI / 2} position={[0, 5, -9]} scale={2} />
        <Lightformer form="circle" intensity={1.6} rotation-y={Math.PI / 2} position={[-5, 1, -1]} scale={2} />
        <Lightformer form="rect" intensity={1.4} rotation-y={-Math.PI / 2} position={[10, 1, 0]} scale={[8, 3, 1]} />
        <Lightformer form="rect" intensity={3} color={COLORS.brand} rotation-y={Math.PI / 2} position={[-8, 0, 4]} scale={[10, 2, 1]} />
        <Lightformer form="rect" intensity={2} color="#9fd2ff" rotation-x={-Math.PI / 2} position={[0, -6, 2]} scale={[12, 2, 1]} />
        <Lightformer form="rect" intensity={1.6} position={[0, 2, 9]} scale={[14, 4, 1]} />
        <Lightformer form="ring" intensity={2.5} position={[4, 4, 6]} scale={3} />
      </group>
    </Environment>
  );
}

type KeyProps = {
  label: string;
  position: [number, number, number];
  width?: number;
  accent?: boolean;
  onPress?: () => void;
};

/** A pressable keycap sitting in its housing. */
export function Keycap({ label, position, width = 1, accent = false, onPress }: KeyProps) {
  const cap = useRef<THREE.Group>(null);
  const [pressed, setPressed] = useState(false);
  const [hovered, setHovered] = useState(false);
  useCursor(hovered);

  useFrame((_, delta) => {
    if (!cap.current) return;
    const y = pressed ? -0.14 : hovered ? 0.05 : 0;
    cap.current.position.y = THREE.MathUtils.damp(cap.current.position.y, y, 18, delta);
  });

  const press = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    setPressed(true);
    onPress?.();
  };
  const release = () => setPressed(false);
  const w = 0.9 * width + 0.12 * (width - 1);

  return (
    <group position={position}>
      <RoundedBox args={[w + 0.08, 0.2, 0.98]} radius={0.06} smoothness={4} position={[0, -0.22, 0]}>
        <meshStandardMaterial color="#1a1b20" roughness={0.6} metalness={0.3} />
      </RoundedBox>
      <group
        ref={cap}
        onPointerDown={press}
        onPointerUp={release}
        onPointerOut={() => {
          release();
          setHovered(false);
        }}
        onPointerOver={(e) => {
          e.stopPropagation();
          setHovered(true);
        }}
      >
        <RoundedBox args={[w, 0.34, 0.9]} radius={0.12} smoothness={6}>
          <meshPhysicalMaterial
            color={accent ? COLORS.brand : "#e6e6e6"}
            roughness={accent ? 0.2 : 0.36}
            clearcoat={0.7}
            clearcoatRoughness={0.25}
            emissive={accent ? COLORS.brand : "#000000"}
            emissiveIntensity={accent ? (hovered ? 0.6 : 0.3) : 0}
          />
        </RoundedBox>
        <group position={[0, 0.172, 0.02]} rotation={[-Math.PI / 2, 0, 0]}>
          <Center>
            <Text3D font={FONT} size={label.length > 1 ? 0.2 : 0.32} height={0.02} curveSegments={6}>
              {label}
              <meshStandardMaterial color={accent ? "#ffffff" : "#2f3031"} roughness={0.5} />
            </Text3D>
          </Center>
        </group>
      </group>
    </group>
  );
}

/** Pauses rendering while the canvas is off screen. */
export function useInView<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting), { rootMargin: "200px 0px" });
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return [ref, inView] as const;
}
