/** Client-safe helpers for analytics period filters. */

export const RANGE_PRESETS = [
  { value: "today", label: "Hoje" },
  { value: "7d", label: "7 dias" },
  { value: "30d", label: "30 dias" },
  { value: "90d", label: "90 dias" },
  { value: "1y", label: "1 ano" },
  { value: "custom", label: "Personalizado" },
] as const;

export type RangePreset = (typeof RANGE_PRESETS)[number]["value"];

/** Brazil (São Paulo) has a fixed UTC−3 offset. */
export const TZ_OFFSET_MS = 3 * 3600 * 1000;

function startOfDayBR(t: number) {
  const local = t - TZ_OFFSET_MS;
  return local - (local % 86400000) + TZ_OFFSET_MS;
}

export function resolveRange(preset: string | undefined, from?: string, to?: string, now = Date.now()) {
  const p = (RANGE_PRESETS.some((r) => r.value === preset) ? preset : "30d") as RangePreset;
  const endOfToday = startOfDayBR(now) + 86400000 - 1;
  const days = { today: 1, "7d": 7, "30d": 30, "90d": 90, "1y": 365 } as const;
  if (p === "custom" && from && to) {
    const f = Date.parse(`${from}T00:00:00-03:00`);
    const t = Date.parse(`${to}T23:59:59.999-03:00`);
    if (Number.isFinite(f) && Number.isFinite(t) && f <= t) {
      return { preset: p, start: new Date(f), end: new Date(t), days: Math.ceil((t - f) / 86400000) };
    }
  }
  const n = p === "custom" ? 30 : days[p];
  const start = startOfDayBR(now) - (n - 1) * 86400000;
  return { preset: p === "custom" ? "30d" : p, start: new Date(start), end: new Date(endOfToday), days: n };
}

export function isoDay(d: Date) {
  return new Date(d.getTime() - TZ_OFFSET_MS).toISOString().slice(0, 10);
}
