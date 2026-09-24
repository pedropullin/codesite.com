// Lead finder: pulls businesses without a website from OpenStreetMap
// (Overpass API, free and CORS-enabled), scores them and drafts the pitch.

export type CategoryId = "comida" | "beleza" | "saude" | "fitness" | "lojas" | "pet" | "servicos";

type Category = {
  id: CategoryId;
  label: string;
  selectors: string[];
  weight: number;
  hook: string;
};

export const CATEGORIES: Category[] = [
  {
    id: "comida",
    label: "Restaurantes e bares",
    selectors: [
      '["amenity"~"^(restaurant|cafe|bar|fast_food|pub|ice_cream|food_court)$"]',
      '["shop"~"^(bakery|pastry|confectionery|deli)$"]',
    ],
    weight: 15,
    hook: "A gente faz site pra restaurante, bar e padaria com cardápio digital, fotos e reserva pelo WhatsApp, e que aparece no Google quando alguém procura onde comer por perto.",
  },
  {
    id: "beleza",
    label: "Barbearias e salões",
    selectors: ['["shop"~"^(hairdresser|beauty|massage|tattoo)$"]'],
    weight: 15,
    hook: "A gente faz site pra barbearia e salão com agendamento online e fotos dos trabalhos, pra quem procura no Google achar vocês primeiro.",
  },
  {
    id: "saude",
    label: "Clínicas e consultórios",
    selectors: ['["amenity"~"^(dentist|clinic|doctors)$"]', '["healthcare"~"^(physiotherapist|psychotherapist|alternative|laboratory)$"]', '["shop"="optician"]'],
    weight: 10,
    hook: "A gente faz site pra clínica e consultório, com agendamento e as informações que passam confiança pra quem pesquisa no Google antes de marcar.",
  },
  {
    id: "fitness",
    label: "Academias e estúdios",
    selectors: ['["leisure"="fitness_centre"]', '["amenity"="dojo"]', '["sport"~"^(yoga|pilates|crossfit)$"]["leisure"]'],
    weight: 10,
    hook: "A gente faz site pra academia e estúdio com planos, horários e aula experimental agendada direto pelo site.",
  },
  {
    id: "lojas",
    label: "Lojas",
    selectors: ['["shop"~"^(clothes|shoes|jewelry|furniture|florist|gift|sports|bicycle|electronics|mobile_phone|boutique|cosmetics|interior_decoration)$"]'],
    weight: 5,
    hook: "A gente faz site e loja virtual pra vender além do balcão, com catálogo e pedido pelo WhatsApp.",
  },
  {
    id: "pet",
    label: "Pet shops e veterinárias",
    selectors: ['["shop"~"^(pet|pet_grooming)$"]', '["amenity"="veterinary"]'],
    weight: 10,
    hook: "A gente faz site pra pet shop e veterinária com serviços, banho e tosa e consultas agendadas online.",
  },
  {
    id: "servicos",
    label: "Escritórios e serviços",
    selectors: [
      '["office"~"^(lawyer|accountant|estate_agent|architect|insurance)$"]',
      '["shop"="car_repair"]',
      '["amenity"="car_wash"]',
      '["craft"~"^(photographer|carpenter|electrician|plumber)$"]',
    ],
    weight: 10,
    hook: "A gente faz site que mostra o trabalho de vocês e traz pedido de orçamento direto pelo WhatsApp.",
  },
];

export const categoryById = (id: CategoryId) => CATEGORIES.find((c) => c.id === id)!;

export function buildQuery(city: string, categories: CategoryId[]) {
  const safeCity = city.replace(/["\\]/g, "").trim();
  const noSite = '["name"][!"website"][!"contact:website"][!"url"]';
  const clauses = categories
    .flatMap((id) => categoryById(id).selectors)
    .map((sel) => `  nwr${sel}${noSite}(area.a);`)
    .join("\n");
  return `[out:json][timeout:90];
area["name"="${safeCity}"]["boundary"="administrative"]["admin_level"~"^(7|8)$"]->.a;
(
${clauses}
);
out center tags 600;`;
}

const ENDPOINTS = ["https://overpass-api.de/api/interpreter", "https://overpass.kumi.systems/api/interpreter"];

export type OsmElement = {
  type: "node" | "way" | "relation";
  id: number;
  lat?: number;
  lon?: number;
  center?: { lat: number; lon: number };
  tags?: Record<string, string>;
};

export async function fetchOsm(query: string, signal?: AbortSignal): Promise<OsmElement[]> {
  let lastError: unknown;
  for (const url of ENDPOINTS) {
    try {
      const res = await fetch(url, {
        method: "POST",
        body: new URLSearchParams({ data: query }),
        signal,
      });
      if (!res.ok) throw new Error(`Overpass ${res.status}`);
      const json = (await res.json()) as { elements?: OsmElement[] };
      return json.elements ?? [];
    } catch (e) {
      if (signal?.aborted) throw e;
      lastError = e;
    }
  }
  throw lastError;
}

export type Phone = { display: string; whatsapp: string | null; tel: string };

// Brazilian numbers: DDD (2 digits) + 8-digit landline or 9-digit mobile starting with 9.
export function parsePhone(raw: string | undefined, fallbackDdd: string, forceWhatsapp = false): Phone | null {
  if (!raw) return null;
  let d = raw.split(/[;,/]/)[0].replace(/\D/g, "");
  if (d.startsWith("55") && d.length >= 12) d = d.slice(2);
  d = d.replace(/^0+/, "");
  if (d.length === 8 || d.length === 9) d = fallbackDdd + d;
  if (d.length !== 10 && d.length !== 11) return null;

  const ddd = d.slice(0, 2);
  let num = d.slice(2);
  if (num.length === 8 && /^[6-9]/.test(num)) num = "9" + num;
  const mobile = num.length === 9 && num.startsWith("9");
  const display = `(${ddd}) ${num.slice(0, num.length - 4)}-${num.slice(-4)}`;
  return {
    display,
    whatsapp: mobile || forceWhatsapp ? `55${ddd}${num}` : null,
    tel: `+55${ddd}${num}`,
  };
}

function socialUrl(value: string | undefined, base: string) {
  if (!value) return null;
  const v = value.trim();
  if (/^https?:\/\//i.test(v)) return v;
  return base + v.replace(/^@/, "").replace(/^(www\.)?(instagram|facebook)\.com\//i, "");
}

export type Lead = {
  id: string;
  name: string;
  category: CategoryId;
  kind: string;
  address: string;
  bairro: string;
  phone: Phone | null;
  instagram: string | null;
  facebook: string | null;
  email: string | null;
  hours: string | null;
  lat: number | null;
  lon: number | null;
  score: number;
  reasons: string[];
};

const KIND_LABELS: Record<string, string> = {
  restaurant: "Restaurante", cafe: "Café", bar: "Bar", fast_food: "Lanchonete", pub: "Pub", ice_cream: "Sorveteria",
  food_court: "Praça de alimentação", bakery: "Padaria", pastry: "Confeitaria", confectionery: "Doceria", deli: "Empório",
  hairdresser: "Cabeleireiro / barbearia", beauty: "Estética", massage: "Massagem", tattoo: "Estúdio de tatuagem",
  dentist: "Dentista", clinic: "Clínica", doctors: "Consultório", physiotherapist: "Fisioterapia", psychotherapist: "Psicologia",
  alternative: "Terapias", laboratory: "Laboratório", optician: "Ótica", fitness_centre: "Academia", dojo: "Artes marciais",
  clothes: "Roupas", shoes: "Calçados", jewelry: "Joalheria", furniture: "Móveis", florist: "Floricultura", gift: "Presentes",
  sports: "Esportes", bicycle: "Bicicletaria", electronics: "Eletrônicos", mobile_phone: "Celulares", boutique: "Boutique",
  cosmetics: "Cosméticos", interior_decoration: "Decoração", pet: "Pet shop", pet_grooming: "Banho e tosa",
  veterinary: "Veterinária", lawyer: "Advocacia", accountant: "Contabilidade", estate_agent: "Imobiliária",
  architect: "Arquitetura", insurance: "Seguros", car_repair: "Oficina", car_wash: "Lava-car", photographer: "Fotógrafo",
  carpenter: "Marcenaria", electrician: "Elétrica", plumber: "Encanador",
};

function classify(tags: Record<string, string>): { category: CategoryId; kind: string } | null {
  const a = tags.amenity, s = tags.shop, o = tags.office, h = tags.healthcare, l = tags.leisure, c = tags.craft;
  const kind = (v: string) => (v === "hairdresser" && tags.hairdresser === "barber" ? "Barbearia" : KIND_LABELS[v] ?? v);
  if (/^(restaurant|cafe|bar|fast_food|pub|ice_cream|food_court)$/.test(a ?? "")) return { category: "comida", kind: kind(a!) };
  if (/^(bakery|pastry|confectionery|deli)$/.test(s ?? "")) return { category: "comida", kind: kind(s!) };
  if (/^(hairdresser|beauty|massage|tattoo)$/.test(s ?? "")) return { category: "beleza", kind: kind(s!) };
  if (/^(dentist|clinic|doctors)$/.test(a ?? "")) return { category: "saude", kind: kind(a!) };
  if (h) return { category: "saude", kind: kind(h) };
  if (s === "optician") return { category: "saude", kind: kind(s) };
  if (a === "veterinary") return { category: "pet", kind: kind(a) };
  if (/^(pet|pet_grooming)$/.test(s ?? "")) return { category: "pet", kind: kind(s!) };
  if (l === "fitness_centre" || a === "dojo") return { category: "fitness", kind: kind(l === "fitness_centre" ? l : a!) };
  if (l && tags.sport) return { category: "fitness", kind: tags.sport[0].toUpperCase() + tags.sport.slice(1) };
  if (o) return { category: "servicos", kind: kind(o) };
  if (c) return { category: "servicos", kind: kind(c) };
  if (s === "car_repair" || a === "car_wash") return { category: "servicos", kind: kind(s ?? a!) };
  if (s) return { category: "lojas", kind: kind(s) };
  return null;
}

export function toLead(el: OsmElement, ddd: string): Lead | null {
  const t = el.tags ?? {};
  if (!t.name || t.website || t["contact:website"] || t.url) return null;
  const cls = classify(t);
  if (!cls) return null;

  const whatsappTag = t["contact:whatsapp"];
  const phone =
    parsePhone(whatsappTag, ddd, true) ??
    parsePhone(t["contact:mobile"] ?? t.mobile, ddd) ??
    parsePhone(t.phone ?? t["contact:phone"], ddd);
  const instagram = socialUrl(t["contact:instagram"] ?? t.instagram, "https://instagram.com/");
  const facebook = socialUrl(t["contact:facebook"] ?? t.facebook, "https://facebook.com/");
  const email = t.email ?? t["contact:email"] ?? null;
  const street = [t["addr:street"], t["addr:housenumber"]].filter(Boolean).join(", ");
  const bairro = t["addr:suburb"] ?? t["addr:neighbourhood"] ?? t["addr:district"] ?? "";

  const reasons: string[] = ["Sem site"];
  let score = 30;
  if (phone?.whatsapp) { score += 35; reasons.push("Tem WhatsApp"); }
  else if (phone) { score += 20; reasons.push("Tem telefone"); }
  if (instagram || facebook) { score += 10; reasons.push("Ativo nas redes, sem site"); }
  if (t.opening_hours) { score += 5; reasons.push("Horário cadastrado"); }
  if (street) score += 5;
  if (email) { score += 5; reasons.push("Tem e-mail"); }
  const weight = categoryById(cls.category).weight;
  score += weight;
  if (weight >= 15) reasons.push("Nicho com portfólio");

  return {
    id: `${el.type}/${el.id}`,
    name: t.name,
    category: cls.category,
    kind: cls.kind,
    address: street,
    bairro,
    phone,
    instagram,
    facebook,
    email,
    hours: t.opening_hours ?? null,
    lat: el.lat ?? el.center?.lat ?? null,
    lon: el.lon ?? el.center?.lon ?? null,
    score: Math.min(100, score),
    reasons,
  };
}

export function heat(score: number) {
  if (score >= 75) return { label: "Quente", tone: "hot" as const };
  if (score >= 55) return { label: "Morno", tone: "warm" as const };
  return { label: "Frio", tone: "cold" as const };
}

export function pitch(lead: Lead, sender: string, city: string) {
  const where = lead.bairro ? `, bairro ${lead.bairro}` : city ? `, em ${city}` : "";
  const social = lead.instagram || lead.facebook
    ? " Vocês já estão nas redes; um site junta tudo num lugar só e faz vocês aparecerem no Google."
    : "";
  return [
    `Oi, tudo bem? Aqui é o ${sender}, da CODE SITE.`,
    `Vi vocês no mapa (${lead.name}${where}) e reparei que ainda não têm site.${social}`,
    categoryById(lead.category).hook,
    "Dá uma olhada no nosso trabalho: https://codesite.online",
    "Posso te mandar uma ideia de como ficaria o de vocês? Sem compromisso.",
  ].join("\n\n");
}

export const mapsLink = (l: Lead, city: string) =>
  `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent([l.name, l.address, l.bairro, city].filter(Boolean).join(", "))}`;

export const googleLink = (l: Lead, city: string) =>
  `https://www.google.com/search?q=${encodeURIComponent(`${l.name} ${l.bairro || city}`.trim())}`;

export type Status = "novo" | "contatado" | "respondeu" | "fechado" | "descartado";

export const STATUSES: { id: Status; label: string }[] = [
  { id: "novo", label: "Novo" },
  { id: "contatado", label: "Contatado" },
  { id: "respondeu", label: "Respondeu" },
  { id: "fechado", label: "Fechado" },
  { id: "descartado", label: "Descartado" },
];

export type Tracked = { lead: Lead; status: Status; note: string; updatedAt: number };

export function toCsv(rows: { lead: Lead; status: Status; note: string }[]) {
  const head = ["nome", "tipo", "nota", "status", "bairro", "endereco", "telefone", "whatsapp", "instagram", "facebook", "email", "observacao"];
  const esc = (v: string | number | null | undefined) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  const lines = rows.map(({ lead: l, status, note }) =>
    [l.name, l.kind, l.score, status, l.bairro, l.address, l.phone?.display, l.phone?.whatsapp ? `https://wa.me/${l.phone.whatsapp}` : "", l.instagram, l.facebook, l.email, note]
      .map(esc)
      .join(";")
  );
  return "\ufeff" + [head.join(";"), ...lines].join("\n");
}
