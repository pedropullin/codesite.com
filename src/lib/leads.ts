// Lead finder: pulls businesses without a website from OpenStreetMap
// (Overpass API, free and CORS-enabled), scores them and drafts the pitch.

export type CategoryId =
  | "comida" | "mercados" | "beleza" | "saude" | "fitness" | "pet" | "moda" | "casa" | "auto"
  | "tecnologia" | "lojas" | "servicos" | "hospedagem" | "educacao" | "eventos" | "outros";

// A rule matches one OSM tag; `values` omitted means any value of that key.
type Rule = { key: string; values?: string[]; requires?: string };

type Category = {
  id: CategoryId;
  label: string;
  rules: Rule[];
  weight: number;
  hook: string;
};

const r = (key: string, values?: string, requires?: string): Rule => ({ key, values: values?.split(" "), requires });

// Order matters: a business is filed under the first category whose rule matches.
export const CATEGORIES: Category[] = [
  {
    id: "comida",
    label: "Restaurantes e bares",
    rules: [
      r("amenity", "restaurant cafe bar fast_food pub ice_cream food_court biergarten"),
      r("shop", "bakery pastry confectionery deli chocolate coffee tea"),
    ],
    weight: 15,
    hook: "A gente faz site pra restaurante, bar e padaria com cardápio digital, fotos e reserva pelo WhatsApp, e que aparece no Google quando alguém procura onde comer por perto.",
  },
  {
    id: "mercados",
    label: "Mercados e empórios",
    rules: [r("shop", "supermarket convenience greengrocer butcher seafood beverages alcohol wine cheese dairy farm health_food spices frozen_food nuts water")],
    weight: 10,
    hook: "A gente faz site pra mercado e empório com catálogo, ofertas da semana e pedido pelo WhatsApp.",
  },
  {
    id: "beleza",
    label: "Barbearias, salões e estética",
    rules: [r("shop", "hairdresser beauty massage tattoo cosmetics perfumery hairdresser_supply"), r("leisure", "spa"), r("amenity", "spa")],
    weight: 15,
    hook: "A gente faz site pra barbearia, salão e estética com agendamento online e fotos dos trabalhos, pra quem procura no Google achar vocês primeiro.",
  },
  {
    id: "saude",
    label: "Saúde e bem-estar",
    rules: [
      r("amenity", "dentist clinic doctors pharmacy"),
      r("healthcare"),
      r("shop", "optician hearing_aids medical_supply chemist nutrition_supplements herbalist"),
    ],
    weight: 10,
    hook: "A gente faz site pra clínica, consultório e farmácia, com agendamento e as informações que passam confiança pra quem pesquisa no Google.",
  },
  {
    id: "fitness",
    label: "Academias e esportes",
    rules: [
      r("leisure", "fitness_centre sports_centre dance horse_riding"),
      r("amenity", "dojo"),
      r("sport", "yoga pilates crossfit martial_arts boxing climbing", "leisure"),
    ],
    weight: 10,
    hook: "A gente faz site pra academia e estúdio com planos, horários e aula experimental agendada direto pelo site.",
  },
  {
    id: "pet",
    label: "Pet shops e veterinárias",
    rules: [r("shop", "pet pet_grooming"), r("amenity", "veterinary animal_boarding animal_training")],
    weight: 10,
    hook: "A gente faz site pra pet shop e veterinária com serviços, banho e tosa e consultas agendadas online.",
  },
  {
    id: "moda",
    label: "Moda e acessórios",
    rules: [r("shop", "clothes shoes jewelry bag boutique fashion_accessories watches leather fabric sewing wool tailor")],
    weight: 5,
    hook: "A gente faz site e loja virtual pra moda, com vitrine das peças e venda pelo WhatsApp ou online.",
  },
  {
    id: "casa",
    label: "Casa, construção e reformas",
    rules: [
      r("shop", "furniture interior_decoration hardware doityourself paint kitchen bathroom_furnishing flooring curtain bed lighting houseware appliance garden_centre trade glaziery tiles doors windows carpet security"),
      r("craft", "carpenter electrician plumber painter roofer glaziery locksmith hvac tiler stonemason metal_construction builder gardener insulation plasterer window_construction"),
    ],
    weight: 10,
    hook: "A gente faz site que mostra os produtos e o trabalho de vocês e traz pedido de orçamento direto pelo WhatsApp.",
  },
  {
    id: "auto",
    label: "Automotivo",
    rules: [r("shop", "car car_repair car_parts tyres motorcycle motorcycle_repair"), r("amenity", "car_wash vehicle_inspection"), r("craft", "car_repair")],
    weight: 10,
    hook: "A gente faz site pra oficina, lava-car e loja de peças com serviços, preços e agendamento pelo WhatsApp.",
  },
  {
    id: "tecnologia",
    label: "Tecnologia e eletrônicos",
    rules: [r("shop", "computer electronics mobile_phone hifi video_games telecommunication printer_ink"), r("craft", "electronics_repair")],
    weight: 5,
    hook: "A gente faz site pra loja e assistência técnica com produtos, serviços e orçamento pelo WhatsApp.",
  },
  {
    id: "lojas",
    label: "Presentes, livros e variedades",
    rules: [r("shop", "gift florist books stationery toys variety_store sports bicycle outdoor music musical_instrument art craft photo party second_hand games anime collector frame tobacco e-cigarette baby_goods department_store general")],
    weight: 5,
    hook: "A gente faz site e loja virtual pra vender além do balcão, com catálogo e pedido pelo WhatsApp.",
  },
  {
    id: "servicos",
    label: "Escritórios e serviços",
    rules: [
      r("office", "lawyer accountant estate_agent architect insurance consulting financial tax_advisor notary engineer advertising_agency travel_agent employment_agency it coworking graphic_design surveyor"),
      r("shop", "travel_agency copyshop laundry dry_cleaning funeral_directors optician_repair"),
      r("amenity", "funeral_hall"),
      r("craft", "photographer photographic_laboratory shoemaker sign_maker upholsterer printer"),
    ],
    weight: 10,
    hook: "A gente faz site que mostra o trabalho de vocês e traz pedido de orçamento direto pelo WhatsApp.",
  },
  {
    id: "hospedagem",
    label: "Hotéis e pousadas",
    rules: [r("tourism", "hotel guest_house hostel motel apartment chalet camp_site")],
    weight: 10,
    hook: "A gente faz site pra hotel e pousada com fotos dos quartos e reserva direta, sem pagar comissão pra plataforma.",
  },
  {
    id: "educacao",
    label: "Escolas e cursos",
    rules: [r("amenity", "language_school driving_school music_school dancing_school prep_school training kindergarten childcare")],
    weight: 10,
    hook: "A gente faz site pra escola e curso com turmas, horários e matrícula pelo WhatsApp.",
  },
  {
    id: "eventos",
    label: "Eventos e festas",
    rules: [r("amenity", "events_venue nightclub"), r("craft", "caterer"), r("shop", "wedding")],
    weight: 10,
    hook: "A gente faz site pra espaço de eventos e buffet com fotos, pacotes e pedido de orçamento pelo WhatsApp.",
  },
  {
    id: "outros",
    label: "Todos os outros comércios",
    rules: [r("shop"), r("office"), r("craft")],
    weight: 5,
    hook: "A gente faz site sob medida que mostra o trabalho de vocês e traz cliente novo pelo Google e pelo WhatsApp.",
  },
];

export const splitCities = (raw: string) =>
  raw
    .split(/[,;\n]/)
    .map((c) => c.replace(/["\\]/g, "").trim())
    .filter(Boolean)
    .slice(0, 6);

export const categoryById = (id: CategoryId) => CATEGORIES.find((c) => c.id === id)!;

const selector = (rule: Rule) =>
  (rule.values ? `["${rule.key}"~"^(${rule.values.join("|")})$"]` : `["${rule.key}"]`) + (rule.requires ? `["${rule.requires}"]` : "");

export function buildQuery(cities: string[], categories: CategoryId[]) {
  const areas = cities
    .map((c) => `  area["name"="${c}"]["boundary"="administrative"]["admin_level"~"^(7|8)$"];`)
    .join("\n");
  const noSite = '["name"][!"website"][!"contact:website"][!"url"]';
  const clauses = categories
    .flatMap((id) => categoryById(id).rules)
    .map((rule) => `  nwr${selector(rule)}${noSite}(area.a);`)
    .join("\n");
  return `[out:json][timeout:120][maxsize:268435456];
(
${areas}
)->.a;
(
${clauses}
);
out center tags 3000;`;
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
  let d = raw.replace(/\D/g, "");
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

// OSM often stores several numbers ("fixo; celular"). Prefer a WhatsApp-capable one.
function pickPhone(t: Record<string, string>, ddd: string): Phone | null {
  const split = (v?: string) => (v ? v.split(/[;,/]|\s+ou\s+|\s+e\s+/i).map((x) => x.trim()).filter(Boolean) : []);
  const forced = split(t["contact:whatsapp"] ?? t.whatsapp).map((n) => parsePhone(n, ddd, true));
  const others = [t["contact:mobile"], t.mobile, t.phone, t["contact:phone"]].flatMap(split).map((n) => parsePhone(n, ddd));
  const all = [...forced, ...others].filter((p): p is Phone => p !== null);
  return all.find((p) => p.whatsapp) ?? all[0] ?? null;
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
  city: string;
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
  hotel: "Hotel", guest_house: "Pousada", hostel: "Hostel", motel: "Motel", apartment: "Apart-hotel", chalet: "Chalé",
  language_school: "Escola de idiomas", driving_school: "Autoescola", music_school: "Escola de música",
  dancing_school: "Escola de dança", prep_school: "Cursinho", training: "Cursos",
  sports: "Esportes", bicycle: "Bicicletaria", electronics: "Eletrônicos", mobile_phone: "Celulares", boutique: "Boutique",
  cosmetics: "Cosméticos", interior_decoration: "Decoração", pet: "Pet shop", pet_grooming: "Banho e tosa",
  veterinary: "Veterinária", lawyer: "Advocacia", accountant: "Contabilidade", estate_agent: "Imobiliária",
  architect: "Arquitetura", insurance: "Seguros", car_repair: "Oficina", car_wash: "Lava-car", photographer: "Fotógrafo",
  carpenter: "Marcenaria", electrician: "Elétrica", plumber: "Encanador",
  biergarten: "Cervejaria", chocolate: "Chocolateria", coffee: "Cafeteria", tea: "Casa de chá",
  supermarket: "Mercado", convenience: "Conveniência", greengrocer: "Hortifrúti", butcher: "Açougue", seafood: "Peixaria",
  beverages: "Bebidas", alcohol: "Adega", wine: "Vinhos", cheese: "Queijaria", dairy: "Laticínios", farm: "Produtos da roça",
  health_food: "Produtos naturais", spices: "Temperos", frozen_food: "Congelados", nuts: "Empório de grãos", water: "Água mineral",
  perfumery: "Perfumaria", hairdresser_supply: "Produtos de beleza", spa: "Spa", pharmacy: "Farmácia",
  hearing_aids: "Aparelhos auditivos", medical_supply: "Artigos médicos", chemist: "Drogaria",
  nutrition_supplements: "Suplementos", herbalist: "Ervas e naturais", sports_centre: "Centro esportivo", dance: "Dança",
  horse_riding: "Hipismo", animal_boarding: "Hotel para pets", animal_training: "Adestramento",
  bag: "Bolsas", fashion_accessories: "Acessórios", watches: "Relojoaria", leather: "Couro", fabric: "Tecidos",
  sewing: "Aviamentos", wool: "Lãs", tailor: "Costura", hardware: "Ferragens", doityourself: "Material de construção",
  paint: "Tintas", kitchen: "Cozinhas planejadas", bathroom_furnishing: "Banheiros", flooring: "Pisos", curtain: "Cortinas",
  bed: "Colchões", lighting: "Iluminação", houseware: "Utilidades domésticas", appliance: "Eletrodomésticos",
  garden_centre: "Garden center", trade: "Materiais", glaziery: "Vidraçaria", tiles: "Revestimentos", doors: "Portas",
  windows: "Janelas", carpet: "Tapetes", security: "Segurança", painter: "Pintura", roofer: "Telhados", locksmith: "Chaveiro",
  hvac: "Ar-condicionado", tiler: "Azulejista", stonemason: "Marmoraria", metal_construction: "Serralheria",
  builder: "Construtora", gardener: "Jardinagem", insulation: "Isolamento", plasterer: "Gesso",
  window_construction: "Esquadrias", car: "Concessionária", car_parts: "Autopeças", tyres: "Pneus", motorcycle: "Motos",
  motorcycle_repair: "Oficina de motos", vehicle_inspection: "Vistoria", computer: "Informática", hifi: "Som",
  video_games: "Games", telecommunication: "Telefonia", printer_ink: "Cartuchos", electronics_repair: "Assistência técnica",
  books: "Livraria", stationery: "Papelaria", toys: "Brinquedos", variety_store: "Variedades", outdoor: "Camping",
  music: "Discos", musical_instrument: "Instrumentos musicais", art: "Arte", craft: "Artesanato", photo: "Foto",
  party: "Festas", second_hand: "Brechó", games: "Jogos", anime: "Geek", collector: "Colecionáveis", frame: "Molduras",
  tobacco: "Tabacaria", "e-cigarette": "Vape", baby_goods: "Bebês", department_store: "Loja de departamentos",
  general: "Loja", consulting: "Consultoria", financial: "Financeira", tax_advisor: "Assessoria fiscal", notary: "Cartório",
  engineer: "Engenharia", advertising_agency: "Agência de publicidade", travel_agent: "Agência de viagens",
  employment_agency: "Agência de empregos", it: "TI", coworking: "Coworking", graphic_design: "Design gráfico",
  surveyor: "Topografia", travel_agency: "Agência de viagens", copyshop: "Copiadora", laundry: "Lavanderia",
  dry_cleaning: "Lavanderia", funeral_directors: "Funerária", funeral_hall: "Funerária", optician_repair: "Ótica",
  photographic_laboratory: "Laboratório de fotos", shoemaker: "Sapateiro", sign_maker: "Comunicação visual",
  upholsterer: "Tapeçaria", printer: "Gráfica", camp_site: "Camping", kindergarten: "Escola infantil",
  childcare: "Creche", events_venue: "Espaço de eventos", nightclub: "Casa noturna", caterer: "Buffet", wedding: "Casamentos",
};

const humanize = (v: string) => {
  const t = v.replace(/_/g, " ");
  return t[0].toUpperCase() + t.slice(1);
};

function classify(tags: Record<string, string>): { category: CategoryId; kind: string } | null {
  for (const cat of CATEGORIES) {
    for (const rule of cat.rules) {
      const v = tags[rule.key];
      if (!v || (rule.values && !rule.values.includes(v)) || (rule.requires && !tags[rule.requires])) continue;
      if (v === "hairdresser" && tags.hairdresser === "barber") return { category: cat.id, kind: "Barbearia" };
      return { category: cat.id, kind: KIND_LABELS[v] ?? humanize(v) };
    }
  }
  return null;
}

export function toLead(el: OsmElement, ddd: string): Lead | null {
  const t = el.tags ?? {};
  if (!t.name || t.website || t["contact:website"] || t.url) return null;
  const cls = classify(t);
  if (!cls) return null;

  const phone = pickPhone(t, ddd);
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
    city: t["addr:city"] ?? "",
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

export type Tracked = { lead: Lead; status: Status; note: string; updatedAt: number; contactedAt?: number };

export const FOLLOW_UP_DAYS = 3;

export const daysSince = (ts: number) => Math.floor((Date.now() - ts) / 86_400_000);

export function toCsv(rows: { lead: Lead; status: Status; note: string }[]) {
  const head = ["nome", "tipo", "nota", "status", "cidade", "bairro", "endereco", "telefone", "whatsapp", "instagram", "facebook", "email", "observacao"];
  const esc = (v: string | number | null | undefined) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  const lines = rows.map(({ lead: l, status, note }) =>
    [l.name, l.kind, l.score, status, l.city, l.bairro, l.address, l.phone?.display, l.phone?.whatsapp ? `https://wa.me/${l.phone.whatsapp}` : "", l.instagram, l.facebook, l.email, note]
      .map(esc)
      .join(";")
  );
  return "\ufeff" + [head.join(";"), ...lines].join("\n");
}
