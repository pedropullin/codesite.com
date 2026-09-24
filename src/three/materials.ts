import * as THREE from "three";
import {
  brushedNormal,
  fabricNormal,
  leatherNormal,
  paperNormal,
  ribNormal,
  ropeNormal,
  type TextureQuality,
} from "./textures";

/* -------------------------------------------------------------------------- */
/* Studio material library — matte black, brushed steel, chrome, fabrics.     */
/* All colours are authored in sRGB and converted by three's colour manager.  */
/* -------------------------------------------------------------------------- */

export const PALETTE = {
  black: "#0b0b0c",
  ink: "#111112",
  graphite: "#3a3b3f",
  steel: "#9a9ca0",
  silver: "#d4d6d9",
  bone: "#e2dfd7",
  lining: "#1c1c1e",
} as const;

export type MaterialOptions = { quality?: TextureQuality };

const n = (s: number) => new THREE.Vector2(s, s);

export function matteBlack({ quality = "high" }: MaterialOptions = {}) {
  return new THREE.MeshPhysicalMaterial({
    name: "matte-black",
    color: PALETTE.black,
    roughness: 0.56,
    metalness: 0,
    clearcoat: 0.18,
    clearcoatRoughness: 0.5,
    sheen: 0.25,
    sheenRoughness: 0.6,
    sheenColor: new THREE.Color("#2a2a2e"),
    normalMap: paperNormal(quality, 3),
    normalScale: n(0.12),
  });
}

export function lining() {
  return new THREE.MeshStandardMaterial({
    name: "lining",
    color: PALETTE.lining,
    roughness: 1,
    metalness: 0,
  });
}

export function chrome() {
  return new THREE.MeshStandardMaterial({
    name: "chrome",
    color: "#f4f4f4",
    metalness: 1,
    roughness: 0.07,
  });
}

export function silver() {
  return new THREE.MeshStandardMaterial({
    name: "silver",
    color: "#e2e3e5",
    metalness: 1,
    roughness: 0.16,
  });
}

export function brushedSteel({ quality = "high" }: MaterialOptions = {}) {
  return new THREE.MeshPhysicalMaterial({
    name: "brushed-steel",
    color: "#c3c5c8",
    metalness: 1,
    roughness: 0.3,
    normalMap: brushedNormal(quality, 1),
    normalScale: n(0.35),
    anisotropy: 0.7,
  });
}

export function gunmetal({ quality = "high" }: MaterialOptions = {}) {
  return new THREE.MeshPhysicalMaterial({
    name: "gunmetal",
    color: "#55575c",
    metalness: 1,
    roughness: 0.34,
    normalMap: brushedNormal(quality, 1),
    normalScale: n(0.25),
  });
}

export function fabric(color: string, { quality = "high" }: MaterialOptions = {}, repeat = 6) {
  const c = new THREE.Color(color);
  const sheen = c.clone().lerp(new THREE.Color("#ffffff"), 0.2);
  return new THREE.MeshPhysicalMaterial({
    name: "fabric",
    color: c,
    roughness: 0.94,
    metalness: 0,
    sheen: 0.6,
    sheenRoughness: 0.72,
    sheenColor: sheen,
    normalMap: fabricNormal(quality, repeat),
    normalScale: n(0.55),
  });
}

export function ribFabric(color: string, { quality = "high" }: MaterialOptions = {}, ribs = 48, repeatX = 1, repeatY = 1) {
  const m = fabric(color, { quality });
  const t = ribNormal(quality, ribs).clone();
  t.repeat.set(repeatX, repeatY);
  t.needsUpdate = true;
  m.normalMap = t;
  m.normalScale = n(0.9);
  return m;
}

export function leather(color: string = PALETTE.ink, { quality = "high" }: MaterialOptions = {}) {
  return new THREE.MeshPhysicalMaterial({
    name: "leather",
    color,
    roughness: 0.48,
    metalness: 0,
    clearcoat: 0.3,
    clearcoatRoughness: 0.42,
    normalMap: leatherNormal(quality, 3),
    normalScale: n(0.5),
  });
}

export function nubuck(color: string, { quality = "high" }: MaterialOptions = {}) {
  return new THREE.MeshPhysicalMaterial({
    name: "nubuck",
    color,
    roughness: 0.86,
    sheen: 0.8,
    sheenRoughness: 0.5,
    sheenColor: new THREE.Color(color).lerp(new THREE.Color("#ffffff"), 0.25),
    normalMap: leatherNormal(quality, 5),
    normalScale: n(0.18),
  });
}

export function rubber(color: string) {
  return new THREE.MeshPhysicalMaterial({
    name: "rubber",
    color,
    roughness: 0.62,
    metalness: 0,
    clearcoat: 0.08,
  });
}

export function satinEva(color: string) {
  return new THREE.MeshPhysicalMaterial({
    name: "eva",
    color,
    roughness: 0.42,
    metalness: 0,
    clearcoat: 0.35,
    clearcoatRoughness: 0.35,
  });
}

export function paper(color: string = PALETTE.bone, { quality = "high" }: MaterialOptions = {}) {
  return new THREE.MeshStandardMaterial({
    name: "paper",
    color,
    roughness: 0.82,
    metalness: 0,
    normalMap: paperNormal(quality, 2),
    normalScale: n(0.2),
  });
}

export function rope(color: string, { quality = "high" }: MaterialOptions = {}) {
  return new THREE.MeshStandardMaterial({
    name: "rope",
    color,
    roughness: 0.85,
    normalMap: ropeNormal(quality),
    normalScale: n(1),
  });
}

export function smokeTranslucent() {
  return new THREE.MeshPhysicalMaterial({
    name: "smoke",
    color: "#3a3b40",
    roughness: 0.18,
    metalness: 0,
    transparent: true,
    opacity: 0.82,
    clearcoat: 1,
    clearcoatRoughness: 0.1,
  });
}
