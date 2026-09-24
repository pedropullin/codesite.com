import * as THREE from "three";
import * as M from "../../src/three/models";
import { PALETTE } from "../../src/three/materials";

export type Shot = {
  key: string;
  build: () => THREE.Object3D;
  width: number;
  height: number;
  ss?: number;
  /** null/undefined → transparent PNG with a shadow-catcher floor. */
  background?: string | null;
  floorColor?: string;
  floor?: boolean;
  env?: "dark" | "light";
  envIntensity?: number;
  exposure?: number;
  camera: {
    azimuth: number;
    elevation: number;
    distance?: number;
    fov?: number;
    targetOffset?: [number, number, number];
    roll?: number;
  };
  keyLight?: { azimuth: number; elevation: number; intensity: number };
  topLight?: number;
  rimLight?: number;
  shadow?: number;
  shadowSoftness?: number;
  vignette?: number;
  grain?: number;
  backdropGlow?: number;
};

const PORTRAIT = { width: 1200, height: 1500 };
const WIDE = { width: 1920, height: 1200 };
const TALL = { width: 1200, height: 1600 };

type Place = {
  obj: THREE.Object3D;
  p?: [number, number, number];
  r?: [number, number, number];
  s?: number;
};

/** Grounds each object on y=0 at its placement, then groups them. */
function compose(items: Place[]) {
  const g = new THREE.Group();
  for (const it of items) {
    const holder = new THREE.Group();
    const o = it.obj;
    if (it.r) o.rotation.set(...it.r);
    if (it.s) o.scale.setScalar(it.s);
    holder.add(o);
    o.updateMatrixWorld(true);
    const box = new THREE.Box3().setFromObject(o);
    const c = box.getCenter(new THREE.Vector3());
    o.position.x -= c.x;
    o.position.z -= c.z;
    o.position.y -= box.min.y;
    if (it.p) holder.position.set(...it.p);
    g.add(holder);
  }
  return g;
}

const flat = (o: THREE.Object3D) => {
  o.rotation.x = -Math.PI / 2;
  return o;
};

/* Product photography: transparent background, soft studio shadow. */
const product = (
  key: string,
  build: () => THREE.Object3D,
  camera: Shot["camera"],
  extra: Partial<Shot> = {},
): Shot => ({ key, ...PORTRAIT, build, env: "light", camera, shadow: 0.3, ...extra });

/* Campaign photography: dark set, dramatic light, vignette & grain. */
const campaign = (
  key: string,
  size: { width: number; height: number },
  build: () => THREE.Object3D,
  camera: Shot["camera"],
  extra: Partial<Shot> = {},
): Shot => ({
  key,
  ...size,
  build,
  background: "#0b0b0c",
  floorColor: "#1a1a1c",
  env: "dark",
  envIntensity: 1.9,
  keyLight: { azimuth: -40, elevation: 50, intensity: 3.2 },
  topLight: 0.5,
  rimLight: 1.8,
  vignette: 0.55,
  grain: 0.03,
  camera,
  ...extra,
});

const vaultBoxWithContents = (open = 1) => {
  const box = M.createVaultBox();
  box.setOpen(open);
  const tee = M.createFoldedTee();
  tee.scale.setScalar(1.1);
  tee.position.set(-0.28, 0.0, 0.02);
  const tag = M.createTag();
  tag.rotation.x = -Math.PI / 2 + 0.25;
  tag.rotation.z = 0.2;
  tag.scale.setScalar(0.62);
  tag.position.set(0.62, 0.2, 0.05);
  const card = M.createAuthCard();
  card.rotation.x = -Math.PI / 2 + 0.2;
  card.rotation.z = -0.12;
  card.scale.setScalar(0.62);
  card.position.set(0.45, 0.16, -0.25);
  box.contents.add(tee, tag, card);
  return box.group;
};

export const shots: Shot[] = [
  /* ------------------------------------------------------------ Clothing */
  product("tee-black-1", () => M.createFlatLayGarment({ color: PALETTE.ink }), { azimuth: 0, elevation: 80, distance: 1.02 }),
  product("tee-black-2", () => M.createFoldedTee({ color: PALETTE.ink }), { azimuth: 18, elevation: 38, distance: 0.95 }),
  product("tee-bone-1", () => M.createFlatLayGarment({ color: PALETTE.bone }), { azimuth: 0, elevation: 80, distance: 1.02 }),
  product("hoodie-graphite-1", () => M.createFlatLayGarment({ color: PALETTE.graphite, sleeves: "long", hood: true, pocket: true, print: "emboss" }), { azimuth: 0, elevation: 80, distance: 1.0 }),
  product("hoodie-graphite-2", () => M.createFoldedHoodie({ color: PALETTE.graphite }), { azimuth: 18, elevation: 36, distance: 0.95 }),
  product("hoodie-black-1", () => M.createFlatLayGarment({ color: PALETTE.ink, sleeves: "long", hood: true, pocket: true, print: "emboss" }), { azimuth: 0, elevation: 80, distance: 1.0 }),
  product("crew-bone-1", () => M.createFlatLayGarment({ color: PALETTE.bone, sleeves: "long", print: "emboss" }), { azimuth: 0, elevation: 80, distance: 1.0 }),
  product("crew-bone-2", () => M.createFoldedCrewneck({ color: PALETTE.bone }), { azimuth: 18, elevation: 36, distance: 0.95 }),
  product("cap-black-1", () => M.createCap(), { azimuth: 38, elevation: 16, distance: 1.05 }),
  product("cap-black-2", () => M.createCap(), { azimuth: 115, elevation: 24, distance: 1.05 }),
  product("beanie-black-1", () => M.createBeanie({ color: PALETTE.ink }), { azimuth: 8, elevation: 12, distance: 1.1 }),
  product("beanie-graphite-1", () => M.createBeanie({ color: PALETTE.graphite }), { azimuth: 8, elevation: 12, distance: 1.1 }),

  /* ------------------------------------------------------------ Footwear */
  product("runner-black-1", () => M.createRunner({ colorway: "black" }), { azimuth: 48, elevation: 14, distance: 0.98 }),
  product("runner-black-2", () => M.createRunner({ colorway: "black" }), { azimuth: 0, elevation: 4, distance: 0.95 }),
  product("runner-bone-1", () => M.createRunner({ colorway: "bone" }), { azimuth: 48, elevation: 14, distance: 0.98 }),
  product("runner-chrome-1", () => M.createRunner({ colorway: "chrome" }), { azimuth: 48, elevation: 14, distance: 0.98 }),
  product("runner-chrome-2", () => M.createRunner({ colorway: "chrome" }), { azimuth: 0, elevation: 5, distance: 0.95 }),
  product("slide-black-1", () => M.createSlide(), { azimuth: 52, elevation: 26, distance: 1.0 }),
  product("slide-black-2", () => M.createSlide(), { azimuth: 90, elevation: 70, distance: 1.0 }),
  { key: "runner-hero", width: 1800, height: 1200, build: () => M.createRunner({ colorway: "black" }), env: "light", camera: { azimuth: 12, elevation: 7, distance: 0.66 }, shadow: 0.28 },

  /* --------------------------------------------------------- Accessories */
  product("keychain-1", () => M.createKeychain(), { azimuth: 0, elevation: 62, distance: 1.0 }),
  product("keychain-2", () => M.createKeychain(), { azimuth: 35, elevation: 32, distance: 0.8 }),
  product("chain-1", () => M.createCubanChain(), { azimuth: 0, elevation: 72, distance: 0.98 }),
  product("chain-2", () => M.createCubanChain(), { azimuth: 0, elevation: 38, distance: 0.52, targetOffset: [0, 0, -0.55] }),
  product("ring-1", () => M.createSignetRing(), { azimuth: 24, elevation: 20, distance: 1.1 }),
  product("ring-2", () => M.createSignetRing(), { azimuth: 0, elevation: 58, distance: 1.05 }),
  product("cardholder-1", () => M.createCardHolder(), { azimuth: 12, elevation: 48, distance: 1.0 }),
  product("cardholder-2", () => M.createCardHolder({ withCard: false }), { azimuth: 30, elevation: 28, distance: 0.95 }),
  product("tote-1", () => M.createBag({ variant: "tote" }), { azimuth: 26, elevation: 14, distance: 1.05 }),
  product("tote-2", () => M.createBag({ variant: "tote" }), { azimuth: 0, elevation: 6, distance: 1.05 }),
  product("lighter-1", () => M.createLighter(), { azimuth: 28, elevation: 16, distance: 1.1 }),
  product("lighter-2", () => M.createLighter({ open: 1 }), { azimuth: 28, elevation: 16, distance: 1.05 }),

  /* ---------------------------------------------------------- Exclusives */
  product("vaultbox-1", () => { const b = M.createVaultBox(); b.group.rotation.y = -0.45; return b.group; }, { azimuth: 0, elevation: 26, distance: 1.0 }),
  product("vaultbox-2", () => { const g = vaultBoxWithContents(1); g.rotation.y = 0.35; return g; }, { azimuth: 0, elevation: 32, distance: 1.0 }),
  product("vaultbox-3", () => { const b = M.createVaultBox(); b.group.rotation.y = 0.2; return b.group; }, { azimuth: 0, elevation: 62, distance: 0.62, targetOffset: [0, 0.25, 0] }),
  product("tag925-1", () => M.createTagOnChain(), { azimuth: 0, elevation: 70, distance: 0.98 }),
  product("tag925-2", () => { const t = M.createTag(); t.rotation.set(-1.2, 0, 0.3); return t; }, { azimuth: 0, elevation: 30, distance: 1.1 }),
  product("capsule-1", () => { const g = vaultBoxWithContents(1); g.scale.setScalar(0.9); g.rotation.y = -0.3; return g; }, { azimuth: 0, elevation: 40, distance: 1.0 }),
  product("capsule-2", () => compose([
    { obj: M.createFoldedTee({ color: PALETTE.ink }), p: [-0.35, 0, 0], r: [0, 0.08, 0] },
    { obj: flat(M.createTag()), p: [0.72, 0, -0.28], r: [-Math.PI / 2, 0, -0.25], s: 0.7 },
    { obj: flat(M.createAuthCard()), p: [0.72, 0, 0.42], r: [-Math.PI / 2, 0, 0.12], s: 0.7 },
  ]), { azimuth: 0, elevation: 70, distance: 1.0 }),

  /* ------------------------------------------------------ Category tiles */
  campaign("category-clothing", TALL, () => compose([
    { obj: M.createFoldedHoodie({ color: PALETTE.graphite }), p: [0, 0, 0], r: [0, 0.12, 0] },
    { obj: M.createFoldedTee({ color: PALETTE.ink }), p: [0.05, 0.22, 0.08], r: [0, -0.05, 0] },
  ]), { azimuth: 22, elevation: 30, distance: 0.82 }),
  campaign("category-accessories", TALL, () => compose([
    { obj: M.createCubanChain(), p: [0, 0, 0], s: 0.9 },
    { obj: M.createSignetRing(), p: [-0.2, 0, 0.35], r: [0, 0.6, 0], s: 0.7 },
    { obj: flat(M.createTag()), p: [0.35, 0, -0.1], r: [-Math.PI / 2, 0, 0.35], s: 0.55 },
  ]), { azimuth: 0, elevation: 55, distance: 0.8 }),
  campaign("category-footwear", TALL, () => M.createRunner({ colorway: "black" }), { azimuth: 62, elevation: 12, distance: 0.86 }),
  campaign("category-exclusives", TALL, () => { const g = vaultBoxWithContents(0.92); g.rotation.y = 0.25; return g; }, { azimuth: 0, elevation: 34, distance: 0.86 }),

  /* ------------------------------------------------ Gallery / campaign */
  campaign("campaign-essential", WIDE, () => compose([
    { obj: M.createFoldedTee({ color: PALETTE.bone }), p: [0, 0, 0], r: [0, 0.04, 0] },
    { obj: M.createFoldedTee({ color: PALETTE.graphite }), p: [0.02, 0.14, 0.01], r: [0, -0.03, 0] },
    { obj: M.createFoldedTee({ color: PALETTE.ink }), p: [0, 0.28, 0], r: [0, 0.02, 0] },
    { obj: M.createFoldedCrewneck({ color: PALETTE.bone }), p: [1.55, 0, 0.25], r: [0, -0.3, 0] },
    { obj: M.createBeanie({ color: PALETTE.ink }), p: [-1.45, 0, 0.3], s: 0.9 },
  ]), { azimuth: 0, elevation: 20, distance: 0.62 }),
  campaign("campaign-archive", WIDE, () => compose([
    { obj: M.createLighter(), p: [-1.2, 0, 0.1], r: [0, 0.4, 0] },
    { obj: M.createCardHolder(), p: [0, 0, 0.1], r: [0, -0.15, 0] },
    { obj: M.createSignetRing(), p: [1.05, 0, 0.25], r: [0, 0.5, 0], s: 0.8 },
    { obj: flat(M.createTag({ finish: "chrome", lines: ["VAULT", "ASSOCIATION", "KEY 01", "316L"] })), p: [0.7, 0, -0.45], r: [-Math.PI / 2, 0, -0.4], s: 0.6 },
  ]), { azimuth: 0, elevation: 30, distance: 0.6 }),
  campaign("campaign-select", WIDE, () => compose([
    { obj: M.createRunner({ colorway: "black" }), p: [-0.9, 0, -0.45], r: [0, 0.35, 0] },
    { obj: M.createRunner({ colorway: "bone" }), p: [0.95, 0, 0.35], r: [0, -0.25, 0] },
  ]), { azimuth: 18, elevation: 14, distance: 0.6 }),
  campaign("campaign-exclusive", WIDE, () => compose([
    { obj: (() => { const b = M.createVaultBox(); return b.group; })(), p: [-0.6, 0, 0], r: [0, 0.35, 0] },
    { obj: flat(M.createAuthCard()), p: [1.3, 0, 0.35], r: [-Math.PI / 2, 0, -0.18], s: 0.8 },
    { obj: M.createTagOnChain(), p: [1.35, 0, -0.55], s: 0.5 },
  ]), { azimuth: 0, elevation: 24, distance: 0.6 }),

  /* ------------------------------------------------------ Editorial / hero */
  campaign("brand-detail", PORTRAIT, () => M.createVaultBox().group, { azimuth: 12, elevation: 48, distance: 0.5, targetOffset: [0, 0.1, 0] }, { vignette: 0.7 }),
  campaign("brand-materials", PORTRAIT, () => compose([
    { obj: M.createTagOnChain(), p: [0, 0, 0] },
  ]), { azimuth: 0, elevation: 42, distance: 0.62 }),
  campaign("hero-poster", WIDE, () => { const b = M.createVaultBox(); b.group.rotation.y = -0.4; return b.group; }, { azimuth: 0, elevation: 24, distance: 0.82 }, { background: "#050505", floorColor: "#0e0e10", vignette: 0.7 }),
];
