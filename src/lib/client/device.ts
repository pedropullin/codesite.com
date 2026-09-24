"use client";

export type DeviceTier = "high" | "medium" | "low" | "none";

/** Detects WebGL support and picks a rendering tier for the 3D scene. */
export function detectDeviceTier(): DeviceTier {
  if (typeof window === "undefined") return "none";
  let gl: WebGLRenderingContext | WebGL2RenderingContext | null = null;
  try {
    const c = document.createElement("canvas");
    gl = (c.getContext("webgl2") || c.getContext("webgl")) as WebGLRenderingContext | null;
  } catch {
    gl = null;
  }
  if (!gl) return "none";
  const ext = gl.getExtension("WEBGL_debug_renderer_info");
  const renderer = ext ? String(gl.getParameter(ext.UNMASKED_RENDERER_WEBGL)).toLowerCase() : "";
  gl.getExtension("WEBGL_lose_context")?.loseContext();
  if (/swiftshader|llvmpipe|software|basic render/.test(renderer)) return "low";
  const nav = navigator as Navigator & { deviceMemory?: number };
  const memory = nav.deviceMemory ?? 8;
  const cores = nav.hardwareConcurrency ?? 8;
  const coarse = window.matchMedia("(pointer: coarse)").matches;
  const width = window.innerWidth;
  // Only genuinely weak hardware gets the stripped-down tier — a modern
  // phone should render at "medium" (full textures, antialiasing, near-native
  // pixel ratio), not the software-fallback quality.
  if (memory <= 2 || cores <= 2) return "low";
  if (coarse && width < 380 && memory <= 3) return "low";
  if (coarse || width < 1100 || memory <= 4) return "medium";
  return "high";
}

export function prefersReducedMotion() {
  return typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}
