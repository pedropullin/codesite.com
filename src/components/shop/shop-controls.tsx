"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { createContext, useContext, useEffect, useRef, useState, useTransition, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { formatPrice } from "@/lib/format";
import { getLenis } from "@/components/store/smooth-scroll";

const PendingContext = createContext<{ pending: boolean; start: (fn: () => void) => void }>({ pending: false, start: (fn) => fn() });

export function ShopTransition({ children }: { children: ReactNode }) {
  const [pending, startTransition] = useTransition();
  return <PendingContext.Provider value={{ pending, start: startTransition }}>{children}</PendingContext.Provider>;
}

export function PendingArea({ children }: { children: ReactNode }) {
  const { pending } = useContext(PendingContext);
  return (
    <div className={cn("transition-[opacity,filter] duration-500", pending && "pointer-events-none opacity-40 blur-[2px]")} aria-busy={pending}>
      {children}
    </div>
  );
}

function useParamsUpdater() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const { start } = useContext(PendingContext);
  return (patch: Record<string, string | null>) => {
    const next = new URLSearchParams(params.toString());
    Object.entries(patch).forEach(([k, v]) => (v == null || v === "" ? next.delete(k) : next.set(k, v)));
    const qs = next.toString();
    start(() => router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false }));
  };
}

type Facets = { sizes: string[]; colors: { name: string; hex: string }[]; priceRange: { min: number; max: number } };
type Category = { name: string; slug: string; productCount: number };

const SORTS = [
  { value: "featured", label: "Destaques" },
  { value: "newest", label: "Novidades" },
  { value: "price-asc", label: "Menor preço" },
  { value: "price-desc", label: "Maior preço" },
  { value: "name", label: "Nome A–Z" },
];

const PRICE_BANDS = [
  { label: "Até R$ 500", min: null, max: 50000 },
  { label: "R$ 500 – 1.500", min: 50000, max: 150000 },
  { label: "R$ 1.500 – 3.000", min: 150000, max: 300000 },
  { label: "Acima de R$ 3.000", min: 300000, max: null },
];

export function ShopToolbar({ categories, facets, total }: { categories: Category[]; facets: Facets; total: number }) {
  const params = useSearchParams();
  const update = useParamsUpdater();
  const [q, setQ] = useState(params.get("q") ?? "");
  const [open, setOpen] = useState(false);
  const input = useRef<HTMLInputElement>(null);
  const category = params.get("category") ?? "";
  const sort = params.get("sort") ?? "featured";

  // Debounced search → URL
  useEffect(() => {
    const current = params.get("q") ?? "";
    if (q === current) return;
    const t = setTimeout(() => update({ q: q.trim() || null }), 320);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  useEffect(() => {
    if (params.get("focus") === "search") input.current?.focus();
  }, [params]);

  useEffect(() => {
    const l = getLenis();
    if (open) l?.stop();
    else l?.start();
  }, [open]);

  const activeFilters = ["min", "max", "availability", "size", "color", "filter"].filter((k) => params.get(k));

  return (
    <div className="sticky top-16 z-30 -mx-5 border-y border-ink/10 bg-paper/90 px-5 backdrop-blur-xl md:top-[76px] md:-mx-10 md:px-10">
      <div className="flex flex-col gap-3 py-3 md:flex-row md:items-center md:justify-between">
        <div className="no-scrollbar -mx-1 flex items-center gap-1 overflow-x-auto px-1">
          <button type="button" onClick={() => update({ category: null })} className={cn("label shrink-0 px-3 py-2 transition-colors", !category ? "bg-ink text-bone" : "text-ink/60 hover:text-ink")}>
            All
          </button>
          {categories.map((c) => (
            <button
              key={c.slug}
              type="button"
              onClick={() => update({ category: c.slug })}
              className={cn("label shrink-0 px-3 py-2 transition-colors", category === c.slug ? "bg-ink text-bone" : "text-ink/60 hover:text-ink")}
            >
              {c.name}
              <span className="ml-1.5 opacity-40">{c.productCount}</span>
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <label className="relative flex-1 md:w-64 md:flex-none">
            <span className="sr-only">Buscar produtos</span>
            <input
              ref={input}
              type="search"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Buscar no arquivo"
              className="h-10 w-full border border-ink/15 bg-transparent px-3 text-sm outline-none transition-colors placeholder:text-ink/40 focus:border-ink"
            />
          </label>
          <button type="button" onClick={() => setOpen(true)} className="label flex h-10 items-center gap-2 border border-ink/15 px-4 transition-colors hover:border-ink">
            Filtros
            {activeFilters.length > 0 && <span className="inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-ink px-1 text-[9px] text-bone">{activeFilters.length}</span>}
          </button>
          <label className="relative">
            <span className="sr-only">Ordenar</span>
            <select
              value={sort}
              onChange={(e) => update({ sort: e.target.value === "featured" ? null : e.target.value })}
              className="label h-10 appearance-none border border-ink/15 bg-transparent pl-3 pr-8 outline-none transition-colors hover:border-ink"
            >
              {SORTS.map((s) => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
            <span aria-hidden className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[10px]">▾</span>
          </label>
        </div>
      </div>

      <AnimatePresence>
        {open && (
          <div className="fixed inset-0 z-[110]" role="dialog" aria-modal="true" aria-label="Filtros">
            <motion.button type="button" aria-label="Fechar filtros" className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setOpen(false)} />
            <motion.aside
              className="absolute left-0 top-0 flex h-full w-full max-w-[420px] flex-col bg-paper text-ink"
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
              data-lenis-prevent
            >
              <div className="flex items-center justify-between border-b border-ink/10 px-6 py-6">
                <p className="font-display text-sm uppercase tracking-[0.2em]">Filtros</p>
                <button type="button" className="label text-ink/60 hover:text-ink" onClick={() => setOpen(false)}>Fechar</button>
              </div>
              <div className="flex-1 space-y-10 overflow-y-auto px-6 py-8">
                <FilterGroup title="Seleção">
                  {[
                    { v: "new", l: "Novidades" },
                    { v: "featured", l: "Destaques" },
                    { v: "sale", l: "Em promoção" },
                  ].map((f) => (
                    <Chip key={f.v} active={params.get("filter") === f.v} onClick={() => update({ filter: params.get("filter") === f.v ? null : f.v })}>{f.l}</Chip>
                  ))}
                </FilterGroup>
                <FilterGroup title="Disponibilidade">
                  <Chip active={params.get("availability") === "in-stock"} onClick={() => update({ availability: params.get("availability") === "in-stock" ? null : "in-stock" })}>Em estoque</Chip>
                  <Chip active={params.get("availability") === "sold-out"} onClick={() => update({ availability: params.get("availability") === "sold-out" ? null : "sold-out" })}>Esgotados</Chip>
                </FilterGroup>
                <FilterGroup title={`Preço — ${formatPrice(facets.priceRange.min)} a ${formatPrice(facets.priceRange.max)}`}>
                  {PRICE_BANDS.map((b) => {
                    const active = (params.get("min") ?? "") === String(b.min ?? "") && (params.get("max") ?? "") === String(b.max ?? "");
                    return (
                      <Chip key={b.label} active={active} onClick={() => update(active ? { min: null, max: null } : { min: b.min != null ? String(b.min) : null, max: b.max != null ? String(b.max) : null })}>
                        {b.label}
                      </Chip>
                    );
                  })}
                </FilterGroup>
                <FilterGroup title="Tamanho">
                  {facets.sizes.map((s) => (
                    <Chip key={s} active={params.get("size") === s} onClick={() => update({ size: params.get("size") === s ? null : s })}>{s}</Chip>
                  ))}
                </FilterGroup>
                <FilterGroup title="Cor">
                  {facets.colors.map((c) => (
                    <Chip key={c.name} active={params.get("color") === c.name} onClick={() => update({ color: params.get("color") === c.name ? null : c.name })}>
                      <span className="mr-2 inline-block h-3 w-3 rounded-full border border-ink/20" style={{ background: c.hex }} />
                      {c.name}
                    </Chip>
                  ))}
                </FilterGroup>
              </div>
              <div className="grid grid-cols-2 gap-3 border-t border-ink/10 p-6">
                <button type="button" className="label h-12 border border-ink/20 hover:border-ink" onClick={() => update({ min: null, max: null, availability: null, size: null, color: null, filter: null })}>
                  Limpar
                </button>
                <button type="button" className="label h-12 bg-ink text-bone" onClick={() => setOpen(false)}>
                  Ver {total} {total === 1 ? "peça" : "peças"}
                </button>
              </div>
            </motion.aside>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function FilterGroup({ title, children }: { title: string; children: ReactNode }) {
  return (
    <fieldset>
      <legend className="label-sm mb-4 text-ink/50">{title}</legend>
      <div className="flex flex-wrap gap-2">{children}</div>
    </fieldset>
  );
}

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={cn("label inline-flex items-center border px-3 py-2 transition-colors", active ? "border-ink bg-ink text-bone" : "border-ink/15 hover:border-ink")}
    >
      {children}
    </button>
  );
}

export function ClearFilters() {
  const update = useParamsUpdater();
  return (
    <button type="button" onClick={() => update({ q: null, category: null, min: null, max: null, availability: null, size: null, color: null, filter: null, sort: null })} className="label border-b border-ink pb-1">
      Limpar busca e filtros
    </button>
  );
}
