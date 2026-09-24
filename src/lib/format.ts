const brl = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
const brlCompact = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
  notation: "compact",
  maximumFractionDigits: 1,
});
const intFmt = new Intl.NumberFormat("pt-BR");

/** Formats integer cents as BRL, e.g. 129000 → "R$ 1.290,00". */
export function formatPrice(cents: number) {
  return brl.format(cents / 100).replace(/ /g, " ");
}

export function formatPriceCompact(cents: number) {
  return brlCompact.format(cents / 100).replace(/ /g, " ");
}

export function formatNumber(n: number) {
  return intFmt.format(n);
}

export function formatPercent(n: number, digits = 1) {
  return `${(n * 100).toFixed(digits).replace(".", ",")}%`;
}

export function formatDate(d: Date | number | string, opts: Intl.DateTimeFormatOptions = { day: "2-digit", month: "short", year: "numeric" }) {
  return new Intl.DateTimeFormat("pt-BR", { timeZone: "America/Sao_Paulo", ...opts }).format(new Date(d));
}

export function formatDateTime(d: Date | number | string) {
  return formatDate(d, { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

/** Parses "1.290,00" / "1290.00" / "1290" into cents. */
export function parsePriceToCents(value: string | number | null | undefined): number | null {
  if (value == null || value === "") return null;
  if (typeof value === "number") return Math.round(value * 100);
  const cleaned = value.replace(/[^\d,.-]/g, "");
  const normalized = cleaned.includes(",") ? cleaned.replace(/\./g, "").replace(",", ".") : cleaned;
  const n = Number(normalized);
  return Number.isFinite(n) ? Math.round(n * 100) : null;
}

export function slugify(input: string) {
  return input
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

export function onlyDigits(s: string) {
  return s.replace(/\D/g, "");
}

export function formatPhone(s: string) {
  const d = onlyDigits(s).replace(/^55(?=\d{10,11}$)/, "");
  if (d.length === 11) return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
  if (d.length === 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return s;
}

export function formatCep(s: string) {
  const d = onlyDigits(s);
  return d.length === 8 ? `${d.slice(0, 5)}-${d.slice(5)}` : s;
}

export function pad(n: number, size = 2) {
  return String(n).padStart(size, "0");
}
