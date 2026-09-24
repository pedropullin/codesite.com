"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { CodeSiteMark, InstagramIcon, WhatsAppIcon } from "@/components/icons";
import {
  CATEGORIES,
  FOLLOW_UP_DAYS,
  STATUSES,
  buildQuery,
  daysSince,
  fetchOsm,
  googleLink,
  heat,
  mapsLink,
  pitch,
  splitCities,
  toCsv,
  toLead,
  type CategoryId,
  type Lead,
  type Status,
  type Tracked,
} from "@/lib/leads";

const TRACK_KEY = "codesite-leads-v1";
const SETTINGS_KEY = "codesite-leads-settings";

type Settings = { sender: string; city: string; ddd: string };
const DEFAULT_SETTINGS: Settings = { sender: "Pedro", city: "Curitiba", ddd: "41" };

function load<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? { ...fallback, ...JSON.parse(raw) } : fallback;
  } catch {
    return fallback;
  }
}

function save(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {}
}

const HEAT_STYLES = {
  hot: "bg-brand text-paper",
  warm: "bg-ink text-paper",
  cold: "border border-line text-ink-soft",
};

const STATUS_STYLES: Record<Status, string> = {
  novo: "border-line text-ink-soft",
  contatado: "border-brand text-brand",
  respondeu: "border-ink bg-ink text-paper",
  fechado: "border-brand bg-brand text-paper",
  descartado: "border-line text-ink-faint line-through",
};

export default function LeadFinder() {
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [tracked, setTracked] = useState<Record<string, Tracked>>({});
  const [ready, setReady] = useState(false);

  const [tab, setTab] = useState<"buscar" | "funil">("buscar");
  const [cats, setCats] = useState<CategoryId[]>(["comida", "beleza"]);
  const [results, setResults] = useState<Lead[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const abort = useRef<AbortController | null>(null);

  const [onlyWhatsapp, setOnlyWhatsapp] = useState(true);
  const [minHeat, setMinHeat] = useState<"todos" | "morno" | "quente">("todos");
  const [text, setText] = useState("");
  const [shown, setShown] = useState(40);
  const [bairro, setBairro] = useState("");
  const [sort, setSort] = useState<"nota" | "nome" | "bairro">("nota");
  const [hideContacted, setHideContacted] = useState(true);
  const [statusFilter, setStatusFilter] = useState<Status | "ativos" | "cobrar">("ativos");

  useEffect(() => {
    // localStorage only exists in the browser, so state hydrates after mount.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSettings(load(SETTINGS_KEY, DEFAULT_SETTINGS));
    setTracked(load(TRACK_KEY, {}));
    setReady(true);
  }, []);

  useEffect(() => {
    if (ready) save(SETTINGS_KEY, settings);
  }, [settings, ready]);

  useEffect(() => {
    if (ready) save(TRACK_KEY, tracked);
  }, [tracked, ready]);

  const search = async () => {
    const cities = splitCities(settings.city);
    if (cities.length === 0 || cats.length === 0) return;
    abort.current?.abort();
    const ctrl = new AbortController();
    abort.current = ctrl;
    setLoading(true);
    setError("");
    setShown(40);
    setBairro("");
    try {
      const elements = await fetchOsm(buildQuery(cities, cats), ctrl.signal);
      const seen = new Set<string>();
      const leads = elements
        .map((el) => toLead(el, settings.ddd))
        .filter((l): l is Lead => {
          if (!l) return false;
          const key = `${l.name.toLowerCase()}|${l.address.toLowerCase()}`;
          if (seen.has(key)) return false;
          seen.add(key);
          return true;
        })
        .sort((a, b) => b.score - a.score);
      setResults(leads);
      if (leads.length === 0) setError(`Nada encontrado em ${cities.join(", ")}. Confira o nome da cidade (com acento) ou marque outros tipos.`);
    } catch (e) {
      if (!ctrl.signal.aborted) {
        setError("O mapa não respondeu agora. Espere um minuto e tente de novo.");
        console.error(e);
      }
    } finally {
      if (abort.current === ctrl) setLoading(false);
    }
  };

  const setStatus = (lead: Lead, status: Status) =>
    setTracked((t) => {
      const prev = t[lead.id];
      const contactedAt = status === "contatado" ? (prev?.status === "contatado" && prev.contactedAt ? prev.contactedAt : Date.now()) : prev?.contactedAt;
      return { ...t, [lead.id]: { lead, note: prev?.note ?? "", status, updatedAt: Date.now(), contactedAt } };
    });

  const setNote = (lead: Lead, note: string) =>
    setTracked((t) => ({ ...t, [lead.id]: { ...t[lead.id], lead, status: t[lead.id]?.status ?? "novo", note, updatedAt: Date.now() } }));

  const bairros = useMemo(() => {
    const count = new Map<string, number>();
    for (const l of results ?? []) if (l.bairro) count.set(l.bairro, (count.get(l.bairro) ?? 0) + 1);
    return [...count.entries()].sort((a, b) => b[1] - a[1]);
  }, [results]);

  const visible = useMemo(() => {
    if (!results) return [];
    const q = text.trim().toLowerCase();
    return results.filter((l) => {
      if (onlyWhatsapp && !l.phone?.whatsapp) return false;
      if (minHeat === "quente" && l.score < 75) return false;
      if (minHeat === "morno" && l.score < 55) return false;
      const st = tracked[l.id]?.status ?? "novo";
      if (st === "descartado") return false;
      if (hideContacted && st !== "novo") return false;
      if (bairro && l.bairro !== bairro) return false;
      if (q && !`${l.name} ${l.bairro} ${l.address} ${l.kind}`.toLowerCase().includes(q)) return false;
      return true;
    }).sort((a, b) =>
      sort === "nome" ? a.name.localeCompare(b.name, "pt-BR")
      : sort === "bairro" ? (a.bairro || "~").localeCompare(b.bairro || "~", "pt-BR") || b.score - a.score
      : b.score - a.score
    );
  }, [results, onlyWhatsapp, minHeat, text, tracked, hideContacted, bairro, sort]);

  const pipeline = useMemo(() => {
    const all = Object.values(tracked).sort((a, b) => b.updatedAt - a.updatedAt);
    const counts = Object.fromEntries(STATUSES.map((s) => [s.id, all.filter((t) => t.status === s.id).length])) as Record<Status, number>;
    const due = all
      .filter((t) => t.status === "contatado" && t.contactedAt && daysSince(t.contactedAt) >= FOLLOW_UP_DAYS)
      .sort((a, b) => (a.contactedAt ?? 0) - (b.contactedAt ?? 0));
    const list =
      statusFilter === "cobrar" ? due
      : statusFilter === "ativos" ? all.filter((t) => t.status !== "descartado")
      : all.filter((t) => t.status === statusFilter);
    return { all, counts, list, due };
  }, [tracked, statusFilter]);

  const exportCsv = (rows: { lead: Lead; status: Status; note: string }[]) => {
    const blob = new Blob([toCsv(rows)], { type: "text/csv;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `leads-codesite-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  return (
    <div className="min-h-[100svh] bg-bg pb-24 text-ink">
      <header className="sticky top-0 z-20 border-b border-line bg-bg/90 backdrop-blur">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-3 px-4 py-3">
          <Link href="/" className="flex items-center gap-2.5 font-display text-lg font-bold">
            <CodeSiteMark className="h-8 w-8" />
            Leads
          </Link>
          <nav className="flex rounded-full border border-line bg-paper p-1 text-sm font-semibold">
            {(["buscar", "funil"] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTab(t)}
                className={`rounded-full px-4 py-1.5 transition-colors ${tab === t ? "bg-ink text-paper" : "text-ink-soft"}`}
              >
                {t === "buscar" ? "Buscar" : `Funil (${pipeline.all.length})`}
              </button>
            ))}
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 pt-6">
        {tab === "buscar" ? (
          <>
            <section className="rounded-3xl border border-line bg-paper p-5">
              <h1 className="font-display text-2xl font-bold tracking-tight">Achar clientes sem site</h1>
              <p className="mt-1 text-sm text-ink-soft">
                Busca no mapa os comércios da cidade que não têm site, dá uma nota pra cada um e deixa a mensagem pronta.
              </p>

              <div className="mt-5 grid grid-cols-[1fr_auto] gap-3">
                <label className="block">
                  <span className="text-xs font-semibold text-ink-soft">Cidades (separe por vírgula)</span>
                  <input
                    value={settings.city}
                    onChange={(e) => setSettings({ ...settings, city: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-line bg-bg px-3 py-2.5 outline-none focus:border-brand"
                  />
                </label>
                <label className="block w-20">
                  <span className="text-xs font-semibold text-ink-soft">DDD</span>
                  <input
                    value={settings.ddd}
                    inputMode="numeric"
                    maxLength={2}
                    onChange={(e) => setSettings({ ...settings, ddd: e.target.value.replace(/\D/g, "") })}
                    className="mt-1 w-full rounded-xl border border-line bg-bg px-3 py-2.5 outline-none focus:border-brand"
                  />
                </label>
              </div>

              <fieldset className="mt-4">
                <legend className="text-xs font-semibold text-ink-soft">O que procurar</legend>
                <div className="mt-2 flex flex-wrap gap-2">
                  {CATEGORIES.map((c) => {
                    const on = cats.includes(c.id);
                    return (
                      <button
                        key={c.id}
                        type="button"
                        aria-pressed={on}
                        onClick={() => setCats(on ? cats.filter((x) => x !== c.id) : [...cats, c.id])}
                        className={`rounded-full border px-3.5 py-2 text-sm transition-colors ${
                          on ? "border-ink bg-ink text-paper" : "border-line text-ink"
                        }`}
                      >
                        {c.label}
                      </button>
                    );
                  })}
                </div>
              </fieldset>

              <button
                type="button"
                onClick={search}
                disabled={loading || cats.length === 0 || splitCities(settings.city).length === 0}
                className="mt-5 w-full rounded-full bg-brand px-6 py-4 font-semibold text-paper transition-opacity disabled:opacity-50"
              >
                {loading ? "Buscando no mapa… pode levar até 1 minuto" : "Buscar leads"}
              </button>
              {error && (
                <p role="alert" className="mt-3 text-sm text-[#c8361f]">
                  {error}
                </p>
              )}
            </section>

            {results && results.length > 0 && (
              <>
                <section className="mt-5 flex flex-wrap items-center gap-2">
                  <input
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    placeholder="Filtrar por nome ou bairro"
                    className="min-w-0 flex-1 basis-full rounded-xl border border-line bg-paper px-3 py-2.5 text-sm outline-none focus:border-brand sm:basis-auto"
                  />
                  <button
                    type="button"
                    aria-pressed={onlyWhatsapp}
                    onClick={() => setOnlyWhatsapp(!onlyWhatsapp)}
                    className={`rounded-full border px-3.5 py-2 text-sm ${onlyWhatsapp ? "border-brand bg-brand text-paper" : "border-line"}`}
                  >
                    Só com WhatsApp
                  </button>
                  <select
                    value={minHeat}
                    onChange={(e) => setMinHeat(e.target.value as typeof minHeat)}
                    className="rounded-full border border-line bg-paper px-3.5 py-2 text-sm"
                    aria-label="Temperatura"
                  >
                    <option value="todos">Todos</option>
                    <option value="morno">Mornos e quentes</option>
                    <option value="quente">Só quentes</option>
                  </select>
                  {bairros.length > 0 && (
                    <select
                      value={bairro}
                      onChange={(e) => setBairro(e.target.value)}
                      className="max-w-full rounded-full border border-line bg-paper px-3.5 py-2 text-sm"
                      aria-label="Bairro"
                    >
                      <option value="">Todos os bairros</option>
                      {bairros.map(([b, n]) => (
                        <option key={b} value={b}>
                          {b} ({n})
                        </option>
                      ))}
                    </select>
                  )}
                  <select
                    value={sort}
                    onChange={(e) => setSort(e.target.value as typeof sort)}
                    className="rounded-full border border-line bg-paper px-3.5 py-2 text-sm"
                    aria-label="Ordenar"
                  >
                    <option value="nota">Maior nota</option>
                    <option value="bairro">Por bairro</option>
                    <option value="nome">Por nome</option>
                  </select>
                  <button
                    type="button"
                    aria-pressed={hideContacted}
                    onClick={() => setHideContacted(!hideContacted)}
                    className={`rounded-full border px-3.5 py-2 text-sm ${hideContacted ? "border-ink bg-ink text-paper" : "border-line"}`}
                  >
                    Esconder já contatados
                  </button>
                </section>

                <div className="mt-4 flex items-center justify-between text-sm text-ink-soft">
                  <span>
                    <b className="text-ink">{visible.length}</b> de {results.length} sem site
                  </span>
                  <button
                    type="button"
                    onClick={() => exportCsv(visible.map((l) => ({ lead: l, status: tracked[l.id]?.status ?? "novo", note: tracked[l.id]?.note ?? "" })))}
                    className="font-semibold text-brand"
                  >
                    Baixar planilha
                  </button>
                </div>

                <ul className="mt-3 space-y-3">
                  {visible.slice(0, shown).map((l) => (
                    <LeadCard
                      key={l.id}
                      lead={l}
                      settings={settings}
                      tracked={tracked[l.id]}
                      onStatus={(s) => setStatus(l, s)}
                      onNote={(n) => setNote(l, n)}
                    />
                  ))}
                </ul>
                {visible.length > shown && (
                  <button
                    type="button"
                    onClick={() => setShown(shown + 40)}
                    className="mt-4 w-full rounded-full border border-line py-3 text-sm font-semibold"
                  >
                    Mostrar mais ({visible.length - shown})
                  </button>
                )}
              </>
            )}
          </>
        ) : (
          <>
            {pipeline.due.length > 0 && (
              <button
                type="button"
                onClick={() => setStatusFilter(statusFilter === "cobrar" ? "ativos" : "cobrar")}
                className={`mb-4 flex w-full items-center justify-between gap-3 rounded-3xl p-4 text-left ${
                  statusFilter === "cobrar" ? "bg-ink text-paper" : "bg-brand text-paper"
                }`}
              >
                <span>
                  <span className="block font-display text-lg font-bold">
                    {pipeline.due.length} {pipeline.due.length === 1 ? "lead precisa" : "leads precisam"} de retorno
                  </span>
                  <span className="block text-sm opacity-80">Contatados há {FOLLOW_UP_DAYS}+ dias e ainda sem resposta</span>
                </span>
                <span className="shrink-0 text-sm font-semibold">{statusFilter === "cobrar" ? "Ver todos" : "Ver"}</span>
              </button>
            )}
            <section className="grid grid-cols-5 gap-1.5">
              {STATUSES.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setStatusFilter(statusFilter === s.id ? "ativos" : s.id)}
                  className={`rounded-2xl border p-2 text-center transition-colors ${
                    statusFilter === s.id ? "border-ink bg-ink text-paper" : "border-line bg-paper"
                  }`}
                >
                  <span className="block font-display text-2xl font-bold">{pipeline.counts[s.id]}</span>
                  <span className="block truncate text-[0.68rem]">{s.label}</span>
                </button>
              ))}
            </section>

            <div className="mt-4 flex items-center justify-between text-sm text-ink-soft">
              <span>
                {statusFilter === "ativos"
                  ? "Todos, menos descartados"
                  : statusFilter === "cobrar"
                    ? "Para dar retorno (mais antigos primeiro)"
                    : STATUSES.find((s) => s.id === statusFilter)?.label}
              </span>
              {pipeline.all.length > 0 && (
                <button type="button" onClick={() => exportCsv(pipeline.all)} className="font-semibold text-brand">
                  Baixar planilha
                </button>
              )}
            </div>

            {pipeline.list.length === 0 ? (
              <p className="mt-10 text-center text-sm text-ink-soft">
                Nenhum lead aqui ainda. Na aba Buscar, mande mensagem ou mude o status de alguém e ele aparece no funil.
              </p>
            ) : (
              <ul className="mt-3 space-y-3">
                {pipeline.list.map((t) => (
                  <LeadCard
                    key={t.lead.id}
                    lead={t.lead}
                    settings={settings}
                    tracked={t}
                    onStatus={(s) => setStatus(t.lead, s)}
                    onNote={(n) => setNote(t.lead, n)}
                  />
                ))}
              </ul>
            )}

            <label className="mt-10 block rounded-3xl border border-line bg-paper p-5">
              <span className="text-xs font-semibold text-ink-soft">Seu nome nas mensagens</span>
              <input
                value={settings.sender}
                onChange={(e) => setSettings({ ...settings, sender: e.target.value })}
                className="mt-1 w-full rounded-xl border border-line bg-bg px-3 py-2.5 outline-none focus:border-brand"
              />
              <span className="mt-2 block text-xs text-ink-faint">
                O funil fica salvo neste aparelho. Use &quot;Baixar planilha&quot; para guardar uma cópia.
              </span>
            </label>
          </>
        )}
      </main>
    </div>
  );
}

function LeadCard({
  lead,
  settings,
  tracked,
  onStatus,
  onNote,
}: {
  lead: Lead;
  settings: Settings;
  tracked?: Tracked;
  onStatus: (s: Status) => void;
  onNote: (n: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const cities = splitCities(settings.city);
  const city = lead.city || (cities.length === 1 ? cities[0] : "");
  const [message, setMessage] = useState(() => pitch(lead, settings.sender, city));
  const [copied, setCopied] = useState(false);
  const h = heat(lead.score);
  const status = tracked?.status ?? "novo";

  const sendWhatsapp = () => {
    if (!lead.phone?.whatsapp) return;
    window.open(`https://wa.me/${lead.phone.whatsapp}?text=${encodeURIComponent(message)}`, "_blank", "noopener,noreferrer");
    if (status === "novo") onStatus("contatado");
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(message);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {}
  };

  const btn = "inline-flex items-center justify-center gap-1.5 rounded-full border border-line px-3.5 py-2 text-sm font-semibold";

  return (
    <li className="rounded-3xl border border-line bg-paper p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="font-display text-lg font-bold leading-tight tracking-tight wrap-anywhere">{lead.name}</h3>
          <p className="mt-0.5 text-sm text-ink-soft">
            {lead.kind}
            {lead.bairro && ` · ${lead.bairro}`}
            {lead.city && cities.length > 1 && ` · ${lead.city}`}
          </p>
          {lead.address && <p className="text-xs text-ink-faint wrap-anywhere">{lead.address}</p>}
        </div>
        <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-bold ${HEAT_STYLES[h.tone]}`}>
          {h.label} {lead.score}
        </span>
      </div>

      <div className="mt-3 flex flex-wrap gap-1.5">
        {lead.reasons.map((r) => (
          <span key={r} className="rounded-full bg-bg px-2.5 py-1 text-[0.72rem] text-ink-soft">
            {r}
          </span>
        ))}
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        {lead.phone?.whatsapp && (
          <button type="button" onClick={sendWhatsapp} className="inline-flex items-center gap-1.5 rounded-full bg-brand px-4 py-2 text-sm font-semibold text-paper">
            <WhatsAppIcon className="h-4 w-4" /> Mandar mensagem
          </button>
        )}
        {lead.phone && (
          <a href={`tel:${lead.phone.tel}`} className={btn}>
            {lead.phone.display}
          </a>
        )}
        {lead.instagram && (
          <a href={lead.instagram} target="_blank" rel="noopener noreferrer" className={btn} aria-label="Instagram">
            <InstagramIcon className="h-4 w-4" />
          </a>
        )}
        <a href={googleLink(lead, city)} target="_blank" rel="noopener noreferrer" className={btn}>
          Conferir no Google
        </a>
        <a href={mapsLink(lead, city)} target="_blank" rel="noopener noreferrer" className={btn}>
          Mapa
        </a>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <select
          value={status}
          onChange={(e) => onStatus(e.target.value as Status)}
          className={`rounded-full border bg-paper px-3 py-1.5 text-sm font-semibold ${STATUS_STYLES[status]}`}
          aria-label="Status"
        >
          {STATUSES.map((s) => (
            <option key={s.id} value={s.id}>
              {s.label}
            </option>
          ))}
        </select>
        {status === "contatado" && tracked?.contactedAt != null && (
          <span className={`text-xs ${daysSince(tracked.contactedAt) >= FOLLOW_UP_DAYS ? "font-semibold text-brand" : "text-ink-faint"}`}>
            {daysSince(tracked.contactedAt) === 0 ? "hoje" : `há ${daysSince(tracked.contactedAt)} dia${daysSince(tracked.contactedAt) > 1 ? "s" : ""}`}
          </span>
        )}
        <button type="button" onClick={() => setOpen(!open)} className="text-sm font-semibold text-brand">
          {open ? "Fechar" : "Ver mensagem e anotações"}
        </button>
      </div>

      {open && (
        <div className="mt-3 space-y-3">
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={9}
            className="w-full rounded-2xl border border-line bg-bg p-3 text-sm leading-relaxed outline-none focus:border-brand"
            aria-label="Mensagem"
          />
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={copy} className={btn}>
              {copied ? "Copiado!" : "Copiar mensagem"}
            </button>
            <button type="button" onClick={() => setMessage(pitch(lead, settings.sender, city))} className={btn}>
              Restaurar texto
            </button>
          </div>
          <input
            value={tracked?.note ?? ""}
            onChange={(e) => onNote(e.target.value)}
            placeholder="Anotação (ex.: falar com o dono na sexta)"
            className="w-full rounded-xl border border-line bg-bg px-3 py-2.5 text-sm outline-none focus:border-brand"
          />
        </div>
      )}
    </li>
  );
}
