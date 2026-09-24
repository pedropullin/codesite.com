"use client";

/* three.js scene objects are an external, mutable system driven imperatively from
   useFrame; the React Compiler immutability rule does not apply to them. */
/* eslint-disable react-hooks/immutability */

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { ContactShadows, PerformanceMonitor } from "@react-three/drei";
import type { MotionValue } from "motion/react";
import { useEffect, useMemo, useRef, useState, type RefObject } from "react";
import * as THREE from "three";
import { createVaultBox } from "@/three/models";
import { createStudioEnvironment } from "@/three/studio";
import { radialTexture, setTextureFontFamily } from "@/three/textures";
import { disposeObject } from "@/three/geometry";
import { buildFloatingItems, setOpacity, type FloatingItem } from "./floating-items";
import { easeInOut, easeOut, lerp, seg, stages } from "./stages";

export type Tier = "high" | "medium" | "low";
export type CardTarget = { x: number; y: number; h: number };

type SceneProps = {
  progress: MotionValue<number>;
  tier: Tier;
  cardTarget: RefObject<CardTarget | null>;
  active: boolean;
  reducedMotion: boolean;
  onReady: () => void;
};

const FLOOR_Y = -0.62;
const MAX_TILT = THREE.MathUtils.degToRad(5);
const FOV = 30;

export default function VaultScene(props: SceneProps) {
  const { tier, active } = props;
  const maxDpr = tier === "high" ? 2.5 : tier === "medium" ? 2 : 1.5;
  const [dpr, setDpr] = useState<number>(() => Math.min(maxDpr, typeof window !== "undefined" ? window.devicePixelRatio : 1));

  return (
    <Canvas
      className="!absolute inset-0"
      dpr={dpr}
      frameloop={active ? "always" : "never"}
      gl={{ antialias: true, alpha: true, powerPreference: "high-performance", stencil: false }}
      camera={{ fov: FOV, position: [0, 1.4, 6.0], near: 0.1, far: 60 }}
      shadows={false}
      onCreated={({ gl }) => {
        gl.toneMapping = THREE.NeutralToneMapping;
        gl.toneMappingExposure = 1.05;
        gl.outputColorSpace = THREE.SRGBColorSpace;
        gl.setClearColor(0x000000, 0);
      }}
      aria-hidden
    >
      <PerformanceMonitor onDecline={() => setDpr(1)} onIncline={() => setDpr(Math.min(maxDpr, window.devicePixelRatio))} flipflops={3} />
      <Studio />
      <Experience {...props} />
    </Canvas>
  );
}

function Studio() {
  const gl = useThree((s) => s.gl);
  const scene = useThree((s) => s.scene);
  useEffect(() => {
    const env = createStudioEnvironment(gl, "dark");
    scene.environment = env;
    scene.environmentIntensity = 1.15;
    return () => {
      scene.environment = null;
      env.dispose();
    };
  }, [gl, scene]);
  return (
    <>
      {/* key */}
      <directionalLight position={[-4, 6, 4]} intensity={1.5} />
      {/* rim — draws the silhouette of matte black against the dark set */}
      <directionalLight position={[5, 3.5, -5]} intensity={3} />
      {/* soft top */}
      <directionalLight position={[0.5, 8, 1]} intensity={0.6} />
    </>
  );
}

function Experience({ progress, tier, cardTarget, reducedMotion, onReady }: SceneProps) {
  const camera = useThree((s) => s.camera) as THREE.PerspectiveCamera;
  const gl = useThree((s) => s.gl);
  const scene = useThree((s) => s.scene);
  const size = useThree((s) => s.size);

  const box = useMemo(() => {
    if (typeof document !== "undefined") {
      const family = getComputedStyle(document.documentElement).getPropertyValue("--font-archivo").trim();
      if (family) setTextureFontFamily(family);
    }
    return createVaultBox({ quality: tier, logoFacing: "back" });
  }, [tier]);
  const items = useMemo(() => buildFloatingItems(tier), [tier]);

  const boxRoot = useRef<THREE.Group>(null);
  const pool = useRef<THREE.Mesh>(null);
  const state = useRef({
    p: 0,
    pointer: { x: 0, y: 0, tx: 0, ty: 0, last: 0 },
    spins: items.map(() => 0),
    velocity: 0,
    lastP: 0,
    lookAt: new THREE.Vector3(0, 0, 0),
  });
  const tmp = useMemo(
    () => ({ v: new THREE.Vector3(), a: new THREE.Vector3(), b: new THREE.Vector3(), start: new THREE.Vector3(0, FLOOR_Y + 0.55, 0) }),
    [],
  );

  // Pointer (desktop) + device orientation (mobile) → gentle tilt.
  useEffect(() => {
    if (reducedMotion) return;
    const s = state.current;
    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      s.pointer.tx = (e.clientX / window.innerWidth) * 2 - 1;
      s.pointer.ty = (e.clientY / window.innerHeight) * 2 - 1;
      s.pointer.last = performance.now();
    };
    let base: { b: number; g: number } | null = null;
    const onOrient = (e: DeviceOrientationEvent) => {
      if (e.beta == null || e.gamma == null) return;
      base ??= { b: e.beta, g: e.gamma };
      s.pointer.tx = THREE.MathUtils.clamp((e.gamma - base.g) / 25, -1, 1);
      s.pointer.ty = THREE.MathUtils.clamp((e.beta - base.b) / 25, -1, 1);
      s.pointer.last = performance.now();
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("deviceorientation", onOrient, { passive: true });
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("deviceorientation", onOrient);
    };
  }, [reducedMotion]);

  // Pre-compile every material (including hidden objects) before revealing.
  useEffect(() => {
    let cancelled = false;
    items.forEach((it) => (it.holder.visible = true));
    const done = () => {
      if (cancelled) return;
      items.forEach((it) => setOpacity(it, 0));
      requestAnimationFrame(() => !cancelled && onReady());
    };
    const renderer = gl as THREE.WebGLRenderer & { compileAsync?: (s: THREE.Object3D, c: THREE.Camera) => Promise<unknown> };
    if (renderer.compileAsync) renderer.compileAsync(scene, camera).then(done, done);
    else {
      renderer.compile(scene, camera);
      done();
    }
    return () => {
      cancelled = true;
    };
  }, [gl, scene, camera, items, onReady]);

  useEffect(
    () => () => {
      disposeObject(box.group);
      items.forEach((it) => disposeObject(it.holder));
    },
    [box, items],
  );

  useFrame((frame, delta) => {
    const dt = Math.min(delta, 1 / 20);
    const s = state.current;
    const t = frame.clock.elapsedTime;

    // Scroll progress, damped for continuity (no dry cuts).
    const target = progress.get();
    s.p = THREE.MathUtils.damp(s.p, target, 5.5, dt);
    s.velocity = THREE.MathUtils.damp(s.velocity, (s.p - s.lastP) / Math.max(dt, 1e-3), 4, dt);
    s.lastP = s.p;
    const p = s.p;
    const { s1, s2, s3, s4, s5 } = stages(p);
    const e2 = easeInOut(s2);
    const e3 = easeInOut(s3);
    const e4 = easeInOut(s4);
    const e5 = easeInOut(s5);

    // Pointer: follow while moving, return slowly when still.
    const idle = performance.now() - s.pointer.last > 1400;
    const px = idle ? 0 : s.pointer.tx;
    const py = idle ? 0 : s.pointer.ty;
    s.pointer.x = THREE.MathUtils.damp(s.pointer.x, px, idle ? 1.1 : 3.2, dt);
    s.pointer.y = THREE.MathUtils.damp(s.pointer.y, py, idle ? 1.1 : 3.2, dt);

    // Responsive framing: narrow screens pull the camera back and tighten the arc.
    const aspect = size.width / Math.max(1, size.height);
    const dolly = aspect < 1.25 ? THREE.MathUtils.clamp(1.35 / aspect, 1, 2.5) : 1;
    const fx = THREE.MathUtils.clamp(aspect / 1.7, 0.42, 1);

    /* ---------------- Camera ---------------- */
    const camPos = tmp.a;
    const look = tmp.b;
    // S1 → S2: lateral move; S3: pull back; S4: travel through; S5: settle.
    camPos.set(lerp(0, 1.4 * fx, e2), lerp(1.4, 1.55, e2), lerp(6.0, 5.4, e2));
    look.set(lerp(0, 0.3 * fx, e2), lerp(-0.3, -0.12, e2), 0);
    if (s3 > 0) {
      camPos.set(lerp(1.4 * fx, 0.35 * fx, e3), lerp(1.55, 2.5, e3), lerp(5.4, 9.4, e3));
      look.set(lerp(0.3 * fx, 0, e3), lerp(-0.12, 1.0, e3), 0);
    }
    if (s4 > 0) {
      camPos.set(lerp(0.35 * fx, 0, e4), lerp(2.5, 2.02, e4), lerp(9.4, 4.7, e4));
      look.set(0, lerp(1.0, 1.95, e4), lerp(0, 0.9, e4));
    }
    if (s5 > 0) {
      camPos.set(lerp(0, -0.22, e5), lerp(2.02, 1.92, e5), lerp(4.7, 4.9, e5));
      look.set(lerp(0, -0.08, e5), lerp(1.95, 1.72, e5), lerp(0.9, 0.8, e5));
    }
    // Dolly relative to the look target for portrait screens.
    camPos.sub(look).multiplyScalar(dolly).add(look);
    if (!reducedMotion && s1 < 1) {
      camPos.x += Math.sin(t * 0.21) * 0.04 * (1 - s1);
      camPos.y += Math.cos(t * 0.17) * 0.025 * (1 - s1);
    }
    camera.position.copy(camPos);
    s.lookAt.lerp(look, 1 - Math.exp(-12 * dt));
    camera.lookAt(s.lookAt);
    camera.updateMatrixWorld();

    /* ---------------- Vault box ---------------- */
    const root = boxRoot.current;
    if (root) {
      const sway = reducedMotion ? 0 : Math.sin(t * 0.14) * 0.16 * (1 - e2);
      let ry = Math.PI - 0.42 + sway + e2 * (Math.PI / 2) + e3 * (Math.PI / 2) + e5 * Math.PI;
      ry += s.pointer.x * MAX_TILT;
      const rx = s.pointer.y * MAX_TILT * 0.8 + s.velocity * 0.015;
      root.rotation.set(THREE.MathUtils.clamp(rx, -MAX_TILT, MAX_TILT), ry, 0);
      const scale = (1 + 0.12 * e2 - 0.12 * e3) * lerp(1, 0.4, e5);
      root.scale.setScalar(scale);
      root.position.set(lerp(0, -1.35 * fx, e5), lerp(FLOOR_Y, 0.95, e5), lerp(0, 0.7, e5));
      // Lid: opens during S3, closes as the box leaves.
      box.setOpen(seg(s3, 0.12, 0.62) * (1 - seg(s5, 0, 0.55)));
      // Logo glow: subtle breathing in S1 only.
      box.logoMaterial.emissiveIntensity = (0.07 + (reducedMotion ? 0 : Math.sin(t * 1.1) * 0.025)) * (1 - e2) + 0.012;
    }
    if (pool.current) {
      (pool.current.material as THREE.MeshBasicMaterial).opacity = 0.2 * (1 - e4) * (1 - e5);
    }

    /* ---------------- Floating objects ---------------- */
    const card = cardTarget.current;
    items.forEach((it, i) => {
      const hero = i === 0;
      const rise = easeOut(seg(s3, 0.38 + i * 0.045, 0.9 + i * 0.012));
      if (rise <= 0) {
        setOpacity(it, 0);
        return;
      }
      const home = tmp.v.set(it.home.x * fx, it.home.y, it.home.z);
      const pos = it.holder.position;
      pos.copy(tmp.start).lerp(home, rise);
      // Floating: independent bob, drift and spin.
      const bob = reducedMotion ? 0 : Math.sin(t * 0.85 + it.phase) * 0.055;
      pos.y += bob * rise;
      pos.x += s.pointer.x * 0.07 * (1 + it.home.z * 0.4) * rise;
      pos.y -= s.pointer.y * 0.05 * rise;
      let scale = it.baseScale * lerp(0.22, 1, rise);
      let opacity = Math.min(1, rise * 1.6);

      if (!reducedMotion) s.spins[i] += it.spin * dt * (hero ? 1 - e4 : 1);
      it.spinner.rotation.set(
        it.tilt.x * rise + Math.sin(t * 0.5 + it.phase) * 0.05,
        s.spins[i] + it.tilt.y,
        it.tilt.z + Math.cos(t * 0.4 + it.phase) * 0.04,
      );

      if (s4 > 0) {
        if (hero) {
          // The hero object takes centre stage, facing the camera.
          pos.lerp(tmp.a.set(0, 1.95, 1.45), e4);
          scale *= lerp(1, 0.92, e4);
          const wrapped = Math.atan2(Math.sin(s.spins[i]), Math.cos(s.spins[i]));
          it.spinner.rotation.y = lerp(it.spinner.rotation.y, wrapped * (1 - e4) + Math.sin(t * 0.4) * 0.12 * e4, e4);
          it.spinner.rotation.x = lerp(it.spinner.rotation.x, s.pointer.y * 0.06, e4);
        } else {
          // Others rush past the camera and fade away.
          const out = tmp.a.set(it.home.x * fx, it.home.y - 1.8, 0).normalize();
          pos.addScaledVector(out, e4 * 1.9);
          pos.z += e4 * 3.2;
          opacity *= 1 - seg(s4, 0.12, 0.7);
        }
      }
      if (hero && s5 > 0 && card) {
        // Becomes the first product card: glide to the card and dissolve into it.
        const dist = 3.1;
        const dir = tmp.a.set(card.x, card.y, 0.5).unproject(camera).sub(camera.position).normalize();
        const cardPos = tmp.v.copy(camera.position).addScaledVector(dir, dist);
        const visH = 2 * dist * Math.tan(THREE.MathUtils.degToRad(FOV / 2));
        const targetScale = it.baseScale * ((card.h * visH * 0.58) / Math.max(0.01, it.unitHeight));
        const m = easeInOut(seg(s5, 0.05, 0.75));
        pos.lerp(cardPos, m);
        scale = lerp(scale, targetScale, m);
        it.spinner.rotation.y = lerp(it.spinner.rotation.y, -0.35, m);
        opacity *= 1 - seg(s5, 0.5, 0.85);
      }
      it.holder.scale.setScalar(scale);
      setOpacity(it, opacity);
    });
  });

  const shadowRes = tier === "high" ? 768 : tier === "medium" ? 384 : 0;

  return (
    <>
      <group ref={boxRoot} position={[0, FLOOR_Y, 0]}>
        <primitive object={box.group} />
        <mesh ref={pool} rotation-x={-Math.PI / 2} position={[0, 0.002, 0]} renderOrder={-1}>
          <planeGeometry args={[7, 5]} />
          <meshBasicMaterial map={radialTexture("rgba(255,255,255,0.9)", "rgba(255,255,255,0)")} transparent opacity={0.2} depthWrite={false} blending={THREE.AdditiveBlending} />
        </mesh>
        {shadowRes > 0 ? (
          <ContactShadows position={[0, 0.004, 0]} scale={[4.4, 3.4]} resolution={shadowRes} far={1.4} blur={2.6} opacity={0.85} color="#000000" />
        ) : (
          <mesh rotation-x={-Math.PI / 2} position={[0, 0.003, 0]}>
            <planeGeometry args={[3.2, 2.4]} />
            <meshBasicMaterial map={radialTexture()} transparent opacity={0.8} depthWrite={false} />
          </mesh>
        )}
      </group>
      {items.map((it: FloatingItem) => (
        <primitive key={it.key} object={it.holder} />
      ))}
    </>
  );
}
