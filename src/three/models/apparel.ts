import * as THREE from "three";
import { extrudeRounded, noise3, softBox } from "../geometry";
import { brushedSteel, fabric, PALETTE, ribFabric } from "../materials";
import { canvasTexture, logoCanvas, tintCanvas, ribNormal, type TextureQuality } from "../textures";

type Opts = { quality?: TextureQuality; color?: string; printColor?: string };

const seg = (q: TextureQuality, hi: number) => (q === "high" ? hi : q === "medium" ? Math.round(hi * 0.6) : Math.round(hi * 0.35));

function shadowAll(g: THREE.Object3D) {
  g.traverse((o) => {
    if ((o as THREE.Mesh).isMesh) {
      o.castShadow = true;
      o.receiveShadow = true;
    }
  });
  return g;
}

/**
 * Soft folded garment body lying on the XZ plane (collar towards −Z).
 * Pillow-shaped with a subtle fold crease and organic irregularity.
 */
function foldedBody(w: number, h: number, d: number, q: TextureQuality, softness = 1) {
  return softBox(
    w,
    h,
    d,
    h * 0.4,
    [seg(q, 44), 6, seg(q, 52)],
    (p) => {
      const nx = (p.x / (w / 2));
      const nz = (p.z / (d / 2));
      const inner = Math.max(0, 1 - Math.pow(Math.abs(nx), 6)) * Math.max(0, 1 - Math.pow(Math.abs(nz), 6));
      if (p.y > 0) {
        p.y += inner * h * 0.22 * softness;
        // sloped shoulders towards the top corners
        p.y -= Math.max(0, -nz - 0.75) * Math.pow(Math.abs(nx), 2) * h * 0.9;
        // horizontal fold crease two-thirds down
        p.y -= Math.exp(-Math.pow((nz - 0.38) / 0.035, 2)) * h * 0.1 * inner;
        // shoulder fold creases near the sides
        p.y -= Math.exp(-Math.pow((Math.abs(nx) - 0.78) / 0.05, 2)) * h * 0.08 * inner;
      } else {
        p.y += inner * h * 0.06;
      }
      const n = noise3(p.x * 3.1, 0, p.z * 2.7);
      p.y += n * h * 0.035 * softness * (p.y > 0 ? 1 : 0.3);
      p.x += noise3(p.z * 2.3, 1, p.x) * 0.006;
    },
  );
}

function chestPrint(text: string, sub: string | null, w: number, d: number) {
  return logoCanvas({
    width: 1024,
    height: Math.round(1024 * (d / w)),
    lines: [
      { text, size: 0.028, weight: 500, tracking: 0.5, offsetY: -0.2 },
      ...(sub ? [{ text: sub, size: 0.012, weight: 500, tracking: 0.7, offsetY: -0.17 }] : []),
    ],
  });
}

/**
 * Neckline: U-shaped front rib + straight back band, with the inside of the
 * back visible between them (darker) and a woven label.
 */
function neckline(
  radius: number,
  tube: number,
  rib: THREE.Material,
  insideColor: string,
  q: TextureQuality,
) {
  const g = new THREE.Group();
  const front = new THREE.Mesh(
    new THREE.TorusGeometry(radius, tube, seg(q, 14), seg(q, 56), Math.PI),
    rib,
  );
  // Arc from +x through +z to −x (a "U" opening towards the back).
  front.rotation.x = Math.PI / 2;
  front.scale.set(1, 0.78, 0.6);
  g.add(front);
  const backCurve = new THREE.QuadraticBezierCurve3(
    new THREE.Vector3(-radius, 0, 0),
    new THREE.Vector3(0, tube * 0.4, -radius * 0.28),
    new THREE.Vector3(radius, 0, 0),
  );
  const back = new THREE.Mesh(new THREE.TubeGeometry(backCurve, seg(q, 32), tube * 0.95, seg(q, 12), false), rib);
  back.scale.set(1, 0.6, 1);
  g.add(back);
  const shape = new THREE.Shape();
  shape.moveTo(-radius, 0);
  shape.quadraticCurveTo(0, -radius * 0.28, radius, 0);
  shape.absellipse(0, 0, radius, radius * 0.78, 0, -Math.PI, true, 0);
  const inside = new THREE.Mesh(
    new THREE.ShapeGeometry(shape, 24),
    new THREE.MeshStandardMaterial({ color: insideColor, roughness: 1 }),
  );
  inside.rotation.x = Math.PI / 2;
  inside.position.y = -tube * 0.35;
  g.add(inside);
  const labelMask = logoCanvas({ width: 256, height: 96, lines: [{ text: "VAULT", size: 0.34, weight: 600, tracking: 0.3 }] });
  const label = new THREE.Mesh(
    new THREE.PlaneGeometry(radius * 0.5, radius * 0.19),
    new THREE.MeshStandardMaterial({ map: canvasTexture(tintCanvas(labelMask, "#111112", "#d8d8d8"), THREE.SRGBColorSpace), roughness: 0.8 }),
  );
  label.rotation.x = -Math.PI / 2;
  label.position.set(0, -tube * 0.3, radius * 0.05);
  g.add(label);
  return g;
}

export function createFoldedTee({ quality = "high", color = PALETTE.ink, printColor }: Opts = {}) {
  const W = 1.1;
  const H = 0.13;
  const D = 1.32;
  const group = new THREE.Group();
  const base = new THREE.Color(color);
  const ink = printColor ?? (base.getHSL({ h: 0, s: 0, l: 0 }).l > 0.5 ? "#141414" : "#3b3b3e");

  const printMask = chestPrint("VAULT ASSOCIATION", null, W, D);
  const body = fabric(color, { quality });
  body.map = canvasTexture(tintCanvas(printMask, color, ink), THREE.SRGBColorSpace);
  body.color.set("#ffffff");
  const mesh = new THREE.Mesh(foldedBody(W, H, D, quality), body);
  group.add(mesh);

  // Neckline (rib) with the inside back visible
  const collarMat = ribFabric(color, { quality }, 40, 6, 1);
  const neckR = 0.2;
  const neck = neckline(neckR, 0.032, collarMat, new THREE.Color(color).multiplyScalar(0.55).getStyle(), quality);
  neck.position.set(0, H * 0.62 + 0.022, -D / 2 + 0.1);
  group.add(neck);

  // Metal hem tag
  const tag = new THREE.Mesh(extrudeRounded(0.09, 0.034, 0.008, 0.008, 0.002), brushedSteel({ quality }));
  tag.rotation.x = -Math.PI / 2;
  tag.position.set(W * 0.34, H * 0.62, D * 0.43);
  group.add(tag);

  return shadowAll(group);
}

export function createFoldedCrewneck({ quality = "high", color = PALETTE.bone }: Opts = {}) {
  const W = 1.16;
  const H = 0.19;
  const D = 1.34;
  const group = new THREE.Group();
  const mask = chestPrint("VAULT", "ASSOCIATION", W, D);
  const body = fabric(color, { quality }, 5);
  body.bumpMap = canvasTexture(mask);
  body.bumpScale = 3;
  const mesh = new THREE.Mesh(foldedBody(W, H, D, quality, 1.1), body);
  group.add(mesh);
  const collarMat = ribFabric(color, { quality }, 36, 6, 1);
  const neck = neckline(0.21, 0.042, collarMat, new THREE.Color(color).multiplyScalar(0.6).getStyle(), quality);
  neck.position.set(0, H * 0.64 + 0.03, -D / 2 + 0.11);
  group.add(neck);
  // Rib hem visible at the bottom edge
  const hem = new THREE.Mesh(
    softBox(W * 0.96, H * 0.55, 0.11, H * 0.25, [seg(quality, 30), 3, 3]),
    ribFabric(color, { quality }, 90, 1, 1),
  );
  hem.position.set(0, H * 0.2, D / 2 - 0.05);
  group.add(hem);
  return shadowAll(group);
}

export function createFoldedHoodie({ quality = "high", color = PALETTE.graphite }: Opts = {}) {
  const W = 1.22;
  const H = 0.21;
  const D = 1.4;
  const group = new THREE.Group();
  const bodyMat = fabric(color, { quality }, 5);
  const printMask = chestPrint("VAULT", null, W, D);
  bodyMat.bumpMap = canvasTexture(printMask);
  bodyMat.bumpScale = 2.5;
  group.add(new THREE.Mesh(foldedBody(W, H, D, quality, 1.2), bodyMat));

  // Hood folded over the top edge.
  const hoodW = 0.78;
  const hoodD = 0.62;
  const hood = new THREE.Mesh(
    softBox(hoodW, 0.12, hoodD, 0.058, [seg(quality, 30), 4, seg(quality, 26)], (p) => {
      const nz = (p.z + hoodD / 2) / hoodD; // 0 at back, 1 at front
      p.x *= 1 - nz * 0.32;
      // convex front edge and rounded back corners
      p.z -= Math.pow(p.x / (hoodW / 2), 2) * 0.09 * nz;
      p.z += Math.pow(p.x / (hoodW / 2), 4) * 0.06 * (1 - nz);
      if (p.y > 0) p.y += (1 - Math.pow(Math.abs(p.x / (hoodW / 2)), 4)) * 0.035;
      // centre seam
      p.y -= Math.exp(-Math.pow(p.x / 0.012, 2)) * 0.008;
      p.y += noise3(p.x * 4, 2, p.z * 4) * 0.004;
    }),
    fabric(color, { quality }, 4),
  );
  hood.position.set(0, H * 0.78, -D / 2 + hoodD / 2 - 0.02);
  group.add(hood);

  // Hood opening rim
  const rim = new THREE.Mesh(
    new THREE.TorusGeometry(0.22, 0.028, seg(quality, 14), seg(quality, 60), Math.PI),
    ribFabric(color, { quality }, 30, 4, 1),
  );
  rim.rotation.x = -Math.PI / 2;
  rim.scale.set(1.25, 1, 1);
  rim.position.set(0, H * 0.78 + 0.075, -D / 2 + hoodD - 0.06);
  group.add(rim);

  // Waxed drawcords with brushed steel aglets
  const cordMat = new THREE.MeshStandardMaterial({ color: new THREE.Color(color).multiplyScalar(0.8), roughness: 0.55 });
  const steel = brushedSteel({ quality });
  for (const side of [-1, 1]) {
    const start = new THREE.Vector3(side * 0.07, H * 0.78 + 0.08, -D / 2 + hoodD - 0.05);
    const curve = new THREE.CatmullRomCurve3([
      start,
      new THREE.Vector3(side * 0.09, H * 1.05, -D / 2 + hoodD + 0.05),
      new THREE.Vector3(side * 0.12 + 0.02 * side, H * 0.95, -D / 2 + hoodD + 0.22),
      new THREE.Vector3(side * 0.1, H * 0.92, -D / 2 + hoodD + 0.42),
    ]);
    const cord = new THREE.Mesh(new THREE.TubeGeometry(curve, seg(quality, 48), 0.011, 10, false), cordMat);
    group.add(cord);
    const end = curve.getPoint(1);
    const tan = curve.getTangent(1);
    const aglet = new THREE.Mesh(new THREE.CylinderGeometry(0.016, 0.016, 0.07, 20), steel);
    aglet.position.copy(end).add(tan.clone().multiplyScalar(0.03));
    aglet.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), tan);
    group.add(aglet);
  }
  return shadowAll(group);
}

export function createCap({ quality = "high", color = PALETTE.ink }: Opts = {}) {
  const group = new THREE.Group();
  const R = 0.5;
  // Crown
  const panels = 6;
  const seamMask = document.createElement("canvas");
  seamMask.width = 1024;
  seamMask.height = 512;
  {
    const ctx = seamMask.getContext("2d")!;
    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, 1024, 512);
    ctx.strokeStyle = "#fff";
    for (let i = 0; i < panels; i++) {
      const x = ((i + 0.5) / panels) * 1024;
      ctx.lineWidth = 7;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, 512);
      ctx.stroke();
      ctx.lineWidth = 2;
      ctx.setLineDash([7, 6]);
      for (const off of [-12, 12]) {
        ctx.beginPath();
        ctx.moveTo(x + off, 30);
        ctx.lineTo(x + off, 512);
        ctx.stroke();
      }
      ctx.setLineDash([]);
    }
    // sweatband stitching
    ctx.lineWidth = 3;
    ctx.setLineDash([8, 6]);
    ctx.beginPath();
    ctx.moveTo(0, 470);
    ctx.lineTo(1024, 470);
    ctx.stroke();
  }
  const crownMat = fabric(color, { quality }, 8);
  crownMat.roughness = 0.8;
  crownMat.clearcoat = 0.08;
  crownMat.bumpMap = canvasTexture(seamMask);
  crownMat.bumpScale = -1.6;
  const crownGeo = new THREE.SphereGeometry(R, seg(quality, 72), seg(quality, 36), 0, Math.PI * 2, 0, Math.PI / 2);
  // Flatten slightly, lengthen front-to-back
  crownGeo.scale(1, 0.95, 1.1);
  {
    // Structured front: raise the front panels, let the back slope down.
    const cp = crownGeo.attributes.position;
    for (let i = 0; i < cp.count; i++) {
      const z = cp.getZ(i) / (R * 1.1);
      const y = cp.getY(i);
      cp.setY(i, y * (1 + 0.24 * z));
      if (z > 0) cp.setZ(i, cp.getZ(i) + (y / R) * 0.06 * z);
    }
    crownGeo.computeVertexNormals();
  }
  const crown = new THREE.Mesh(crownGeo, crownMat);
  crown.rotation.y = Math.PI / panels; // seam centred at front
  group.add(crown);

  // Front embroidered monogram (raised)
  const vaMask = logoCanvas({ width: 512, height: 256, lines: [{ text: "VA", size: 0.5, weight: 700, tracking: 0.12 }] });
  const va = new THREE.Mesh(
    new THREE.PlaneGeometry(0.22, 0.11),
    new THREE.MeshStandardMaterial({
      color: "#8f9196",
      roughness: 0.55,
      metalness: 0.2,
      alphaMap: canvasTexture(vaMask),
      transparent: true,
      bumpMap: canvasTexture(vaMask),
      bumpScale: 1,
    }),
  );
  va.position.set(0, 0.27, R * 1.1 * 0.84);
  va.rotation.x = -0.5;
  group.add(va);

  // Button
  const button = new THREE.Mesh(new THREE.SphereGeometry(0.045, 24, 12), crownMat);
  button.scale.set(1, 0.45, 1);
  button.position.y = R * 1.0;
  group.add(button);

  // Brim: crescent extruded then bent
  const outer = 0.92;
  const shape = new THREE.Shape();
  const steps = 48;
  const a0 = -Math.PI * 0.42;
  const a1 = Math.PI * 0.42;
  for (let i = 0; i <= steps; i++) {
    const a = a0 + ((a1 - a0) * i) / steps;
    const x = Math.sin(a) * R * 1.02;
    const z = Math.cos(a) * R * 1.1 * 1.02;
    if (i === 0) shape.moveTo(x, z);
    else shape.lineTo(x, z);
  }
  for (let i = steps; i >= 0; i--) {
    const a = a0 + ((a1 - a0) * i) / steps;
    const reach = Math.pow(Math.cos((a / (a1 - a0)) * Math.PI), 0.9);
    const x = Math.sin(a) * R * 1.02 * (1 + 0.02 * reach);
    const z = Math.cos(a) * R * 1.1 * 1.02 + reach * (outer - R * 0.95) * 0.95;
    shape.lineTo(x, z);
  }
  const brimGeo = new THREE.ExtrudeGeometry(shape, {
    depth: 0.026,
    bevelEnabled: true,
    bevelThickness: 0.01,
    bevelSize: 0.01,
    bevelSegments: 3,
    curveSegments: 24,
  });
  brimGeo.rotateX(Math.PI / 2);
  const bp = brimGeo.attributes.position;
  for (let i = 0; i < bp.count; i++) {
    const x = bp.getX(i);
    const z = bp.getZ(i);
    const y = bp.getY(i);
    bp.setY(i, y - x * x * 0.55 - Math.max(0, z - R) * 0.12);
  }
  brimGeo.computeVertexNormals();
  const brim = new THREE.Mesh(brimGeo, crownMat);
  brim.position.y = 0.02;
  group.add(brim);

  // Sweatband / base ring
  const band = new THREE.Mesh(
    new THREE.TorusGeometry(R, 0.012, 10, seg(quality, 96)),
    crownMat,
  );
  band.rotation.x = Math.PI / 2;
  band.scale.set(1, 1.1, 1);
  band.position.y = 0.01;
  group.add(band);

  // Eyelets
  const eyeletMat = new THREE.MeshStandardMaterial({ color: new THREE.Color(color).multiplyScalar(0.7), roughness: 0.8 });
  for (let i = 0; i < panels; i++) {
    const a = (i / panels) * Math.PI * 2 + Math.PI / panels * 2;
    const theta = 0.62; // from top
    const e = new THREE.Mesh(new THREE.TorusGeometry(0.014, 0.005, 8, 20), eyeletMat);
    const p = new THREE.Vector3(Math.sin(a) * Math.sin(theta) * R, Math.cos(theta) * R * 1.0, Math.cos(a) * Math.sin(theta) * R * 1.1);
    e.position.copy(p);
    e.lookAt(p.clone().multiplyScalar(2));
    group.add(e);
  }
  return shadowAll(group);
}

export function createBeanie({ quality = "high", color = PALETTE.ink }: Opts = {}) {
  const group = new THREE.Group();
  const profile: THREE.Vector2[] = [];
  const R = 0.42;
  const Hc = 0.52;
  profile.push(new THREE.Vector2(0.001, Hc + 0.3));
  const domeSteps = 14;
  for (let i = 1; i <= domeSteps; i++) {
    const a = (i / domeSteps) * (Math.PI / 2);
    profile.push(new THREE.Vector2(Math.sin(a) * R, Hc + Math.cos(a) * 0.3));
  }
  profile.push(new THREE.Vector2(R * 1.01, 0.1));
  profile.push(new THREE.Vector2(R * 0.98, 0.0));
  const bodyGeo = new THREE.LatheGeometry(profile, seg(quality, 96));
  const ribs = ribNormal(quality, 64).clone();
  ribs.repeat.set(2, 1);
  ribs.needsUpdate = true;
  const bodyMat = fabric(color, { quality });
  bodyMat.normalMap = ribs;
  bodyMat.normalScale = new THREE.Vector2(1.1, 1.1);
  const body = new THREE.Mesh(bodyGeo, bodyMat);
  group.add(body);

  // Folded cuff
  const cuffProfile = [
    new THREE.Vector2(R * 1.0, -0.005),
    new THREE.Vector2(R * 1.07, 0.0),
    new THREE.Vector2(R * 1.085, 0.04),
    new THREE.Vector2(R * 1.085, 0.2),
    new THREE.Vector2(R * 1.07, 0.235),
    new THREE.Vector2(R * 1.02, 0.245),
  ];
  const cuffGeo = new THREE.LatheGeometry(cuffProfile, seg(quality, 96));
  const cuffMat = fabric(color, { quality });
  const cuffRibs = ribNormal(quality, 64).clone();
  cuffRibs.repeat.set(2, 1);
  cuffRibs.needsUpdate = true;
  cuffMat.normalMap = cuffRibs;
  cuffMat.normalScale = new THREE.Vector2(1.2, 1.2);
  group.add(new THREE.Mesh(cuffGeo, cuffMat));

  // Metal plate on the cuff
  const plateMask = logoCanvas({ width: 512, height: 192, lines: [{ text: "VAULT", size: 0.34, weight: 500, tracking: 0.45 }] });
  const plateMat = brushedSteel({ quality });
  const engraved = brushedSteel({ quality });
  engraved.bumpMap = canvasTexture(plateMask);
  engraved.bumpScale = -2;
  const plate = new THREE.Mesh(extrudeRounded(0.2, 0.075, 0.014, 0.014, 0.004), [plateMat, plateMat, engraved]);
  plate.position.set(0, 0.12, R * 1.085 + 0.006);
  group.add(plate);
  return shadowAll(group);
}

/* -------------------------------------------------------------------------- */
/* Flat-lay garments (product photography, top-down)                            */
/* -------------------------------------------------------------------------- */

type FlatOpts = Opts & { sleeves?: "short" | "long"; hood?: boolean; pocket?: boolean; print?: "chest" | "emboss" | "none" };

function flatPanel(w: number, h: number, d: number, q: TextureQuality, wrinkle = 1, extra?: (p: THREE.Vector3) => void) {
  return softBox(w, h, d, h * 0.45, [seg(q, 34), 4, seg(q, 40)], (p) => {
    const nx = p.x / (w / 2);
    const nz = p.z / (d / 2);
    const inner = Math.max(0, 1 - Math.pow(Math.abs(nx), 8)) * Math.max(0, 1 - Math.pow(Math.abs(nz), 8));
    if (p.y > 0) p.y += inner * h * 0.35;
    p.y += noise3(p.x * 4.2 + 3, 0, p.z * 3.6) * h * 0.22 * wrinkle * (p.y > 0 ? 1 : 0.2);
    p.y += noise3(p.x * 9, 1, p.z * 8) * h * 0.06 * wrinkle;
    extra?.(p);
  });
}

export function createFlatLayGarment({
  quality = "high",
  color = PALETTE.ink,
  sleeves = "short",
  hood = false,
  pocket = false,
  print = "chest",
}: FlatOpts = {}) {
  const group = new THREE.Group();
  const W = 1.0;
  const D = 1.28;
  const H = 0.06;
  const bodyMat = fabric(color, { quality }, 5);
  const base = new THREE.Color(color);
  const light = base.getHSL({ h: 0, s: 0, l: 0 }).l > 0.5;
  if (print === "chest") {
    const mask = chestPrint("VAULT ASSOCIATION", null, W, D);
    bodyMat.map = canvasTexture(tintCanvas(mask, color, light ? "#141414" : "#8a8b8f"), THREE.SRGBColorSpace);
    bodyMat.color = new THREE.Color("#ffffff");
  } else if (print === "emboss") {
    const mask = logoCanvas({
      width: 1024,
      height: Math.round(1024 * (D / W)),
      lines: [
        { text: "VAULT", size: 0.05, weight: 500, tracking: 0.42, offsetY: -0.22 },
        { text: "ASSOCIATION", size: 0.016, weight: 500, tracking: 0.65, offsetY: -0.185 },
      ],
    });
    bodyMat.bumpMap = canvasTexture(mask);
    bodyMat.bumpScale = 3;
  }

  // Body with sloped shoulders.
  const body = new THREE.Mesh(
    flatPanel(W, H, D, quality, 1, (p) => {
      const top = -D / 2;
      if (p.z < top + 0.2 && Math.abs(p.x) > 0.2) {
        const k = Math.min(1, (top + 0.2 - p.z) / 0.2);
        p.z += (Math.abs(p.x) - 0.2) * 0.22 * k;
      }
    }),
    bodyMat,
  );
  group.add(body);

  // Sleeves
  const sleeveMat = fabric(color, { quality }, 5);
  for (const side of [-1, 1]) {
    if (sleeves === "short") {
      const sl = new THREE.Mesh(flatPanel(0.44, H * 0.92, 0.4, quality, 1.2), sleeveMat);
      sl.position.set(side * (W / 2 + 0.1), -0.004, -D / 2 + 0.3);
      sl.rotation.y = -side * 0.62;
      group.add(sl);
    } else {
      const len = 1.06;
      const sl = new THREE.Mesh(
        flatPanel(0.3, H * 0.92, len, quality, 1.3, (p) => {
          // taper towards the cuff
          const k = (p.z + len / 2) / len;
          p.x *= 1 - k * 0.22;
        }),
        sleeveMat,
      );
      sl.position.set(side * (W / 2 + 0.13), -0.004, -D / 2 + len / 2 + 0.06);
      sl.rotation.y = -side * 0.2;
      group.add(sl);
      const cuff = new THREE.Mesh(
        softBox(0.25, H * 0.85, 0.12, 0.02, [12, 3, 4]),
        ribFabric(color, { quality }, 50, 1, 1),
      );
      const end = new THREE.Vector3(0, 0, len / 2 + 0.05).applyAxisAngle(new THREE.Vector3(0, 1, 0), -side * 0.2);
      cuff.position.copy(sl.position).add(end);
      cuff.rotation.y = -side * 0.2;
      group.add(cuff);
    }
  }

  // Rib hem for long-sleeve garments.
  if (sleeves === "long") {
    const hem = new THREE.Mesh(
      softBox(W * 0.94, H * 0.9, 0.12, 0.02, [seg(quality, 30), 3, 4]),
      ribFabric(color, { quality }, 110, 1, 1),
    );
    hem.position.set(0, 0.002, D / 2 + 0.03);
    group.add(hem);
  }

  // Neckline
  const topY = H * 0.5 + H * 0.25;
  if (!hood) {
    const neck = neckline(
      sleeves === "long" ? 0.19 : 0.18,
      sleeves === "long" ? 0.036 : 0.028,
      ribFabric(color, { quality }, 40, 6, 1),
      new THREE.Color(color).multiplyScalar(light ? 0.72 : 0.5).getStyle(),
      quality,
    );
    neck.position.set(0, topY, -D / 2 + 0.07);
    group.add(neck);
  } else {
    const hoodMat = fabric(color, { quality }, 5);
    const hw = 0.66;
    const hd = 0.56;
    const hoodMesh = new THREE.Mesh(
      flatPanel(hw, H * 1.1, hd, quality, 1.1, (p) => {
        const nz = (p.z + hd / 2) / hd; // 0 top, 1 bottom
        // rounded crown of the hood
        p.x *= 0.72 + 0.28 * Math.sin(Math.min(1, nz * 1.6) * Math.PI / 2);
      }),
      hoodMat,
    );
    hoodMesh.position.set(0, 0.01, -D / 2 - hd / 2 + 0.16);
    group.add(hoodMesh);
    // Hood opening (V) with lining
    const shape = new THREE.Shape();
    shape.moveTo(-0.2, 0);
    shape.quadraticCurveTo(-0.2, 0.3, 0, 0.36);
    shape.quadraticCurveTo(0.2, 0.3, 0.2, 0);
    shape.quadraticCurveTo(0, -0.12, -0.2, 0);
    const opening = new THREE.Mesh(
      new THREE.ShapeGeometry(shape, 24),
      new THREE.MeshStandardMaterial({ color: new THREE.Color(color).multiplyScalar(0.45), roughness: 1 }),
    );
    opening.rotation.x = -Math.PI / 2;
    opening.position.set(0, topY + 0.03, -D / 2 + 0.1);
    group.add(opening);
    const rimCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-0.2, 0, 0),
      new THREE.Vector3(-0.17, 0, -0.24),
      new THREE.Vector3(0, 0, -0.36),
      new THREE.Vector3(0.17, 0, -0.24),
      new THREE.Vector3(0.2, 0, 0),
      new THREE.Vector3(0, 0, 0.1),
    ], true);
    const rim = new THREE.Mesh(new THREE.TubeGeometry(rimCurve, seg(quality, 64), 0.03, 10, true), ribFabric(color, { quality }, 30, 6, 1));
    rim.scale.set(1, 0.6, 1);
    rim.position.copy(opening.position);
    group.add(rim);
    // Drawcords + steel aglets
    const cordMat = new THREE.MeshStandardMaterial({ color: new THREE.Color(color).multiplyScalar(0.85), roughness: 0.5 });
    const steel = brushedSteel({ quality });
    for (const side of [-1, 1]) {
      const curve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(side * 0.06, topY + 0.04, -D / 2 + 0.2),
        new THREE.Vector3(side * 0.09, topY + 0.03, -D / 2 + 0.38),
        new THREE.Vector3(side * 0.07 + side * 0.03, topY + 0.02, -D / 2 + 0.58),
      ]);
      group.add(new THREE.Mesh(new THREE.TubeGeometry(curve, 32, 0.012, 10, false), cordMat));
      const end = curve.getPoint(1);
      const tan = curve.getTangent(1);
      const aglet = new THREE.Mesh(new THREE.CylinderGeometry(0.017, 0.017, 0.075, 20), steel);
      aglet.position.copy(end).add(tan.clone().multiplyScalar(0.035));
      aglet.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), tan);
      group.add(aglet);
    }
  }

  if (pocket) {
    const pk = new THREE.Mesh(
      flatPanel(0.62, H * 0.5, 0.32, quality, 0.6, (p) => {
        const nz = (p.z + 0.16) / 0.32;
        // trapezoid: wider at the bottom
        p.x *= 0.8 + nz * 0.2;
      }),
      fabric(color, { quality }, 5),
    );
    pk.position.set(0, H * 0.5, D / 2 - 0.27);
    group.add(pk);
  }

  // Metal hem tag (brand detail)
  const tag = new THREE.Mesh(extrudeRounded(0.085, 0.032, 0.008, 0.008, 0.002), brushedSteel({ quality }));
  tag.rotation.x = -Math.PI / 2;
  tag.position.set(W * 0.36, H * 0.75, D / 2 - (sleeves === "long" ? 0.08 : 0.06));
  group.add(tag);

  return shadowAll(group);
}
