import * as THREE from "three";
import { mergeVertices } from "three/addons/utils/BufferGeometryUtils.js";

/* -------------------------------------------------------------------------- */
/* Geometry helpers shared by every procedural model.                          */
/* -------------------------------------------------------------------------- */

export function roundedRectShape(w: number, h: number, r: number) {
  const s = new THREE.Shape();
  const x = -w / 2;
  const y = -h / 2;
  r = Math.min(r, w / 2, h / 2);
  s.moveTo(x + r, y);
  s.lineTo(x + w - r, y);
  s.quadraticCurveTo(x + w, y, x + w, y + r);
  s.lineTo(x + w, y + h - r);
  s.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  s.lineTo(x + r, y + h);
  s.quadraticCurveTo(x, y + h, x, y + h - r);
  s.lineTo(x, y + r);
  s.quadraticCurveTo(x, y, x + r, y);
  return s;
}

export function roundedRectPath(w: number, h: number, r: number) {
  const p = new THREE.Path();
  const x = -w / 2;
  const y = -h / 2;
  r = Math.min(r, w / 2, h / 2);
  p.moveTo(x + r, y);
  p.quadraticCurveTo(x, y, x, y + r);
  p.lineTo(x, y + h - r);
  p.quadraticCurveTo(x, y + h, x + r, y + h);
  p.lineTo(x + w - r, y + h);
  p.quadraticCurveTo(x + w, y + h, x + w, y + h - r);
  p.lineTo(x + w, y + r);
  p.quadraticCurveTo(x + w, y, x + w - r, y);
  p.lineTo(x + r, y);
  return p;
}

/**
 * Extrudes a shape, centres it on Z and re-groups materials:
 *   0 → back cap, 1 → sides, 2 → front cap.
 * Cap UVs are normalised to [0,1] across the shape bounds so textures
 * (logos, engravings) map predictably.
 */
export function extrudeShape(
  shape: THREE.Shape,
  depth: number,
  bevel = 0,
  opts: { curveSegments?: number; bevelSegments?: number } = {},
) {
  const g = new THREE.ExtrudeGeometry(shape, {
    depth,
    bevelEnabled: bevel > 0,
    bevelThickness: bevel,
    bevelSize: bevel,
    bevelSegments: opts.bevelSegments ?? 4,
    curveSegments: opts.curveSegments ?? 16,
  });
  g.translate(0, 0, -depth / 2);
  g.computeBoundingBox();
  const bb = g.boundingBox!;
  const w = bb.max.x - bb.min.x;
  const h = bb.max.y - bb.min.y;
  const pos = g.attributes.position;
  const uv = g.attributes.uv;
  const caps = g.groups[0];
  const sides = g.groups[1];
  for (let i = caps.start; i < caps.start + caps.count; i++) {
    uv.setXY(i, (pos.getX(i) - bb.min.x) / w, (pos.getY(i) - bb.min.y) / h);
  }
  uv.needsUpdate = true;
  const half = caps.count / 2;
  // Determine which half is the back (−Z) cap.
  const firstZ = pos.getZ(caps.start);
  const firstIsBack = firstZ < 0;
  g.clearGroups();
  g.addGroup(caps.start, half, firstIsBack ? 0 : 2);
  g.addGroup(caps.start + half, half, firstIsBack ? 2 : 0);
  if (sides) g.addGroup(sides.start, sides.count, 1);
  return g;
}

export function extrudeRounded(
  w: number,
  h: number,
  depth: number,
  r: number,
  bevel = 0,
  opts: { curveSegments?: number; bevelSegments?: number; holes?: THREE.Path[] } = {},
) {
  const shape = roundedRectShape(w - bevel * 2, h - bevel * 2, Math.max(0.0001, r - bevel));
  if (opts.holes) shape.holes.push(...opts.holes);
  return extrudeShape(shape, Math.max(0.0001, depth - bevel * 2), bevel, opts);
}

/**
 * A subdivided box projected onto a rounded box. Unlike RoundedBoxGeometry it
 * keeps evenly spaced vertices across faces so it can be deformed (fabric,
 * leather, soft goods). UVs are planar (top view by default).
 */
export function softBox(
  w: number,
  h: number,
  d: number,
  radius: number,
  segments: [number, number, number],
  deform?: (p: THREE.Vector3) => void,
  uvPlane: "xz" | "xy" = "xz",
) {
  let g: THREE.BufferGeometry = new THREE.BoxGeometry(1, 1, 1, ...segments);
  g.deleteAttribute("normal");
  g.deleteAttribute("uv");
  g = mergeVertices(g, 1e-5);
  const pos = g.attributes.position;
  const r = Math.min(radius, w / 2, h / 2, d / 2);
  const inner = new THREE.Vector3(w / 2 - r, h / 2 - r, d / 2 - r);
  const p = new THREE.Vector3();
  const q = new THREE.Vector3();
  for (let i = 0; i < pos.count; i++) {
    p.set(pos.getX(i) * w, pos.getY(i) * h, pos.getZ(i) * d);
    q.set(
      THREE.MathUtils.clamp(p.x, -inner.x, inner.x),
      THREE.MathUtils.clamp(p.y, -inner.y, inner.y),
      THREE.MathUtils.clamp(p.z, -inner.z, inner.z),
    );
    const n = p.clone().sub(q);
    if (n.lengthSq() > 0) n.normalize().multiplyScalar(r);
    p.copy(q).add(n);
    deform?.(p);
    pos.setXYZ(i, p.x, p.y, p.z);
  }
  planarUV(g, uvPlane);
  g.computeVertexNormals();
  return g;
}

export function planarUV(g: THREE.BufferGeometry, plane: "xz" | "xy" | "zy" = "xz") {
  g.computeBoundingBox();
  const bb = g.boundingBox!;
  const pos = g.attributes.position;
  const uv = new Float32Array(pos.count * 2);
  const [a, b] = plane === "xz" ? ["x", "z"] : plane === "xy" ? ["x", "y"] : ["z", "y"];
  const minA = bb.min[a as "x"];
  const minB = bb.min[b as "x"];
  const sa = bb.max[a as "x"] - minA || 1;
  const sb = bb.max[b as "x"] - minB || 1;
  const v = new THREE.Vector3();
  for (let i = 0; i < pos.count; i++) {
    v.fromBufferAttribute(pos, i);
    uv[i * 2] = (v[a as "x"] - minA) / sa;
    uv[i * 2 + 1] = plane === "xz" ? 1 - (v[b as "x"] - minB) / sb : (v[b as "x"] - minB) / sb;
  }
  g.setAttribute("uv", new THREE.BufferAttribute(uv, 2));
  return g;
}

/**
 * Lofts superellipse cross-sections along the X axis.
 * `section(t)` returns centre (y,z), width (z extent), height (y extent) and
 * the superellipse exponent (2 = ellipse, higher = boxier).
 * Optional `bottomExp` lets the lower half be flatter than the top.
 */
export type LoftSection = {
  x: number;
  cy: number;
  cz?: number;
  w: number;
  h: number;
  n: number;
  nBottom?: number;
};

export function loft(
  stations: number,
  ring: number,
  section: (t: number) => LoftSection,
  phiRange: [number, number] = [0, Math.PI * 2],
) {
  const closed = phiRange[1] - phiRange[0] >= Math.PI * 2 - 1e-6;
  const cols = closed ? ring : ring + 1;
  const positions: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];
  const spow = (v: number, e: number) => Math.sign(v) * Math.pow(Math.abs(v), e);
  for (let i = 0; i <= stations; i++) {
    const t = i / stations;
    const s = section(t);
    for (let j = 0; j < cols; j++) {
      const phi = phiRange[0] + ((phiRange[1] - phiRange[0]) * j) / ring;
      const c = Math.cos(phi);
      const sn = Math.sin(phi);
      const n = sn < 0 && s.nBottom ? s.nBottom : s.n;
      const y = s.cy + (s.h / 2) * spow(sn, 2 / n);
      const z = (s.cz ?? 0) + (s.w / 2) * spow(c, 2 / n);
      positions.push(s.x, y, z);
      uvs.push(t, j / ring);
    }
  }
  for (let i = 0; i < stations; i++) {
    for (let j = 0; j < (closed ? ring : ring); j++) {
      const a = i * cols + j;
      const b = i * cols + ((j + 1) % cols);
      const c = (i + 1) * cols + j;
      const d = (i + 1) * cols + ((j + 1) % cols);
      if (!closed && j === cols - 1) continue;
      indices.push(a, c, b, b, c, d);
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  g.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
  g.setIndex(indices);
  g.computeVertexNormals();
  return g;
}

/** Sweeps a superellipse profile around a circle in the XY plane (rings). */
export function ringSweep(
  radius: number,
  segments: number,
  profileSegments: number,
  profile: (theta: number) => { w: number; t: number; n: number },
) {
  const positions: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];
  const spow = (v: number, e: number) => Math.sign(v) * Math.pow(Math.abs(v), e);
  for (let i = 0; i <= segments; i++) {
    const theta = (i / segments) * Math.PI * 2;
    const p = profile(theta);
    const dir = new THREE.Vector3(Math.sin(theta), Math.cos(theta), 0);
    for (let j = 0; j <= profileSegments; j++) {
      const phi = (j / profileSegments) * Math.PI * 2;
      const radial = (p.t / 2) * spow(Math.cos(phi), 2 / p.n);
      const axial = (p.w / 2) * spow(Math.sin(phi), 2 / p.n);
      // Profile is centred so the inner surface stays on the finger circle.
      const rr = radius + p.t / 2 + radial;
      positions.push(dir.x * rr, dir.y * rr, axial);
      uvs.push(i / segments, j / profileSegments);
    }
  }
  const cols = profileSegments + 1;
  for (let i = 0; i < segments; i++)
    for (let j = 0; j < profileSegments; j++) {
      const a = i * cols + j;
      const b = a + 1;
      const c = a + cols;
      const d = c + 1;
      indices.push(a, b, c, b, d, c);
    }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  g.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
  g.setIndex(indices);
  g.computeVertexNormals();
  return g;
}

/** Deterministic smooth pseudo-noise for vertex deformation. */
export function noise3(x: number, y: number, z: number) {
  return (
    Math.sin(x * 1.7 + Math.sin(z * 2.3)) * 0.5 +
    Math.sin(z * 1.3 + Math.sin(y * 3.1 + x)) * 0.35 +
    Math.sin((x + z) * 3.7) * 0.15
  );
}

export function enableShadows(obj: THREE.Object3D, cast = true, receive = true) {
  obj.traverse((o) => {
    if ((o as THREE.Mesh).isMesh) {
      o.castShadow = cast;
      o.receiveShadow = receive;
    }
  });
  return obj;
}

/** Centres an object so its bounding box sits on y=0, centred in x/z. */
export function groundObject(obj: THREE.Object3D) {
  obj.updateMatrixWorld(true);
  const box = new THREE.Box3().setFromObject(obj);
  const c = box.getCenter(new THREE.Vector3());
  obj.position.x -= c.x;
  obj.position.z -= c.z;
  obj.position.y -= box.min.y;
  return obj;
}

export function disposeObject(obj: THREE.Object3D) {
  obj.traverse((o) => {
    const m = o as THREE.Mesh;
    if (m.geometry) m.geometry.dispose();
    const mats = Array.isArray(m.material) ? m.material : m.material ? [m.material] : [];
    mats.forEach((mat) => mat.dispose());
  });
}
