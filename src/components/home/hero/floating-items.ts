import * as THREE from "three";
import {
  createAuthCard,
  createBag,
  createCardHolder,
  createFoldedTee,
  createLighter,
  createRunner,
  createSignetRing,
  createTag,
} from "@/three/models";
import type { TextureQuality } from "@/three/textures";

export type FloatingItem = {
  key: string;
  holder: THREE.Group;
  spinner: THREE.Group;
  baseScale: number;
  unitHeight: number;
  home: THREE.Vector3;
  phase: number;
  spin: number;
  tilt: THREE.Euler;
  materials: THREE.Material[];
};

type Def = {
  key: string;
  make: (q: TextureQuality) => THREE.Object3D;
  size: number;
  home: [number, number, number];
  tilt?: [number, number, number];
};

/** Objects that emerge from the vault. Index 0 is the hero object that becomes the first product card. */
const DEFS: Def[] = [
  { key: "tag", make: (q) => createTag({ quality: q }), size: 0.62, home: [0, 1.85, 0.4] },
  { key: "card", make: (q) => createAuthCard({ quality: q }), size: 0.55, home: [-1.55, 1.6, 0.45], tilt: [0.35, 0.4, -0.12] },
  { key: "tee", make: (q) => createFoldedTee({ quality: q }), size: 0.62, home: [1.65, 1.5, 0.25], tilt: [0.9, -0.3, 0.1] },
  { key: "runner", make: (q) => createRunner({ quality: q }), size: 0.72, home: [-2.65, 0.85, -0.3], tilt: [0.15, 0.7, 0] },
  { key: "ring", make: (q) => createSignetRing({ quality: q }), size: 0.4, home: [2.6, 0.95, -0.15], tilt: [0.3, -0.4, 0] },
  { key: "bag", make: (q) => createBag({ quality: q, variant: "paper" }), size: 0.55, home: [-0.95, 2.45, -0.95], tilt: [0.1, 0.5, 0] },
  { key: "lighter", make: (q) => createLighter({ quality: q }), size: 0.36, home: [1.05, 2.5, -0.85], tilt: [0.2, -0.6, 0.15] },
  { key: "cardholder", make: (q) => createCardHolder({ quality: q, withCard: false }), size: 0.45, home: [0.05, 2.95, -1.6], tilt: [0.9, 0.2, 0] },
];

export function floatingCount(tier: "high" | "medium" | "low") {
  return tier === "high" ? 8 : tier === "medium" ? 6 : 4;
}

export function buildFloatingItems(tier: "high" | "medium" | "low"): FloatingItem[] {
  const q: TextureQuality = tier;
  return DEFS.slice(0, floatingCount(tier)).map((d, i) => {
    const obj = d.make(q);
    obj.updateMatrixWorld(true);
    const bb = new THREE.Box3().setFromObject(obj);
    const sphere = bb.getBoundingSphere(new THREE.Sphere());
    obj.position.sub(sphere.center);
    const spinner = new THREE.Group();
    spinner.add(obj);
    const holder = new THREE.Group();
    holder.add(spinner);
    const materials: THREE.Material[] = [];
    obj.traverse((o) => {
      const m = o as THREE.Mesh;
      if (!m.isMesh) return;
      m.castShadow = true;
      m.receiveShadow = false;
      const mats = Array.isArray(m.material) ? m.material : [m.material];
      mats.forEach((mat) => {
        if (!materials.includes(mat)) {
          mat.transparent = true;
          materials.push(mat);
        }
      });
    });
    const baseScale = d.size / sphere.radius;
    return {
      key: d.key,
      holder,
      spinner,
      baseScale,
      unitHeight: (bb.max.y - bb.min.y) * baseScale,
      home: new THREE.Vector3(...d.home),
      phase: i * 1.73,
      spin: (i % 2 ? 1 : -1) * (0.16 + 0.04 * i),
      tilt: new THREE.Euler(...(d.tilt ?? [0, 0, 0])),
      materials,
    };
  });
}

export function setOpacity(item: FloatingItem, opacity: number) {
  const o = Math.max(0, Math.min(1, opacity));
  for (const m of item.materials) {
    m.opacity = o;
    m.depthWrite = o > 0.6;
  }
  item.holder.visible = o > 0.002;
}
