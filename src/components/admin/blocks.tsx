import Link from "next/link";
import type { ReactNode } from "react";
import { RANGE_PRESETS } from "@/lib/analytics-range";
import { Card, Delta } from "./ui";
import { Sparkline } from "./charts";
import { cn } from "@/lib/utils";

export function StatTile({
  label,
  value,
  delta,
  goodWhenUp = true,
  hint,
  spark,
  hero,
}: {
  label: string;
  value: string;
  delta?: number;
  goodWhenUp?: boolean;
  hint?: ReactNode;
  spark?: number[];
  hero?: boolean;
}) {
  return (
    <Card className={cn("flex flex-col justify-between p-5", hero && "bg-neutral-950 text-white")}>
      <div className="flex items-start justify-between gap-3">
        <p className={cn("text-[13px]", hero ? "text-white/60" : "text-muted-foreground")}>{label}</p>
        {delta !== undefined && (
          <span className={cn(hero && "rounded-full bg-white/95 px-1.5 py-0.5")}>
            <Delta value={delta} goodWhenUp={goodWhenUp} />
          </span>
        )}
      </div>
      <p className={cn("mt-3 whitespace-nowrap font-semibold tracking-tight", hero ? "text-[clamp(1.75rem,2.4vw,2.25rem)] leading-none" : "text-2xl")}>{value}</p>
      <div className="mt-3 flex items-end justify-between gap-4">
        {hint && <p className={cn("text-xs", hero ? "text-white/50" : "text-muted-foreground")}>{hint}</p>}
        {spark && spark.length > 1 && <Sparkline values={spark} className="max-w-[120px]" />}
      </div>
    </Card>
  );
}

export function RangeTabs({ current, basePath, extra, allowCustom = false }: { current: string; basePath: string; extra?: Record<string, string>; allowCustom?: boolean }) {
  const qs = (v: string) => new URLSearchParams({ ...(extra ?? {}), range: v }).toString();
  return (
    <div role="tablist" aria-label="Período" className="inline-flex flex-wrap items-center gap-1 rounded-lg border border-border bg-card p-1">
      {RANGE_PRESETS.filter((r) => allowCustom || r.value !== "custom").map((r) => (
        <Link
          key={r.value}
          role="tab"
          aria-selected={current === r.value}
          href={`${basePath}?${qs(r.value)}`}
          scroll={false}
          className={cn("rounded-md px-3 py-1.5 text-xs font-medium transition-colors", current === r.value ? "bg-foreground text-background" : "text-muted-foreground hover:bg-muted hover:text-foreground")}
        >
          {r.label}
        </Link>
      ))}
    </div>
  );
}
