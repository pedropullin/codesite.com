"use client";

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { formatNumber, formatPrice, formatPriceCompact } from "@/lib/format";

/** Formatters are referenced by name so server components can configure charts. */
export type FormatKey = "price" | "priceCompact" | "number" | "orders" | "units" | "sessions";
const FORMATS: Record<FormatKey, (v: number) => string> = {
  price: formatPrice,
  priceCompact: formatPriceCompact,
  number: formatNumber,
  orders: (v) => `${formatNumber(v)} ${v === 1 ? "pedido" : "pedidos"}`,
  units: (v) => `${formatNumber(v)} un.`,
  sessions: (v) => `${formatNumber(v)} ${v === 1 ? "sessão" : "sessões"}`,
};

/* Chart tokens (brand ink on a light surface; single-series charts only). */
const INK = "#18181b";
const GRID = "#ebeae6";
const AXIS_TEXT = "#8a8b8f";
const SURFACE = "#ffffff";

function useWidth<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [width, setWidth] = useState(0);
  useEffect(() => {
    if (!ref.current) return;
    const ro = new ResizeObserver(([e]) => setWidth(e.contentRect.width));
    ro.observe(ref.current);
    return () => ro.disconnect();
  }, []);
  return [ref, width] as const;
}

function niceTicks(max: number, count = 4) {
  if (max <= 0) return [0, 1];
  const raw = max / count;
  const mag = Math.pow(10, Math.floor(Math.log10(raw)));
  const step = [1, 2, 2.5, 5, 10].map((m) => m * mag).find((s) => s >= raw) ?? raw;
  const top = Math.ceil(max / step) * step;
  const ticks: number[] = [];
  for (let v = 0; v <= top + step / 2; v += step) ticks.push(v);
  return ticks;
}

export type Point = { key: string; label: string; value: number };

function Tooltip({ x, y, width, children }: { x: number; y: number; width: number; children: ReactNode }) {
  const left = Math.min(Math.max(x, 70), width - 70);
  return (
    <div
      className="pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-full rounded-lg border border-border bg-card px-3 py-2 text-xs shadow-lg"
      style={{ left, top: y - 10 }}
    >
      {children}
    </div>
  );
}

function DataTable({ data, valueLabel, format }: { data: Point[]; valueLabel: string; format: (v: number) => string }) {
  return (
    <details className="group border-t border-border px-5 py-3 text-xs">
      <summary className="cursor-pointer select-none text-muted-foreground hover:text-foreground">Ver dados em tabela</summary>
      <div className="mt-3 max-h-56 overflow-auto">
        <table className="w-full text-left">
          <thead className="text-muted-foreground">
            <tr><th className="py-1 font-medium">Período</th><th className="py-1 text-right font-medium">{valueLabel}</th></tr>
          </thead>
          <tbody className="tabular-nums">
            {data.map((d) => (
              <tr key={d.key} className="border-t border-border/60"><td className="py-1">{d.label}</td><td className="py-1 text-right">{format(d.value)}</td></tr>
            ))}
          </tbody>
        </table>
      </div>
    </details>
  );
}

/** Single-series area chart with crosshair tooltip (hover + keyboard). */
export function AreaChart({
  data,
  format: formatKey,
  axisFormat: axisKey,
  valueLabel,
  height = 240,
  tickEvery,
}: {
  data: Point[];
  format: FormatKey;
  axisFormat?: FormatKey;
  valueLabel: string;
  height?: number;
  tickEvery?: number;
}) {
  const format = FORMATS[formatKey];
  const [ref, width] = useWidth<HTMLDivElement>();
  const [active, setActive] = useState<number | null>(null);
  const pad = { l: 68, r: 16, t: 16, b: 28 };
  const w = Math.max(0, width - pad.l - pad.r);
  const h = height - pad.t - pad.b;
  const max = Math.max(...data.map((d) => d.value), 0);
  const ticks = niceTicks(max);
  const top = ticks[ticks.length - 1] || 1;
  const x = (i: number) => pad.l + (data.length <= 1 ? w / 2 : (i / (data.length - 1)) * w);
  const y = (v: number) => pad.t + h - (v / top) * h;
  const line = useMemo(() => data.map((d, i) => `${i ? "L" : "M"}${x(i).toFixed(1)},${y(d.value).toFixed(1)}`).join(""), [data, width, top]); // eslint-disable-line react-hooks/exhaustive-deps
  const area = data.length ? `${line}L${x(data.length - 1)},${pad.t + h}L${x(0)},${pad.t + h}Z` : "";
  const every = tickEvery ?? Math.max(1, Math.ceil(data.length / Math.max(2, Math.floor(w / 72))));
  const peak = data.reduce((best, d, i) => (d.value > (data[best]?.value ?? -1) ? i : best), 0);
  const fmtAxis = axisKey ? FORMATS[axisKey] : format;

  const onMove = (clientX: number) => {
    const r = ref.current?.getBoundingClientRect();
    if (!r || data.length === 0) return;
    const rel = clientX - r.left - pad.l;
    const i = Math.round((rel / Math.max(1, w)) * (data.length - 1));
    setActive(Math.max(0, Math.min(data.length - 1, i)));
  };

  return (
    <div>
      <div ref={ref} className="relative px-2" style={{ height }}>
        {width > 0 && (
          <svg
            width={width}
            height={height}
            role="img"
            aria-label={`${valueLabel}: gráfico de área com ${data.length} pontos. Use as setas para navegar.`}
            tabIndex={0}
            className="absolute inset-0 focus:outline-none"
            onPointerMove={(e) => onMove(e.clientX)}
            onPointerLeave={() => setActive(null)}
            onKeyDown={(e) => {
              if (e.key === "ArrowRight") setActive((a) => Math.min(data.length - 1, (a ?? -1) + 1));
              if (e.key === "ArrowLeft") setActive((a) => Math.max(0, (a ?? data.length) - 1));
              if (e.key === "Escape") setActive(null);
            }}
            onBlur={() => setActive(null)}
          >
            {ticks.map((t) => (
              <g key={t}>
                <line x1={pad.l} x2={pad.l + w} y1={y(t)} y2={y(t)} stroke={GRID} strokeWidth={1} />
                <text x={pad.l - 10} y={y(t)} dy="0.32em" textAnchor="end" fontSize={11} fill={AXIS_TEXT} className="tabular-nums">
                  {fmtAxis(t)}
                </text>
              </g>
            ))}
            {data.map((d, i) =>
              i % every === 0 ? (
                <text key={d.key} x={x(i)} y={height - 8} textAnchor="middle" fontSize={11} fill={AXIS_TEXT}>
                  {d.label}
                </text>
              ) : null,
            )}
            <path d={area} fill={INK} fillOpacity={0.08} />
            <path d={line} fill="none" stroke={INK} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
            {data.length > 0 && active === null && (
              <g>
                <circle cx={x(peak)} cy={y(data[peak].value)} r={6} fill={SURFACE} />
                <circle cx={x(peak)} cy={y(data[peak].value)} r={4} fill={INK} />
                <text x={x(peak)} y={y(data[peak].value) - 12} textAnchor={peak > data.length * 0.85 ? "end" : peak < data.length * 0.15 ? "start" : "middle"} fontSize={11} fontWeight={600} fill={INK}>
                  {format(data[peak].value)}
                </text>
              </g>
            )}
            {active !== null && data[active] && (
              <g>
                <line x1={x(active)} x2={x(active)} y1={pad.t} y2={pad.t + h} stroke={INK} strokeOpacity={0.25} strokeWidth={1} />
                <circle cx={x(active)} cy={y(data[active].value)} r={6} fill={SURFACE} />
                <circle cx={x(active)} cy={y(data[active].value)} r={4} fill={INK} />
              </g>
            )}
          </svg>
        )}
        {active !== null && data[active] && (
          <Tooltip x={x(active) + 8} y={y(data[active].value)} width={width}>
            <p className="text-sm font-semibold tabular-nums">{format(data[active].value)}</p>
            <p className="mt-0.5 flex items-center gap-1.5 text-muted-foreground">
              <span className="inline-block h-0.5 w-3 rounded" style={{ background: INK }} />
              {valueLabel} · {data[active].label}
            </p>
          </Tooltip>
        )}
      </div>
      <DataTable data={data} valueLabel={valueLabel} format={format} />
    </div>
  );
}

/** Single-series column chart; each column is its own hover/focus target. */
export function ColumnChart({ data, format: formatKey, valueLabel, height = 200 }: { data: Point[]; format: FormatKey; valueLabel: string; height?: number }) {
  const format = FORMATS[formatKey];
  const [ref, width] = useWidth<HTMLDivElement>();
  const [active, setActive] = useState<number | null>(null);
  const pad = { l: 40, r: 12, t: 14, b: 26 };
  const w = Math.max(0, width - pad.l - pad.r);
  const h = height - pad.t - pad.b;
  const ticks = niceTicks(Math.max(...data.map((d) => d.value), 0), 3);
  const top = ticks[ticks.length - 1] || 1;
  const band = data.length ? w / data.length : 0;
  const barW = Math.max(2, Math.min(24, band - 2));
  const every = Math.max(1, Math.ceil(data.length / Math.max(2, Math.floor(w / 64))));

  return (
    <div>
      <div ref={ref} className="relative px-2" style={{ height }}>
        {width > 0 && (
          <svg width={width} height={height} className="absolute inset-0" role="img" aria-label={`${valueLabel}: gráfico de colunas`} onPointerLeave={() => setActive(null)}>
            {ticks.map((t) => (
              <g key={t}>
                <line x1={pad.l} x2={pad.l + w} y1={pad.t + h - (t / top) * h} y2={pad.t + h - (t / top) * h} stroke={GRID} />
                <text x={pad.l - 8} y={pad.t + h - (t / top) * h} dy="0.32em" textAnchor="end" fontSize={11} fill={AXIS_TEXT}>
                  {t}
                </text>
              </g>
            ))}
            {data.map((d, i) => {
              const bh = (d.value / top) * h;
              const cx = pad.l + band * i + band / 2;
              const r = Math.min(4, barW / 2, bh);
              const x0 = cx - barW / 2;
              const y0 = pad.t + h - bh;
              const path = bh > 0 ? `M${x0},${pad.t + h}V${y0 + r}Q${x0},${y0} ${x0 + r},${y0}H${x0 + barW - r}Q${x0 + barW},${y0} ${x0 + barW},${y0 + r}V${pad.t + h}Z` : "";
              return (
                <g key={d.key}>
                  <rect
                    x={pad.l + band * i}
                    y={pad.t}
                    width={band}
                    height={h}
                    fill="transparent"
                    tabIndex={0}
                    aria-label={`${d.label}: ${format(d.value)}`}
                    onPointerEnter={() => setActive(i)}
                    onFocus={() => setActive(i)}
                    onBlur={() => setActive(null)}
                    className="focus:outline-none"
                  />
                  {path && <path d={path} fill={INK} fillOpacity={active === null || active === i ? 1 : 0.35} className="pointer-events-none transition-[fill-opacity]" />}
                  {i % every === 0 && (
                    <text x={cx} y={height - 8} textAnchor="middle" fontSize={11} fill={AXIS_TEXT}>
                      {d.label}
                    </text>
                  )}
                </g>
              );
            })}
          </svg>
        )}
        {active !== null && data[active] && (
          <Tooltip x={pad.l + band * active + band / 2 + 8} y={pad.t + h - (data[active].value / top) * h} width={width}>
            <p className="text-sm font-semibold tabular-nums">{format(data[active].value)}</p>
            <p className="mt-0.5 text-muted-foreground">{valueLabel} · {data[active].label}</p>
          </Tooltip>
        )}
      </div>
      <DataTable data={data} valueLabel={valueLabel} format={format} />
    </div>
  );
}

/** Ranked horizontal bars with the value at the tip. */
export function BarList({
  items,
  format: formatKey,
  empty = "Sem dados no período",
}: {
  items: { key: string; label: string; value: number; sub?: string; image?: string | null; href?: string }[];
  format: FormatKey;
  empty?: string;
}) {
  const format = FORMATS[formatKey];
  const max = Math.max(...items.map((i) => i.value), 0) || 1;
  if (!items.length) return <p className="px-5 py-10 text-center text-sm text-muted-foreground">{empty}</p>;
  return (
    <ul className="space-y-3.5 px-5 py-4">
      {items.map((it) => (
        <li key={it.key} className="group">
          <div className="flex items-center gap-3">
            {it.image !== undefined && (
              <span className="relative h-9 w-9 shrink-0 overflow-hidden rounded-md bg-[#ecebe6]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                {it.image && <img src={it.image} alt="" className="h-full w-full object-contain p-0.5" loading="lazy" />}
              </span>
            )}
            <div className="min-w-0 flex-1">
              <div className="flex items-baseline justify-between gap-3">
                <p className="truncate text-[13px]">{it.label}</p>
                <p className="shrink-0 text-[13px] font-semibold tabular-nums">{format(it.value)}</p>
              </div>
              <div className="mt-1.5 h-2 w-full rounded-full bg-[#f1f0ed]">
                <div className={cn("h-2 rounded-full transition-opacity group-hover:opacity-80")} style={{ width: `${Math.max(2, (it.value / max) * 100)}%`, background: INK }} />
              </div>
              {it.sub && <p className="mt-1 text-[11px] text-muted-foreground">{it.sub}</p>}
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}

/** Tiny sparkline for stat tiles (de-emphasised). */
export function Sparkline({ values, className }: { values: number[]; className?: string }) {
  if (values.length < 2) return null;
  const max = Math.max(...values) || 1;
  const W = 100;
  const H = 28;
  const pts = values.map((v, i) => `${((i / (values.length - 1)) * W).toFixed(1)},${(H - (v / max) * (H - 4) - 2).toFixed(1)}`).join(" ");
  return (
    <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className={cn("h-7 w-full", className)} aria-hidden>
      <polyline points={pts} fill="none" stroke="#b9bbbf" strokeWidth={1.5} vectorEffect="non-scaling-stroke" strokeLinejoin="round" />
    </svg>
  );
}
