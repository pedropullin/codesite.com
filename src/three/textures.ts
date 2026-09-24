import * as THREE from "three";

/* -------------------------------------------------------------------------- */
/* Procedural textures (canvas based). No external image downloads needed.    */
/* -------------------------------------------------------------------------- */

const cache = new Map<string, THREE.Texture>();

function memo<T extends THREE.Texture>(key: string, make: () => T): T {
  const hit = cache.get(key);
  if (hit) return hit as T;
  const t = make();
  cache.set(key, t);
  return t;
}

export function disposeTextureCache() {
  cache.forEach((t) => t.dispose());
  cache.clear();
}

function canvas(w: number, h = w) {
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  return c;
}

/* Seeded value noise ------------------------------------------------------- */

function hash2(x: number, y: number, seed: number) {
  let h = x * 374761393 + y * 668265263 + seed * 2147483647;
  h = (h ^ (h >>> 13)) * 1274126177;
  h = h ^ (h >>> 16);
  return (h >>> 0) / 4294967295;
}

function smooth(t: number) {
  return t * t * (3 - 2 * t);
}

/** Tileable value noise sampled on an integer lattice of `period` cells. */
function valueNoise(x: number, y: number, period: number, seed: number) {
  const xi = Math.floor(x);
  const yi = Math.floor(y);
  const xf = x - xi;
  const yf = y - yi;
  const w = (v: number) => ((v % period) + period) % period;
  const a = hash2(w(xi), w(yi), seed);
  const b = hash2(w(xi + 1), w(yi), seed);
  const c = hash2(w(xi), w(yi + 1), seed);
  const d = hash2(w(xi + 1), w(yi + 1), seed);
  const u = smooth(xf);
  const v = smooth(yf);
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
}

function fbm(
  x: number,
  y: number,
  period: number,
  octaves: number,
  seed: number,
) {
  let amp = 0.5;
  let sum = 0;
  let norm = 0;
  let p = period;
  let fx = x;
  let fy = y;
  for (let o = 0; o < octaves; o++) {
    sum += amp * valueNoise(fx, fy, p, seed + o * 17);
    norm += amp;
    amp *= 0.5;
    fx *= 2;
    fy *= 2;
    p *= 2;
  }
  return sum / norm;
}

/* Height field → normal map ---------------------------------------------- */

function heightToNormalTexture(
  height: Float32Array,
  size: number,
  strength: number,
  repeat: number,
) {
  const c = canvas(size);
  const ctx = c.getContext("2d")!;
  const img = ctx.createImageData(size, size);
  const at = (x: number, y: number) =>
    height[((y + size) % size) * size + ((x + size) % size)];
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const dx = (at(x + 1, y) - at(x - 1, y)) * strength;
      const dy = (at(x, y + 1) - at(x, y - 1)) * strength;
      const nx = -dx;
      const ny = dy;
      const nz = 1;
      const len = Math.hypot(nx, ny, nz);
      const i = (y * size + x) * 4;
      img.data[i] = ((nx / len) * 0.5 + 0.5) * 255;
      img.data[i + 1] = ((ny / len) * 0.5 + 0.5) * 255;
      img.data[i + 2] = ((nz / len) * 0.5 + 0.5) * 255;
      img.data[i + 3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);
  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(repeat, repeat);
  tex.colorSpace = THREE.NoColorSpace;
  tex.anisotropy = 8;
  return tex;
}

function field(size: number, fn: (u: number, v: number) => number) {
  const h = new Float32Array(size * size);
  for (let y = 0; y < size; y++)
    for (let x = 0; x < size; x++) h[y * size + x] = fn(x / size, y / size);
  return h;
}

export type TextureQuality = "high" | "medium" | "low";
const sizeFor = (q: TextureQuality, high = 512) =>
  q === "high" ? high : q === "medium" ? high / 2 : high / 4;

/** Cotton jersey: fine knit columns + soft irregularity. */
export function fabricNormal(q: TextureQuality = "high", repeat = 6) {
  return memo(`fabric-${q}-${repeat}`, () => {
    const size = sizeFor(q);
    const h = field(size, (u, v) => {
      const cols = 64;
      const knit = Math.abs(Math.sin((u * cols + Math.abs(Math.sin(v * 128 * Math.PI)) * 0.35) * Math.PI));
      return knit * 0.35 + fbm(u * 16, v * 16, 16, 3, 3) * 0.65;
    });
    return heightToNormalTexture(h, size, 2.2, repeat);
  });
}

/** Rib knit: pronounced vertical ribs. */
export function ribNormal(q: TextureQuality = "high", ribs = 48, repeat = 1) {
  return memo(`rib-${q}-${ribs}-${repeat}`, () => {
    const size = sizeFor(q);
    const h = field(size, (u, v) => {
      const r = Math.pow(Math.abs(Math.sin(u * ribs * Math.PI)), 0.6);
      return r * 0.85 + fbm(u * 32, v * 32, 32, 2, 9) * 0.15;
    });
    return heightToNormalTexture(h, size, 4, repeat);
  });
}

/** Pebbled leather grain. */
export function leatherNormal(q: TextureQuality = "high", repeat = 3) {
  return memo(`leather-${q}-${repeat}`, () => {
    const size = sizeFor(q);
    const h = field(size, (u, v) => {
      const n = fbm(u * 24, v * 24, 24, 3, 21);
      const ridged = 1 - Math.abs(n * 2 - 1);
      return Math.pow(ridged, 3) * 0.8 + fbm(u * 64, v * 64, 64, 2, 5) * 0.2;
    });
    return heightToNormalTexture(h, size, 3.2, repeat);
  });
}

/** Brushed metal: long horizontal streaks. */
export function brushedNormal(q: TextureQuality = "high", repeat = 1) {
  return memo(`brushed-${q}-${repeat}`, () => {
    const size = sizeFor(q);
    const h = field(size, (u, v) => fbm(u * 2, v * 256, 2, 3, 41));
    return heightToNormalTexture(h, size, 1.6, repeat);
  });
}

/** Soft-touch coated paperboard. */
export function paperNormal(q: TextureQuality = "high", repeat = 2) {
  return memo(`paper-${q}-${repeat}`, () => {
    const size = sizeFor(q);
    const h = field(size, (u, v) => fbm(u * 32, v * 32, 32, 4, 77));
    return heightToNormalTexture(h, size, 1.1, repeat);
  });
}

/** Twisted rope strands (diagonal). */
export function ropeNormal(q: TextureQuality = "high") {
  return memo(`rope-${q}`, () => {
    const size = sizeFor(q, 256);
    const h = field(size, (u, v) => {
      const s = Math.abs(Math.sin((u * 3 + v * 6) * Math.PI * 2));
      return Math.pow(s, 0.5) * 0.85 + fbm(u * 16, v * 16, 16, 2, 13) * 0.15;
    });
    const t = heightToNormalTexture(h, size, 5, 1);
    t.repeat.set(1, 12);
    return t;
  });
}

/* Typography textures ------------------------------------------------------ */

export type LogoTextureOptions = {
  lines: { text: string; size: number; weight?: number; tracking?: number; stretch?: string; offsetY?: number }[];
  width?: number;
  height?: number;
  fontFamily?: string;
  /** Draw a thin frame line inset from the edge. */
  frame?: number;
  background?: string;
  foreground?: string;
  blur?: number;
};

let defaultFontFamily = "Archivo, 'Helvetica Neue', Arial, sans-serif";
export function setTextureFontFamily(family: string) {
  if (family) defaultFontFamily = family;
}

/**
 * White-on-black typographic mask. Used as bump map (deboss/emboss),
 * roughness/metalness masks (foil) or emissive map.
 */
export function logoCanvas(opts: LogoTextureOptions) {
  const width = opts.width ?? 1024;
  const height = opts.height ?? 1024;
  const c = canvas(width, height);
  const ctx = c.getContext("2d")!;
  ctx.fillStyle = opts.background ?? "#000";
  ctx.fillRect(0, 0, width, height);
  ctx.fillStyle = opts.foreground ?? "#fff";
  ctx.strokeStyle = opts.foreground ?? "#fff";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  if (opts.blur) ctx.filter = `blur(${opts.blur}px)`;
  for (const line of opts.lines) {
    const px = line.size * height;
    const c2 = ctx as CanvasRenderingContext2D & { letterSpacing?: string };
    c2.fontStretch = (line.stretch ?? "extra-expanded") as CanvasFontStretch;
    c2.letterSpacing = `${(line.tracking ?? 0.2) * px}px`;
    ctx.font = `${line.weight ?? 500} ${px}px ${opts.fontFamily ?? defaultFontFamily}`;
    // letterSpacing adds trailing space; compensate to keep optical centre.
    const shift = ((line.tracking ?? 0.2) * px) / 2;
    ctx.fillText(line.text, width / 2 + shift, height / 2 + (line.offsetY ?? 0) * height);
  }
  if (opts.frame) {
    const f = opts.frame * Math.min(width, height);
    ctx.lineWidth = Math.max(2, height * 0.004);
    ctx.strokeRect(f, f, width - f * 2, height - f * 2);
  }
  return c;
}

export function canvasTexture(
  c: HTMLCanvasElement,
  colorSpace: THREE.ColorSpace = THREE.NoColorSpace,
) {
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = colorSpace;
  t.anisotropy = 8;
  t.needsUpdate = true;
  return t;
}

export function logoTexture(key: string, opts: LogoTextureOptions, colorSpace: THREE.ColorSpace = THREE.NoColorSpace) {
  return memo(`logo-${key}`, () => canvasTexture(logoCanvas(opts), colorSpace));
}

/** Inverts a mask canvas (white ↔ black) and remaps to [lo, hi]. */
export function remapCanvas(src: HTMLCanvasElement, lo: number, hi: number) {
  const c = canvas(src.width, src.height);
  const ctx = c.getContext("2d")!;
  ctx.drawImage(src, 0, 0);
  const img = ctx.getImageData(0, 0, c.width, c.height);
  for (let i = 0; i < img.data.length; i += 4) {
    const t = img.data[i] / 255;
    const v = (lo + (hi - lo) * t) * 255;
    img.data[i] = img.data[i + 1] = img.data[i + 2] = v;
  }
  ctx.putImageData(img, 0, 0);
  return c;
}

/** Composites a colour base with a mask to produce an albedo map. */
export function tintCanvas(mask: HTMLCanvasElement, base: string, ink: string) {
  const c = canvas(mask.width, mask.height);
  const ctx = c.getContext("2d")!;
  ctx.fillStyle = base;
  ctx.fillRect(0, 0, c.width, c.height);
  const inkC = canvas(mask.width, mask.height);
  const ictx = inkC.getContext("2d")!;
  ictx.fillStyle = ink;
  ictx.fillRect(0, 0, c.width, c.height);
  ictx.globalCompositeOperation = "destination-in";
  // Use mask luminance as alpha.
  const m = canvas(mask.width, mask.height);
  const mctx = m.getContext("2d")!;
  mctx.drawImage(mask, 0, 0);
  const img = mctx.getImageData(0, 0, m.width, m.height);
  for (let i = 0; i < img.data.length; i += 4) {
    img.data[i + 3] = img.data[i];
  }
  mctx.putImageData(img, 0, 0);
  ictx.drawImage(m, 0, 0);
  ctx.drawImage(inkC, 0, 0);
  return c;
}

/** Radial soft gradient used for fake contact shadows / glows. */
export function radialTexture(inner = "rgba(0,0,0,0.85)", outer = "rgba(0,0,0,0)") {
  return memo(`radial-${inner}-${outer}`, () => {
    const c = canvas(256);
    const ctx = c.getContext("2d")!;
    const g = ctx.createRadialGradient(128, 128, 0, 128, 128, 128);
    g.addColorStop(0, inner);
    g.addColorStop(1, outer);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 256, 256);
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    return t;
  });
}

/** Dashed stitch line mask along the border of a rounded rectangle. */
export function stitchCanvas(
  width: number,
  height: number,
  inset: number,
  radius: number,
  dash = 14,
  gap = 9,
) {
  const c = canvas(width, height);
  const ctx = c.getContext("2d")!;
  ctx.fillStyle = "#000";
  ctx.fillRect(0, 0, width, height);
  ctx.strokeStyle = "#fff";
  ctx.lineWidth = Math.max(2, height * 0.006);
  ctx.setLineDash([dash, gap]);
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.roundRect(inset, inset, width - inset * 2, height - inset * 2, radius);
  ctx.stroke();
  return c;
}
