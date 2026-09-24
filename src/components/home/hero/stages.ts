/** Scroll narrative of the hero — shared by the WebGL scene, the 2.5D fallback and the overlays. */

export const STAGE_BOUNDS = [0, 0.14, 0.34, 0.58, 0.8, 1] as const;

export const STAGE_LABELS = ["Object", "Form", "Inside", "Focus", "Collection"] as const;

export const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);
export const seg = (p: number, a: number, b: number) => clamp01((p - a) / (b - a));
export const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
export const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

export function stages(p: number) {
  const [a, b, c, d, e, f] = STAGE_BOUNDS;
  return {
    s1: seg(p, a, b),
    s2: seg(p, b, c),
    s3: seg(p, c, d),
    s4: seg(p, d, e),
    s5: seg(p, e, f),
  };
}

export function activeStage(p: number) {
  for (let i = STAGE_BOUNDS.length - 2; i >= 0; i--) if (p >= STAGE_BOUNDS[i]) return i;
  return 0;
}
