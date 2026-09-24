import * as THREE from "three";
import { extrudeRounded, loft, softBox, type LoftSection } from "../geometry";
import {
  brushedSteel,
  chrome,
  leather,
  nubuck,
  PALETTE,
  rubber,
  satinEva,
  smokeTranslucent,
} from "../materials";
import { canvasTexture, logoCanvas, type TextureQuality } from "../textures";

const seg = (q: TextureQuality, hi: number) => (q === "high" ? hi : q === "medium" ? Math.round(hi * 0.6) : Math.max(8, Math.round(hi * 0.35)));

function lerpTable(t: number, xs: number[], ys: number[]) {
  if (t <= xs[0]) return ys[0];
  for (let i = 1; i < xs.length; i++) {
    if (t <= xs[i]) {
      const k = (t - xs[i - 1]) / (xs[i] - xs[i - 1]);
      const s = k * k * (3 - 2 * k);
      return ys[i - 1] + (ys[i] - ys[i - 1]) * s;
    }
  }
  return ys[ys.length - 1];
}

/** Rounds both ends of a loft so it closes smoothly. */
function endCap(t: number, heel = 0.07, toe = 0.13) {
  const a = Math.min(1, t / heel);
  const b = Math.min(1, (1 - t) / toe);
  return Math.sqrt(Math.max(0, 1 - (1 - a) * (1 - a))) * Math.sqrt(Math.max(0, 1 - (1 - b) * (1 - b)));
}

export type RunnerColorway = "black" | "bone" | "chrome";

export function createRunner({
  quality = "high",
  colorway = "black",
}: { quality?: TextureQuality; colorway?: RunnerColorway } = {}) {
  const group = new THREE.Group();
  const L = 2.6;
  const X = (t: number) => -L / 2 + t * L;
  const S = seg(quality, 96);
  const R = seg(quality, 56);
  const phi: [number, number] = [-Math.PI / 2, (3 * Math.PI) / 2];

  const footW = (t: number) => lerpTable(t, [0, 0.16, 0.42, 0.7, 0.88, 1], [0.74, 0.8, 0.74, 1.0, 0.92, 0.7]);
  const toeSpring = (t: number) => 0.13 * Math.pow(Math.max(0, (t - 0.78) / 0.22), 2);
  const soleH = (t: number) => lerpTable(t, [0, 0.3, 0.7, 1], [0.34, 0.31, 0.25, 0.22]);

  const midColor = colorway === "black" ? "#e9e5dc" : colorway === "bone" ? "#f1eee8" : "#2c2d31";
  const upperColor = colorway === "black" ? "#141415" : colorway === "bone" ? PALETTE.bone : "#c8cace";

  /* Midsole + outsole */
  const soleSection = (t: number): LoftSection => {
    const e = endCap(t, 0.05, 0.1);
    return { x: X(t), cy: soleH(t) / 2 + toeSpring(t) + 0.05, w: 1.0 * footW(t) * e, h: (soleH(t) - 0.05) * Math.max(0.35, e), n: 5, nBottom: 9 };
  };
  const midsoleMat = colorway === "chrome" ? smokeTranslucent() : satinEva(midColor);
  if (colorway !== "chrome") (midsoleMat as THREE.MeshPhysicalMaterial).roughness = 0.55;
  const midsole = new THREE.Mesh(loft(S, R, soleSection, phi), midsoleMat);
  group.add(midsole);

  const outsole = new THREE.Mesh(
    loft(S, R, (t) => {
      const e = endCap(t, 0.05, 0.1);
      return { x: X(t), cy: 0.035 + toeSpring(t) * 1.02, w: 1.02 * footW(t) * e, h: 0.07 * Math.max(0.4, e), n: 6, nBottom: 12 };
    }, phi),
    rubber(colorway === "bone" ? "#3a3b3f" : "#0f0f10"),
  );
  group.add(outsole);

  /* Upper */
  const soleTop = (t: number) => soleH(t) + toeSpring(t);
  const upperH = (t: number) => lerpTable(t, [0, 0.08, 0.3, 0.42, 0.62, 0.8, 0.95, 1], [0.6, 0.66, 0.64, 0.6, 0.5, 0.41, 0.3, 0.24]);
  const upperSection = (scale = 1, heightScale = 1) => (t: number): LoftSection => {
    const e = endCap(t, 0.06, 0.12);
    const h = upperH(t) * Math.max(0.3, e) * heightScale;
    return {
      x: X(t) * (scale > 1 ? 1 + (scale - 1) * 0.3 : 1),
      cy: soleTop(t) - 0.05 + h / 2,
      w: 0.9 * footW(t) * e * scale,
      h: h * scale,
      n: 2.3,
      nBottom: 10,
    };
  };

  // Side panel seams + model name debossed in UV space.
  const sideMask = document.createElement("canvas");
  sideMask.width = 2048;
  sideMask.height = 1024;
  {
    const ctx = sideMask.getContext("2d")!;
    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, 2048, 1024);
    ctx.strokeStyle = "#fff";
    ctx.lineWidth = 5;
    // seam lines on both sides (v≈0.25 and v≈0.75)
    for (const base of [0.3, 0.7]) {
      ctx.beginPath();
      ctx.moveTo(0.2 * 2048, base * 1024);
      ctx.bezierCurveTo(0.35 * 2048, (base + (base < 0.5 ? 0.1 : -0.1)) * 1024, 0.5 * 2048, (base + (base < 0.5 ? 0.14 : -0.14)) * 1024, 0.62 * 2048, 0.5 * 1024);
      ctx.stroke();
    }
    ctx.fillStyle = "#fff";
    ctx.font = "600 34px Archivo, sans-serif";
    (ctx as CanvasRenderingContext2D & { letterSpacing: string }).letterSpacing = "10px";
    ctx.save();
    ctx.translate(0.24 * 2048, 0.34 * 1024);
    ctx.scale(1, -1);
    ctx.fillText("VA-01", 0, 0);
    ctx.restore();
    ctx.save();
    ctx.translate(0.24 * 2048, 0.66 * 1024);
    ctx.fillText("VA-01", 0, 0);
    ctx.restore();
  }
  const upperMat = colorway === "chrome"
    ? new THREE.MeshPhysicalMaterial({ color: upperColor, metalness: 0.95, roughness: 0.22, clearcoat: 0.6 })
    : nubuck(upperColor, { quality });
  upperMat.bumpMap = canvasTexture(sideMask);
  upperMat.bumpScale = -1.5;
  const upper = new THREE.Mesh(loft(S, R, upperSection(), phi), upperMat);
  group.add(upper);

  // Overlays: toe cap and heel counter in smooth leather.
  const overlayMat = colorway === "chrome"
    ? new THREE.MeshPhysicalMaterial({ color: "#e3e4e7", metalness: 1, roughness: 0.12 })
    : leather(colorway === "black" ? "#0c0c0d" : "#ddd7ca", { quality });
  const toe = new THREE.Mesh(
    loft(Math.round(S * 0.35), R, (t) => {
      const k = Math.min(1, t / 0.25);
      return upperSection(1 + 0.016 * k * k * (3 - 2 * k))(0.76 + t * 0.24);
    }),
    overlayMat,
  );
  group.add(toe);
  const heel = new THREE.Mesh(
    loft(Math.round(S * 0.35), R, (t) => {
      const k = Math.min(1, (1 - t) / 0.3);
      const sc = 1 + 0.014 * k * k * (3 - 2 * k);
      const s = upperSection(sc, 0.72)(t * 0.26);
      return { ...s, cy: s.cy - (upperH(t * 0.26) * (1 - 0.72)) / 2 };
    }),
    overlayMat,
  );
  group.add(heel);

  /* Collar opening: a patch sampled on the upper's surface + padded rim */
  const topAt = (t: number, z: number) => {
    const sct = upperSection()(t);
    const k = Math.min(1, Math.abs(z) / (sct.w / 2));
    return sct.cy + (sct.h / 2) * Math.pow(Math.max(0, 1 - Math.pow(k, 2.3)), 1 / 2.3);
  };
  const collarT = 0.19;
  const aT = 0.115;
  const aZ = 0.25;
  const rings = 10;
  const spokes = seg(quality, 48);
  const pPos: number[] = [];
  const pCol: number[] = [];
  const pIdx: number[] = [];
  for (let r = 0; r <= rings; r++) {
    const rr = r / rings;
    for (let k = 0; k < spokes; k++) {
      const a = (k / spokes) * Math.PI * 2;
      const t = collarT + Math.cos(a) * aT * rr;
      const z = Math.sin(a) * aZ * rr;
      // Sink the centre to suggest depth.
      const y = topAt(t, z) + 0.006 - (1 - rr * rr) * 0.05;
      pPos.push(X(t), y, z);
      const c = 0.012 + rr * rr * 0.05;
      pCol.push(c, c, c);
    }
  }
  for (let r = 0; r < rings; r++)
    for (let k = 0; k < spokes; k++) {
      const a = r * spokes + k;
      const b = r * spokes + ((k + 1) % spokes);
      const c = (r + 1) * spokes + k;
      const d = (r + 1) * spokes + ((k + 1) % spokes);
      pIdx.push(a, b, c, b, d, c);
    }
  const patchGeo = new THREE.BufferGeometry();
  patchGeo.setAttribute("position", new THREE.Float32BufferAttribute(pPos, 3));
  patchGeo.setAttribute("color", new THREE.Float32BufferAttribute(pCol, 3));
  patchGeo.setIndex(pIdx);
  patchGeo.computeVertexNormals();
  const opening = new THREE.Mesh(
    patchGeo,
    new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 1, polygonOffset: true, polygonOffsetFactor: -4, polygonOffsetUnits: -4 }),
  );
  group.add(opening);
  const rimPts: THREE.Vector3[] = [];
  for (let k = 0; k < 40; k++) {
    const a = (k / 40) * Math.PI * 2;
    const t = collarT + Math.cos(a) * aT;
    const z = Math.sin(a) * aZ;
    rimPts.push(new THREE.Vector3(X(t), topAt(t, z) + 0.012, z));
  }
  const rimCurve = new THREE.CatmullRomCurve3(rimPts, true);
  const collarMat = colorway === "chrome" ? overlayMat : nubuck(colorway === "black" ? "#1c1c1e" : "#d8d2c5", { quality });
  const collar = new THREE.Mesh(new THREE.TubeGeometry(rimCurve, seg(quality, 96), 0.045, seg(quality, 12), true), collarMat);
  group.add(collar);

  // Tongue
  const tongue = new THREE.Mesh(
    softBox(0.34, 0.07, 0.32, 0.03, [12, 3, 12], (p) => {
      p.y += Math.pow(p.x / 0.17, 2) * -0.02;
    }),
    upperMat.clone(),
  );
  (tongue.material as THREE.MeshPhysicalMaterial).bumpMap = null;
  tongue.position.set(X(collarT + aT + 0.02), topAt(collarT + aT + 0.02, 0) + 0.03, 0);
  tongue.rotation.z = 0.45;
  group.add(tongue);
  const tongueLabelMask = logoCanvas({ width: 256, height: 128, lines: [{ text: "VAULT", size: 0.3, weight: 700, tracking: 0.3 }] });
  const tongueLabel = new THREE.Mesh(
    new THREE.PlaneGeometry(0.16, 0.08),
    new THREE.MeshStandardMaterial({ map: canvasTexture(tongueLabelMask, THREE.SRGBColorSpace), roughness: 0.7 }),
  );
  tongueLabel.position.set(X(collarT + aT + 0.02) - 0.012, topAt(collarT + aT + 0.02, 0) + 0.068, 0);
  tongueLabel.rotation.order = "ZYX";
  tongueLabel.rotation.set(0, -Math.PI / 2, 0.45);
  group.add(tongueLabel);

  /* Laces + eyelets */
  const laceMat = new THREE.MeshStandardMaterial({
    color: colorway === "bone" ? "#ede9e0" : "#141415",
    roughness: 0.8,
  });
  const eyeletMat = chrome();
  const laceCount = 5;
  const laceGeo = new THREE.CapsuleGeometry(0.02, 0.36, 4, 10);
  laceGeo.rotateX(Math.PI / 2);
  const eyeletGeo = new THREE.TorusGeometry(0.028, 0.009, 8, 20);
  eyeletGeo.rotateX(Math.PI / 2);
  for (let i = 0; i < laceCount; i++) {
    const t = 0.44 + (i / (laceCount - 1)) * 0.26;
    const s = upperSection()(t);
    const y = s.cy + s.h / 2;
    const slope = (upperSection()(t + 0.01).cy + upperSection()(t + 0.01).h / 2 - y) / (L * 0.01);
    const lace = new THREE.Mesh(laceGeo, laceMat);
    lace.position.set(X(t), y + 0.012, 0);
    lace.rotation.set(0, (i % 2 ? 1 : -1) * 0.18, -Math.atan(slope));
    group.add(lace);
    for (const side of [-1, 1]) {
      const z = side * (s.w / 2) * 0.46;
      // height of the superellipse top at this z
      const yy = s.cy + (s.h / 2) * Math.pow(Math.max(0, 1 - Math.pow(Math.abs(z) / (s.w / 2), 2.3)), 1 / 2.3);
      const e = new THREE.Mesh(eyeletGeo, eyeletMat);
      e.position.set(X(t), yy + 0.004, z);
      e.rotation.x = -side * 0.5;
      group.add(e);
    }
  }

  /* Heel plate */
  const plateMask = logoCanvas({ width: 256, height: 192, lines: [{ text: "VA", size: 0.4, weight: 600, tracking: 0.2 }] });
  const steel = brushedSteel({ quality });
  const engraved = brushedSteel({ quality });
  engraved.bumpMap = canvasTexture(plateMask);
  engraved.bumpScale = -2;
  const plate = new THREE.Mesh(extrudeRounded(0.14, 0.1, 0.018, 0.02, 0.005), [steel, steel, engraved]);
  plate.position.set(X(0) - 0.005, soleTop(0) + 0.22, 0);
  plate.rotation.y = -Math.PI / 2;
  group.add(plate);

  group.traverse((o) => {
    if ((o as THREE.Mesh).isMesh) {
      o.castShadow = true;
      o.receiveShadow = true;
    }
  });
  return group;
}

export function createSlide({ quality = "high", color = PALETTE.ink }: { quality?: TextureQuality; color?: string } = {}) {
  const group = new THREE.Group();
  const L = 2.5;
  const X = (t: number) => -L / 2 + t * L;
  const S = seg(quality, 80);
  const R = seg(quality, 48);
  const footW = (t: number) => lerpTable(t, [0, 0.18, 0.42, 0.7, 0.9, 1], [0.78, 0.84, 0.76, 1.0, 0.92, 0.7]);
  const eva = satinEva(color);
  const bed = new THREE.Mesh(
    loft(S, R, (t) => {
      const e = endCap(t, 0.06, 0.1);
      return { x: X(t), cy: 0.16, w: 1.02 * footW(t) * e, h: 0.32 * Math.max(0.4, e), n: 6, nBottom: 10 };
    }, [-Math.PI / 2, (3 * Math.PI) / 2]),
    eva,
  );
  group.add(bed);
  // Footbed dish (slightly darker, matte)
  const dish = new THREE.Mesh(
    loft(S, R, (t) => {
      const e = endCap(t, 0.08, 0.12);
      return { x: X(t) * 0.97, cy: 0.305, w: 0.86 * footW(t) * e, h: 0.02, n: 6 };
    }, [-Math.PI / 2, (3 * Math.PI) / 2]),
    satinEva(new THREE.Color(color).multiplyScalar(0.8).getStyle()),
  );
  (dish.material as THREE.MeshPhysicalMaterial).roughness = 0.7;
  group.add(dish);

  // Strap: soft slab bent into an arch across the forefoot.
  const strapW = 1.22;
  const strapD = 0.72;
  const mask = logoCanvas({ width: 1024, height: 600, lines: [{ text: "VAULT", size: 0.16, weight: 500, tracking: 0.5 }] });
  const strapMat = satinEva(color);
  strapMat.bumpMap = canvasTexture(mask);
  strapMat.bumpScale = -2.2;
  const strapGeo = softBox(strapW, 0.09, strapD, 0.04, [seg(quality, 40), 3, seg(quality, 16)], undefined, "xz");
  const pos = strapGeo.attributes.position;
  const Rarc = 0.5;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const y = pos.getY(i);
    const a = (x / (strapW / 2)) * (Math.PI * 0.42);
    const r = Rarc + y;
    pos.setXYZ(i, Math.sin(a) * r, Math.cos(a) * r - Rarc * Math.cos(Math.PI * 0.42) + 0.16, pos.getZ(i));
  }
  strapGeo.computeVertexNormals();
  const strap = new THREE.Mesh(strapGeo, strapMat);
  // Arch spans the width (z); rotate so the arch plane is YZ.
  strap.rotation.y = Math.PI / 2;
  strap.position.set(X(0.72), 0.2, 0);
  group.add(strap);

  group.traverse((o) => {
    if ((o as THREE.Mesh).isMesh) {
      o.castShadow = true;
      o.receiveShadow = true;
    }
  });
  return group;
}
