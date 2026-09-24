"use client";

import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame, useThree, type ThreeEvent } from "@react-three/fiber";
import {
  Center,
  ContactShadows,
  Environment,
  Float,
  Lightformer,
  RoundedBox,
  Text3D,
} from "@react-three/drei";
import * as THREE from "three";

const FONT = "/fonts/plex-mono-bold.typeface.json";

const COLORS = {
  brand: "#2b46ff",
  ink: "#0b0b0c",
  paper: "#fbfaf7",
  bgSoft: "#eeeae1",
};

/** Bumped by the RUN key; every glyph watches it and does a full spin. */
type SpinBus = { tick: number };

function useCursor(active: boolean) {
  useEffect(() => {
    document.body.style.cursor = active ? "pointer" : "";
    return () => {
      document.body.style.cursor = "";
    };
  }, [active]);
}

type GlyphProps = {
  char: string;
  position: [number, number, number];
  rotation?: [number, number, number];
  size: number;
  depth: number;
  material: "brand" | "chrome" | "glass" | "ceramic";
  bus: SpinBus;
  floatSpeed?: number;
};

function GlyphMaterial({ kind, hovered }: { kind: GlyphProps["material"]; hovered: boolean }) {
  switch (kind) {
    case "brand":
      return (
        <meshPhysicalMaterial
          color={COLORS.brand}
          roughness={0.18}
          metalness={0.05}
          clearcoat={1}
          clearcoatRoughness={0.08}
          emissive={COLORS.brand}
          emissiveIntensity={hovered ? 0.35 : 0.08}
        />
      );
    case "chrome":
      return (
        <meshPhysicalMaterial
          color={hovered ? "#1d2140" : COLORS.ink}
          roughness={0.16}
          metalness={1}
          clearcoat={0.6}
        />
      );
    case "glass":
      return (
        <meshPhysicalMaterial
          color="#dfe4ff"
          roughness={0.08}
          metalness={0}
          transmission={1}
          thickness={0.6}
          ior={1.45}
          attenuationColor={COLORS.brand}
          attenuationDistance={2.2}
          clearcoat={1}
        />
      );
    case "ceramic":
    default:
      return (
        <meshPhysicalMaterial
          color={hovered ? "#ffffff" : COLORS.paper}
          roughness={0.32}
          metalness={0}
          clearcoat={0.8}
          clearcoatRoughness={0.2}
        />
      );
  }
}

function Glyph({ char, position, rotation = [0, 0, 0], size, depth, material, bus, floatSpeed = 1.4 }: GlyphProps) {
  const spin = useRef<THREE.Group>(null);
  const target = useRef(0);
  const seenTick = useRef(bus.tick);
  const [hovered, setHovered] = useState(false);
  useCursor(hovered);

  useFrame((_, delta) => {
    if (!spin.current) return;
    if (bus.tick !== seenTick.current) {
      seenTick.current = bus.tick;
      target.current += Math.PI * 2;
    }
    spin.current.rotation.y = THREE.MathUtils.damp(spin.current.rotation.y, target.current, 3.2, delta);
    const s = hovered ? 1.08 : 1;
    spin.current.scale.setScalar(THREE.MathUtils.damp(spin.current.scale.x, s, 8, delta));
  });

  const onClick = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    target.current += Math.PI * 2;
  };

  return (
    <Float speed={floatSpeed} rotationIntensity={0.35} floatIntensity={0.8}>
      <group position={position} rotation={rotation}>
        <group
          ref={spin}
          onClick={onClick}
          onPointerOver={(e) => {
            e.stopPropagation();
            setHovered(true);
          }}
          onPointerOut={() => setHovered(false)}
        >
          <Center>
            <Text3D
              font={FONT}
              size={size}
              height={depth}
              curveSegments={10}
              bevelEnabled
              bevelThickness={depth * 0.16}
              bevelSize={size * 0.012}
              bevelSegments={5}
              castShadow
            >
              {char}
              <GlyphMaterial kind={material} hovered={hovered} />
            </Text3D>
          </Center>
        </group>
      </group>
    </Float>
  );
}

type KeyProps = {
  label: string;
  position: [number, number, number];
  width?: number;
  accent?: boolean;
  onPress?: () => void;
};

function Keycap({ label, position, width = 1, accent = false, onPress }: KeyProps) {
  const cap = useRef<THREE.Group>(null);
  const [pressed, setPressed] = useState(false);
  const [hovered, setHovered] = useState(false);
  useCursor(hovered);

  useFrame((_, delta) => {
    if (!cap.current) return;
    const y = pressed ? -0.14 : hovered ? 0.04 : 0;
    cap.current.position.y = THREE.MathUtils.damp(cap.current.position.y, y, 18, delta);
  });

  const press = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    setPressed(true);
    onPress?.();
  };

  const release = () => setPressed(false);

  const capColor = accent ? COLORS.brand : COLORS.paper;
  const legendColor = accent ? COLORS.paper : COLORS.ink;
  const w = 0.9 * width + 0.12 * (width - 1);

  return (
    <group position={position}>
      {/* Housing the cap sinks into. */}
      <RoundedBox args={[w + 0.08, 0.2, 0.98]} radius={0.06} smoothness={4} position={[0, -0.22, 0]} receiveShadow>
        <meshStandardMaterial color="#d9d4c7" roughness={0.7} />
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
        <RoundedBox args={[w, 0.34, 0.9]} radius={0.12} smoothness={6} castShadow receiveShadow>
          <meshPhysicalMaterial
            color={capColor}
            roughness={accent ? 0.22 : 0.38}
            clearcoat={0.7}
            clearcoatRoughness={0.25}
            emissive={accent ? COLORS.brand : "#000000"}
            emissiveIntensity={accent && hovered ? 0.25 : 0}
          />
        </RoundedBox>
        <group position={[0, 0.172, 0.02]} rotation={[-Math.PI / 2, 0, 0]}>
          <Center>
            <Text3D font={FONT} size={label.length > 1 ? 0.2 : 0.32} height={0.02} curveSegments={6}>
              {label}
              <meshStandardMaterial color={legendColor} roughness={0.5} />
            </Text3D>
          </Center>
        </group>
      </group>
    </group>
  );
}

function Keyboard({ onRun, position }: { onRun: () => void; position: [number, number, number] }) {
  const keys = ["C", "O", "D", "E"];
  return (
    <group position={position} rotation={[0.62, -0.28, 0.06]}>
      {keys.map((k, i) => (
        <Keycap key={k} label={k} position={[-2.05 + i * 1.02, 0, 0]} />
      ))}
      <Keycap label="RUN" width={1.6} accent position={[2.34, 0, 0]} onPress={onRun} />
    </group>
  );
}

/** Tilts the whole composition toward the pointer, like looking around it. */
function Rig({ children }: { children: React.ReactNode }) {
  const group = useRef<THREE.Group>(null);
  const { viewport } = useThree();
  const scale = Math.min(1.12, viewport.width / 7.6);

  useFrame((state, delta) => {
    if (!group.current) return;
    const { x, y } = state.pointer;
    group.current.rotation.y = THREE.MathUtils.damp(group.current.rotation.y, x * 0.32, 3, delta);
    group.current.rotation.x = THREE.MathUtils.damp(group.current.rotation.x, -y * 0.18, 3, delta);
  });

  return (
    <group ref={group} scale={scale}>
      {children}
    </group>
  );
}

function Studio() {
  return (
    <Environment resolution={256}>
      <group rotation={[-Math.PI / 3, 0, 1]}>
        <Lightformer form="circle" intensity={4} rotation-x={Math.PI / 2} position={[0, 5, -9]} scale={2} />
        <Lightformer form="circle" intensity={2} rotation-y={Math.PI / 2} position={[-5, 1, -1]} scale={2} />
        <Lightformer form="circle" intensity={2} rotation-y={Math.PI / 2} position={[-5, -1, -1]} scale={2} />
        <Lightformer form="circle" intensity={2} rotation-y={-Math.PI / 2} position={[10, 1, 0]} scale={8} />
        <Lightformer form="rect" intensity={1.2} color={COLORS.brand} rotation-y={-Math.PI / 2} position={[-8, 0, 4]} scale={[10, 2, 1]} />
      </group>
    </Environment>
  );
}

function Scene() {
  const [bus, setBus] = useState<SpinBus>({ tick: 0 });
  const run = () => setBus((b) => ({ tick: b.tick + 1 }));

  const glyphs = useMemo<Omit<GlyphProps, "bus">[]>(
    () => [
      { char: "</>", position: [0.1, 0.95, 0], rotation: [0.08, -0.22, 0.04], size: 1.45, depth: 0.42, material: "brand", floatSpeed: 1.6 },
      { char: "{", position: [-3.05, 0.85, -0.5], rotation: [0, 0.28, 0.1], size: 1.7, depth: 0.34, material: "chrome", floatSpeed: 1.2 },
      { char: "}", position: [3.15, 0.7, -0.6], rotation: [0, -0.3, -0.08], size: 1.7, depth: 0.34, material: "chrome", floatSpeed: 1.3 },
      { char: "#", position: [-1.75, 2.55, -1.2], rotation: [0.15, 0.2, 0.18], size: 0.95, depth: 0.42, material: "glass", floatSpeed: 2 },
      { char: "=>", position: [2.05, 2.55, -1.3], rotation: [0.12, -0.25, -0.1], size: 0.8, depth: 0.3, material: "ceramic", floatSpeed: 1.8 },
      { char: "()", position: [-2.7, -0.55, 0.7], rotation: [-0.1, 0.25, -0.15], size: 0.7, depth: 0.28, material: "ceramic", floatSpeed: 2.2 },
    ],
    []
  );

  return (
    <>
      <ambientLight intensity={0.35} />
      <directionalLight position={[4, 8, 6]} intensity={1.6} castShadow shadow-mapSize={[1024, 1024]} />
      <Studio />
      <Rig>
        {glyphs.map((g) => (
          <Glyph key={g.char} {...g} bus={bus} />
        ))}
        <Keyboard onRun={run} position={[0, -1.35, 1]} />
      </Rig>
      <ContactShadows position={[0, -2.25, 0]} opacity={0.34} scale={14} blur={2.4} far={4} color={COLORS.ink} />
    </>
  );
}

export default function CodeScene() {
  const wrap = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(true);

  // Stop rendering frames while the hero is scrolled out of view.
  useEffect(() => {
    const el = wrap.current;
    if (!el) return;
    const io = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting), { threshold: 0 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div ref={wrap} className="h-full w-full" style={{ touchAction: "pan-y" }}>
      <Canvas
        shadows={{ type: THREE.PCFShadowMap }}
        dpr={[1, 1.75]}
        frameloop={inView ? "always" : "never"}
        camera={{ position: [0, 0.5, 9.2], fov: 36 }}
        gl={{ antialias: true, alpha: true, toneMapping: THREE.ACESFilmicToneMapping }}
      >
        <Suspense fallback={null}>
          <Scene />
        </Suspense>
      </Canvas>
    </div>
  );
}
