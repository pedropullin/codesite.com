import * as THREE from "three";
import { extrudeRounded, extrudeShape, noise3, ringSweep, roundedRectShape, softBox } from "../geometry";
import {
  brushedSteel,
  chrome,
  fabric,
  leather,
  paper,
  PALETTE,
  rope,
  silver,
} from "../materials";
import {
  canvasTexture,
  logoCanvas,
  remapCanvas,
  stitchCanvas,
  tintCanvas,
  type TextureQuality,
} from "../textures";

type Q = { quality?: TextureQuality };
const seg = (q: TextureQuality, hi: number) => (q === "high" ? hi : q === "medium" ? Math.round(hi * 0.6) : Math.max(6, Math.round(hi * 0.35)));

function shadowAll<T extends THREE.Object3D>(g: T) {
  g.traverse((o) => {
    if ((o as THREE.Mesh).isMesh) {
      o.castShadow = true;
      o.receiveShadow = true;
    }
  });
  return g;
}

/* Metal tag (dog-tag profile, engraved both faces) ------------------------ */

export function createTag({
  quality = "high",
  lines = ["VAULT", "ASSOCIATION", "N° 001 / 100", "925"],
  finish = "silver",
  withRing = true,
}: Q & { lines?: string[]; finish?: "silver" | "chrome" | "steel"; withRing?: boolean } = {}) {
  const group = new THREE.Group();
  const W = 0.62;
  const H = 1.0;
  const shape = roundedRectShape(W, H, 0.17);
  const hole = new THREE.Path();
  hole.absellipse(0, H / 2 - 0.1, 0.045, 0.045, 0, Math.PI * 2, true, 0);
  shape.holes.push(hole);
  const geo = extrudeShape(shape, 0.028, 0.012, { curveSegments: seg(quality, 24) });
  const baseMat = finish === "silver" ? silver() : finish === "chrome" ? chrome() : brushedSteel({ quality });
  const mask = logoCanvas({
    width: 620,
    height: 1000,
    lines: [
      { text: lines[0] ?? "", size: 0.075, weight: 600, tracking: 0.3, offsetY: -0.1 },
      { text: lines[1] ?? "", size: 0.034, weight: 500, tracking: 0.5, offsetY: -0.035 },
      { text: lines[2] ?? "", size: 0.03, weight: 500, tracking: 0.35, offsetY: 0.08 },
      { text: lines[3] ?? "", size: 0.028, weight: 500, tracking: 0.5, offsetY: 0.28 },
    ],
    frame: 0.06,
  });
  const engraved = baseMat.clone() as THREE.MeshStandardMaterial;
  engraved.bumpMap = canvasTexture(mask);
  engraved.bumpScale = -1.8;
  engraved.roughnessMap = canvasTexture(remapCanvas(mask, 1, 2.4));
  const mesh = new THREE.Mesh(geo, [engraved, baseMat, engraved]);
  group.add(mesh);
  if (withRing) {
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.1, 0.013, 12, 48), baseMat);
    ring.position.set(0, H / 2 - 0.1 + 0.07, 0);
    ring.rotation.y = Math.PI / 2;
    group.add(ring);
  }
  return shadowAll(group);
}

/** Ball chain following a curve (used with the 925 tag). */
export function createBallChain(curve: THREE.Curve<THREE.Vector3>, count: number, radius = 0.018, quality: TextureQuality = "high") {
  const geo = new THREE.SphereGeometry(radius, seg(quality, 14), seg(quality, 10));
  const mesh = new THREE.InstancedMesh(geo, silver(), count);
  const m = new THREE.Matrix4();
  for (let i = 0; i < count; i++) {
    m.makeTranslation(curve.getPointAt(i / (count - 1)));
    mesh.setMatrixAt(i, m);
  }
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

export function createTagOnChain({ quality = "high" }: Q = {}) {
  const group = new THREE.Group();
  const tag = createTag({ quality });
  tag.rotation.x = -Math.PI / 2;
  tag.position.set(0, 0.03, 0.15);
  group.add(tag);
  // Chain loops away behind the tag, lying on the floor.
  const pts: THREE.Vector3[] = [];
  const top = new THREE.Vector3(0, 0.03, 0.15 - 0.47);
  pts.push(top);
  for (let i = 1; i <= 40; i++) {
    const t = i / 40;
    const a = t * Math.PI * 2;
    pts.push(new THREE.Vector3(Math.sin(a) * 0.75 + Math.sin(a * 2) * 0.08, 0.02, top.z - 0.75 + Math.cos(a) * 0.75));
  }
  const curve = new THREE.CatmullRomCurve3(pts, true);
  group.add(createBallChain(curve, quality === "low" ? 90 : 170, 0.02, quality));
  return shadowAll(group);
}

/* Authenticity card with silver foil -------------------------------------- */

export function createAuthCard({ quality = "high", edition = "N° 001 / 250" }: Q & { edition?: string } = {}) {
  const W = 1.0;
  const H = 0.63;
  const front = logoCanvas({
    width: 1000,
    height: 630,
    lines: [
      { text: "VAULT ASSOCIATION", size: 0.055, weight: 500, tracking: 0.45, offsetY: -0.3 },
      { text: "CERTIFICATE OF AUTHENTICITY", size: 0.028, weight: 500, tracking: 0.55, offsetY: -0.2 },
      { text: edition, size: 0.085, weight: 400, tracking: 0.2, offsetY: 0.03 },
      { text: "THIS OBJECT HAS BEEN RECORDED IN THE VAULT ARCHIVE", size: 0.021, weight: 400, tracking: 0.35, offsetY: 0.27 },
    ],
    frame: 0.05,
  });
  const map = canvasTexture(tintCanvas(front, "#0d0d0e", "#c9cbcf"), THREE.SRGBColorSpace);
  const faceMat = new THREE.MeshPhysicalMaterial({
    map,
    metalness: 1,
    metalnessMap: canvasTexture(front),
    roughness: 0.62,
    roughnessMap: canvasTexture(remapCanvas(front, 1, 0.35)),
    clearcoat: 0.3,
    clearcoatRoughness: 0.4,
  });
  const backMask = logoCanvas({ width: 1000, height: 630, lines: [{ text: "V", size: 0.26, weight: 300, tracking: 0 }] });
  const backMat = new THREE.MeshPhysicalMaterial({
    map: canvasTexture(tintCanvas(backMask, "#0d0d0e", "#9ea0a4"), THREE.SRGBColorSpace),
    metalness: 1,
    metalnessMap: canvasTexture(backMask),
    roughness: 0.6,
  });
  const edge = new THREE.MeshStandardMaterial({ color: "#1a1a1b", roughness: 0.7 });
  const geo = extrudeRounded(W, H, 0.014, 0.045, 0.003, { curveSegments: seg(quality, 12) });
  const mesh = new THREE.Mesh(geo, [backMat, edge, faceMat]);
  return shadowAll(new THREE.Group().add(mesh));
}

/* Cuban link chain (instanced) -------------------------------------------- */

export function createCubanChain({ quality = "high", links = 90, finish = "silver" }: Q & { links?: number; finish?: "silver" | "chrome" } = {}) {
  const group = new THREE.Group();
  // Necklace laid on the floor in a relaxed teardrop.
  const pts: THREE.Vector3[] = [];
  const N = 24;
  for (let i = 0; i < N; i++) {
    const a = (i / N) * Math.PI * 2;
    const r = 0.9 + Math.cos(a) * 0.12;
    pts.push(new THREE.Vector3(Math.sin(a) * r * 0.82, 0, Math.cos(a) * r - Math.pow(Math.max(0, -Math.cos(a)), 3) * 0.35));
  }
  const curve = new THREE.CatmullRomCurve3(pts, true, "centripetal");
  const len = curve.getLength();
  const count = Math.max(40, Math.round(links * (quality === "low" ? 0.5 : 1)));
  const linkLen = len / count;
  const geo = new THREE.TorusGeometry(linkLen * 0.6, linkLen * 0.3, seg(quality, 12), seg(quality, 24));
  geo.scale(1.12, 0.62, 1);
  const mat = finish === "silver" ? silver() : chrome();
  const mesh = new THREE.InstancedMesh(geo, mat, count);
  const up = new THREE.Vector3(0, 1, 0);
  const m = new THREE.Matrix4();
  const q = new THREE.Quaternion();
  const twist = new THREE.Quaternion();
  const xAxis = new THREE.Vector3(1, 0, 0);
  for (let i = 0; i < count; i++) {
    const t = i / count;
    const p = curve.getPointAt(t);
    const tan = curve.getTangentAt(t);
    // Align torus X axis to the tangent, lying flat, then twist alternately.
    const basis = new THREE.Matrix4();
    const side = new THREE.Vector3().crossVectors(up, tan).normalize();
    basis.makeBasis(tan, up.clone(), side.clone().negate());
    q.setFromRotationMatrix(basis);
    twist.setFromAxisAngle(xAxis, (i % 2 ? 1 : -1) * 0.95 + Math.PI / 2);
    q.multiply(twist);
    m.compose(p.setY(linkLen * 0.3), q, new THREE.Vector3(1, 1, 1));
    mesh.setMatrixAt(i, m);
  }
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  group.add(mesh);
  // Box clasp
  const claspMask = logoCanvas({ width: 400, height: 160, lines: [{ text: "VAULT", size: 0.3, weight: 600, tracking: 0.35 }] });
  const claspMat = mat.clone() as THREE.MeshStandardMaterial;
  claspMat.bumpMap = canvasTexture(claspMask);
  claspMat.bumpScale = -1.4;
  const clasp = new THREE.Mesh(extrudeRounded(0.22, 0.09, 0.05, 0.015, 0.01), [mat, mat, claspMat]);
  const cp = curve.getPointAt(0.5);
  const ct = curve.getTangentAt(0.5);
  clasp.position.copy(cp).setY(0.03);
  clasp.rotation.x = -Math.PI / 2;
  clasp.rotation.z = Math.atan2(ct.z, ct.x);
  group.add(clasp);
  return shadowAll(group);
}

/* Signet ring --------------------------------------------------------------- */

export function createSignetRing({ quality = "high" }: Q = {}) {
  const group = new THREE.Group();
  const band = ringSweep(0.36, seg(quality, 128), seg(quality, 28), (theta) => {
    const top = Math.pow(Math.max(0, Math.cos(theta)), 3);
    return { w: 0.2 + top * 0.2, t: 0.075 + top * 0.13, n: 3.2 };
  });
  const steel = brushedSteel({ quality });
  steel.roughness = 0.22;
  steel.anisotropy = 0;
  steel.normalScale.set(0.12, 0.12);
  group.add(new THREE.Mesh(band, steel));
  // Oval face, mirror polished with engraved monogram.
  const faceMask = logoCanvas({ width: 512, height: 512, lines: [{ text: "VA", size: 0.3, weight: 600, tracking: 0.08 }] });
  const faceTop = chrome();
  faceTop.bumpMap = canvasTexture(faceMask);
  faceTop.bumpScale = -2.2;
  faceTop.roughnessMap = canvasTexture(remapCanvas(faceMask, 1, 3));
  const face = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.215, 0.045, seg(quality, 64)), [chrome(), faceTop, chrome()]);
  face.scale.set(1.18, 1, 1);
  face.rotation.x = Math.PI / 2;
  face.rotation.y = 0;
  face.position.set(0, 0.36 + 0.2, 0);
  // Cylinder axis is Y; after rotating it points to Z, but the face must point +Y (top of ring).
  face.rotation.set(0, 0, 0);
  group.add(face);
  // Stand the ring upright so the face points to the camera/up.
  group.rotation.x = 0;
  return shadowAll(group);
}

/* Card holder --------------------------------------------------------------- */

export function createCardHolder({ quality = "high", withCard = true }: Q & { withCard?: boolean } = {}) {
  const group = new THREE.Group();
  const W = 1.0;
  const D = 0.68;
  const body = leather(PALETTE.ink, { quality });
  const stitch = stitchCanvas(1024, 696, 34, 50, 16, 10);
  const logo = logoCanvas({ width: 1024, height: 696, lines: [{ text: "VAULT ASSOCIATION", size: 0.045, weight: 500, tracking: 0.55, offsetY: 0.05 }] });
  const combined = document.createElement("canvas");
  combined.width = 1024;
  combined.height = 696;
  const cx = combined.getContext("2d")!;
  cx.globalCompositeOperation = "lighter";
  cx.drawImage(stitch, 0, 0);
  cx.drawImage(logo, 0, 0);
  body.bumpMap = canvasTexture(combined);
  body.bumpScale = -2.5;
  const layer = (y: number, h: number, inset: number) =>
    new THREE.Mesh(
      softBox(W - inset, h, D - inset, h * 0.45, [seg(quality, 28), 2, seg(quality, 20)], (p) => {
        p.y += noise3(p.x * 3, 0, p.z * 3) * 0.002;
      }),
      body,
    );
  const bottom = layer(0, 0.045, 0);
  bottom.position.y = 0.0225;
  group.add(bottom);
  // Card slots visible along the top edge
  for (let i = 0; i < 2; i++) {
    const slot = new THREE.Mesh(
      softBox(W - 0.06, 0.012, D * 0.62, 0.005, [12, 1, 8]),
      leather(PALETTE.ink, { quality }),
    );
    slot.position.set(0, 0.047 + i * 0.013, -D * 0.15 + i * 0.06);
    group.add(slot);
  }
  if (withCard) {
    const card = createAuthCard({ quality });
    card.rotation.x = -Math.PI / 2;
    card.scale.setScalar(0.86);
    card.position.set(0.04, 0.075, -0.22);
    group.add(card);
  }
  return shadowAll(group);
}

/* Tote / shopping bag -------------------------------------------------------- */

export function createBag({
  quality = "high",
  variant = "tote",
}: Q & { variant?: "tote" | "paper" } = {}) {
  const group = new THREE.Group();
  const W = 1.0;
  const H = variant === "tote" ? 1.1 : 1.2;
  const Dp = 0.4;
  const isPaper = variant === "paper";
  const color = isPaper ? PALETTE.bone : PALETTE.ink;
  const mask = logoCanvas({
    width: 1024,
    height: Math.round(1024 * (H / W)),
    lines: [
      { text: "VAULT", size: 0.075, weight: 500, tracking: 0.42, offsetY: -0.03 },
      { text: "ASSOCIATION", size: 0.024, weight: 500, tracking: 0.65, offsetY: 0.035 },
    ],
  });
  const mat = isPaper ? paper(color, { quality }) : fabric(color, { quality }, 3);
  if (isPaper) {
    mat.map = canvasTexture(tintCanvas(mask, color, "#111112"), THREE.SRGBColorSpace);
    mat.color = new THREE.Color("#ffffff");
  } else {
    (mat as THREE.MeshPhysicalMaterial).roughness = 0.7;
    (mat as THREE.MeshPhysicalMaterial).clearcoat = 0.15;
    (mat as THREE.MeshPhysicalMaterial).clearcoatRoughness = 0.6;
    mat.map = canvasTexture(tintCanvas(mask, color, "#2e2f33"), THREE.SRGBColorSpace);
    mat.color = new THREE.Color("#ffffff");
  }
  const body = new THREE.Mesh(
    softBox(W, H, Dp, isPaper ? 0.012 : 0.04, [seg(quality, 24), seg(quality, 28), 8], (p) => {
      const ny = (p.y + H / 2) / H;
      // Side gussets pinch inwards towards the top.
      const side = Math.pow(Math.abs(p.z) / (Dp / 2), 2);
      p.z *= 1 - ny * 0.18 * (isPaper ? 0.6 : 1);
      p.x *= 1 - side * 0.015 * ny;
      if (!isPaper) {
        p.z += noise3(p.x * 2.4, p.y * 2.1, 0) * 0.012;
      } else {
        p.z += noise3(p.x * 5, p.y * 4, 0) * 0.002;
      }
    }, "xy"),
    mat,
  );
  body.position.y = H / 2;
  group.add(body);
  // Opening shadow on top
  const opening = new THREE.Mesh(
    new THREE.PlaneGeometry(W * 0.96, Dp * 0.62),
    new THREE.MeshStandardMaterial({ color: isPaper ? "#6e6a62" : "#050505", roughness: 1 }),
  );
  opening.rotation.x = -Math.PI / 2;
  opening.position.y = H - 0.004;
  group.add(opening);
  // Rope handles
  const ropeMat = rope(isPaper ? "#111112" : "#1b1b1c", { quality });
  for (const z of [Dp * 0.22, -Dp * 0.22]) {
    const curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-W * 0.22, H - 0.06, z * 1.05),
      new THREE.Vector3(-W * 0.2, H + 0.22, z),
      new THREE.Vector3(0, H + 0.34, z),
      new THREE.Vector3(W * 0.2, H + 0.22, z),
      new THREE.Vector3(W * 0.22, H - 0.06, z * 1.05),
    ]);
    group.add(new THREE.Mesh(new THREE.TubeGeometry(curve, seg(quality, 48), 0.02, 10, false), ropeMat));
  }
  if (!isPaper) {
    const plateMask = logoCanvas({ width: 512, height: 160, lines: [{ text: "VAULT", size: 0.34, weight: 500, tracking: 0.45 }] });
    const steel = brushedSteel({ quality });
    const engraved = brushedSteel({ quality });
    engraved.bumpMap = canvasTexture(plateMask);
    engraved.bumpScale = -2;
    const plate = new THREE.Mesh(extrudeRounded(0.22, 0.07, 0.012, 0.012, 0.004), [steel, steel, engraved]);
    plate.position.set(0, H * 0.28, Dp / 2 * 0.95 + 0.004);
    group.add(plate);
  }
  return shadowAll(group);
}

/* Lighter -------------------------------------------------------------------- */

export function createLighter({ quality = "high", open = 0 }: Q & { open?: number } = {}) {
  const group = new THREE.Group();
  const W = 0.38;
  const D = 0.13;
  const HB = 0.42;
  const HL = 0.15;
  const steel = brushedSteel({ quality });
  steel.color = new THREE.Color("#dcdde0");
  steel.roughness = 0.24;
  const mask = logoCanvas({ width: 380, height: 400, lines: [{ text: "VAULT", size: 0.075, weight: 600, tracking: 0.45, offsetY: 0.2 }] });
  const engraved = steel.clone();
  engraved.bumpMap = canvasTexture(mask);
  engraved.bumpScale = -1.6;
  const bodyGeo = extrudeRounded(W, HB, D, 0.035, 0.014, { curveSegments: seg(quality, 12) });
  const body = new THREE.Mesh(bodyGeo, [steel, steel, engraved]);
  body.position.y = HB / 2;
  group.add(body);
  const lidPivot = new THREE.Group();
  lidPivot.position.set(W / 2, HB + 0.003, 0);
  const lid = new THREE.Mesh(extrudeRounded(W, HL, D, 0.035, 0.014, { curveSegments: seg(quality, 12) }), steel);
  lid.position.set(-W / 2, HL / 2, 0);
  lidPivot.add(lid);
  lidPivot.rotation.z = -open * 2.2;
  group.add(lidPivot);
  // Chimney & wheel (visible when open)
  if (open > 0) {
    const chimney = new THREE.Mesh(extrudeRounded(W * 0.5, 0.15, D * 0.8, 0.02, 0.004), chrome());
    chimney.position.set(-W * 0.12, HB + 0.075, 0);
    group.add(chimney);
    const wheel = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.04, 24), brushedSteel({ quality }));
    wheel.rotation.x = Math.PI / 2;
    wheel.position.set(W * 0.22, HB + 0.07, 0);
    group.add(wheel);
  }
  return shadowAll(group);
}

/* Keychain: steel tag + split ring -------------------------------------------- */

export function createKeychain({ quality = "high" }: Q = {}) {
  const group = new THREE.Group();
  const tag = createTag({ quality, lines: ["VAULT", "ASSOCIATION", "KEY 01", "316L"], finish: "chrome" });
  tag.scale.setScalar(0.8);
  tag.rotation.x = -Math.PI / 2;
  tag.position.set(0, 0.025, 0.1);
  group.add(tag);
  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.2, 0.018, 14, seg(quality, 64)), chrome());
  ring.rotation.x = -Math.PI / 2;
  ring.position.set(0.05, 0.02, -0.52);
  group.add(ring);
  return shadowAll(group);
}
