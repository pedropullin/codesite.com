import type { ProductColor } from "./schema";

export type SeedCategory = {
  slug: string;
  name: string;
  description: string;
  image: string;
};

export type SeedProduct = {
  slug: string;
  name: string;
  sku: string;
  category: string;
  price: number;
  salePrice?: number;
  description: string;
  details: string[];
  images: string[];
  sizes: string[];
  colors: ProductColor[];
  label?: string;
  featured?: boolean;
  isNew?: boolean;
  /** Stock per variant, or a function of (size, color). */
  stock: number | ((size: string | null, color: string | null) => number);
};

const r = (key: string) => `/renders/${key}.webp`;

export const seedCategories: SeedCategory[] = [
  {
    slug: "clothing",
    name: "Clothing",
    description:
      "Algodão de gramatura pesada, modelagens arquitetônicas e acabamentos invisíveis.",
    image: r("category-clothing"),
  },
  {
    slug: "accessories",
    name: "Accessories",
    description: "Metais escovados, couro e objetos pensados para o uso diário.",
    image: r("category-accessories"),
  },
  {
    slug: "footwear",
    name: "Footwear",
    description: "Silhuetas limpas, solados esculpidos e materiais nobres.",
    image: r("category-footwear"),
  },
  {
    slug: "exclusives",
    name: "Exclusives",
    description: "Edições numeradas, disponíveis apenas dentro do Vault.",
    image: r("category-exclusives"),
  },
];

const APPAREL_SIZES = ["P", "M", "G", "GG"];
const SHOE_SIZES = ["38", "39", "40", "41", "42", "43", "44"];

export const seedProducts: SeedProduct[] = [
  {
    slug: "essential-tee",
    name: "Essential Tee",
    sku: "VA-CL-001",
    category: "clothing",
    price: 39000,
    description:
      "A camiseta que abre o arquivo. Algodão penteado de 260 g/m², gola dupla canelada e etiqueta metálica aplicada à mão na barra. Caimento reto, ombro levemente deslocado.",
    details: [
      "100% algodão penteado, 260 g/m²",
      "Gola canelada dupla",
      "Tag metálica Vault na barra",
      "Lavagem enzimática anti-encolhimento",
    ],
    images: [r("tee-black-1"), r("tee-black-2"), r("tee-bone-1")],
    sizes: APPAREL_SIZES,
    colors: [
      { name: "Black", hex: "#111112", image: r("tee-black-1") },
      { name: "Bone", hex: "#E4DFD4", image: r("tee-bone-1") },
    ],
    isNew: true,
    featured: true,
    stock: (size) => (size === "GG" ? 4 : 14),
  },
  {
    slug: "archive-hoodie",
    name: "Archive Hoodie",
    sku: "VA-CL-002",
    category: "clothing",
    price: 119000,
    salePrice: 99000,
    description:
      "Moletom de 480 g/m² com felpa escovada internamente. Capuz de dupla camada, cordões encerados com ponteiras em aço escovado e bordado tonal Vault no peito.",
    details: [
      "Algodão felpado 480 g/m²",
      "Capuz de dupla camada",
      "Ponteiras em aço escovado",
      "Bordado tonal no peito",
    ],
    images: [r("hoodie-graphite-1"), r("hoodie-graphite-2"), r("hoodie-black-1")],
    sizes: APPAREL_SIZES,
    colors: [
      { name: "Graphite", hex: "#3A3B3F", image: r("hoodie-graphite-1") },
      { name: "Black", hex: "#111112", image: r("hoodie-black-1") },
    ],
    featured: true,
    stock: (size, color) => (color === "Black" && size === "P" ? 0 : 9),
  },
  {
    slug: "vault-crewneck",
    name: "Vault Crewneck",
    sku: "VA-CL-003",
    category: "clothing",
    price: 89000,
    description:
      "Crewneck em moletom pesado com punhos e barra em ribana de alta recuperação. Assinatura Vault aplicada em relevo, sem tinta.",
    details: [
      "Moletom 420 g/m²",
      "Ribana de alta recuperação",
      "Assinatura em alto-relevo",
    ],
    images: [r("crew-bone-1"), r("crew-bone-2")],
    sizes: APPAREL_SIZES,
    colors: [{ name: "Bone", hex: "#E4DFD4" }],
    isNew: true,
    stock: 8,
  },
  {
    slug: "six-panel-cap",
    name: "Six-Panel Cap",
    sku: "VA-CL-004",
    category: "clothing",
    price: 45000,
    description:
      "Boné de seis painéis em sarja de algodão encerado. Fecho traseiro em metal cromado com gravação Vault Association.",
    details: ["Sarja de algodão encerada", "Fecho metálico gravado", "Aba pré-curvada"],
    images: [r("cap-black-1"), r("cap-black-2")],
    sizes: ["Único"],
    colors: [{ name: "Black", hex: "#111112" }],
    isNew: true,
    stock: 20,
  },
  {
    slug: "ribbed-beanie",
    name: "Ribbed Beanie",
    sku: "VA-CL-005",
    category: "clothing",
    price: 32000,
    description:
      "Gorro em lã merino com canelado largo e barra dobrada. Plaqueta metálica Vault costurada na dobra.",
    details: ["Lã merino extrafina", "Canelado 2×2", "Plaqueta metálica"],
    images: [r("beanie-black-1"), r("beanie-graphite-1")],
    sizes: ["Único"],
    colors: [
      { name: "Black", hex: "#111112", image: r("beanie-black-1") },
      { name: "Graphite", hex: "#3A3B3F", image: r("beanie-graphite-1") },
    ],
    stock: 12,
  },
  {
    slug: "va-01-runner",
    name: "VA-01 Runner",
    sku: "VA-FW-001",
    category: "footwear",
    price: 249000,
    description:
      "O primeiro calçado da associação. Cabedal em couro nobuck e malha técnica, solado esculpido em borracha de alta densidade e contraforte com placa metálica gravada.",
    details: [
      "Couro nobuck e malha técnica",
      "Solado esculpido de alta densidade",
      "Placa metálica no contraforte",
      "Acompanha dust bag e caixa Vault",
    ],
    images: [r("runner-black-1"), r("runner-black-2"), r("runner-bone-1")],
    sizes: SHOE_SIZES,
    colors: [
      { name: "Black", hex: "#111112", image: r("runner-black-1") },
      { name: "Bone", hex: "#E4DFD4", image: r("runner-bone-1") },
    ],
    label: "First Release",
    featured: true,
    isNew: true,
    stock: (size) => (size === "44" ? 1 : 5),
  },
  {
    slug: "vault-slide",
    name: "Vault Slide",
    sku: "VA-FW-002",
    category: "footwear",
    price: 69000,
    description:
      "Slide monobloco em EVA de alta densidade com acabamento acetinado. Palmilha anatômica e logotipo em baixo-relevo na tira.",
    details: ["EVA de alta densidade", "Palmilha anatômica", "Logotipo em baixo-relevo"],
    images: [r("slide-black-1"), r("slide-black-2")],
    sizes: SHOE_SIZES,
    colors: [{ name: "Black", hex: "#111112" }],
    stock: 10,
  },
  {
    slug: "chrome-tag-keychain",
    name: "Chrome Tag Keychain",
    sku: "VA-AC-001",
    category: "accessories",
    price: 29000,
    description:
      "Chaveiro em aço inoxidável polido com tag gravada a laser. O mesmo formato da tag que acompanha cada peça do arquivo.",
    details: ["Aço inoxidável 316L", "Gravação a laser", "Argola de 30 mm"],
    images: [r("keychain-1"), r("keychain-2")],
    sizes: ["Único"],
    colors: [{ name: "Chrome", hex: "#C9CBCE" }],
    stock: 30,
  },
  {
    slug: "cuban-link-chain",
    name: "Cuban Link Chain",
    sku: "VA-AC-002",
    category: "accessories",
    price: 129000,
    description:
      "Corrente em prata 925 com elos cubanos diamantados e fecho tipo caixa com trava dupla. Gravação Vault no fecho.",
    details: ["Prata 925", "Elos de 6 mm", "Fecho caixa com trava dupla"],
    images: [r("chain-1"), r("chain-2")],
    sizes: ["50 cm", "60 cm"],
    colors: [{ name: "Sterling", hex: "#D4D6D9" }],
    featured: true,
    stock: 6,
  },
  {
    slug: "signet-ring",
    name: "Signet Ring",
    sku: "VA-AC-003",
    category: "accessories",
    price: 59000,
    description:
      "Anel de selo em aço escovado com face polida espelhada. Monograma VA gravado em baixo-relevo.",
    details: ["Aço escovado", "Face polida espelhada", "Monograma em baixo-relevo"],
    images: [r("ring-1"), r("ring-2")],
    sizes: ["16", "18", "20", "22"],
    colors: [{ name: "Steel", hex: "#9A9CA0" }],
    stock: (size) => (size === "22" ? 2 : 6),
  },
  {
    slug: "card-holder",
    name: "Card Holder",
    sku: "VA-AC-004",
    category: "accessories",
    price: 49000,
    description:
      "Porta-cartões em couro granulado com costura selada à mão e logotipo gravado a quente. Quatro compartimentos.",
    details: ["Couro bovino granulado", "Costura selada", "Gravação a quente"],
    images: [r("cardholder-1"), r("cardholder-2")],
    sizes: ["Único"],
    colors: [{ name: "Black", hex: "#111112" }],
    stock: 15,
  },
  {
    slug: "vault-tote",
    name: "Vault Tote",
    sku: "VA-AC-005",
    category: "accessories",
    price: 79000,
    description:
      "Tote estruturada em lona encerada com alças em corda e base reforçada. Plaqueta metálica frontal.",
    details: ["Lona encerada 18 oz", "Alças em corda", "Base reforçada"],
    images: [r("tote-1"), r("tote-2")],
    sizes: ["Único"],
    colors: [{ name: "Black", hex: "#111112" }],
    stock: 9,
  },
  {
    slug: "monolith-lighter",
    name: "Monolith Lighter",
    sku: "VA-AC-006",
    category: "accessories",
    price: 36000,
    description:
      "Isqueiro recarregável em latão cromado com tampa articulada e mecanismo de precisão. Gravação Vault na base.",
    details: ["Latão cromado", "Recarregável", "Tampa articulada"],
    images: [r("lighter-1"), r("lighter-2")],
    sizes: ["Único"],
    colors: [{ name: "Chrome", hex: "#C9CBCE" }],
    isNew: true,
    stock: 18,
  },
  {
    slug: "the-vault-box",
    name: "The Vault Box",
    sku: "VA-EX-001",
    category: "exclusives",
    price: 390000,
    description:
      "A caixa que dá nome à associação. Estrutura rígida em acabamento preto fosco, ferragens em aço escovado e logotipo em baixo-relevo. Contém tag 925 numerada, cartão de autenticidade e uma peça surpresa do arquivo.",
    details: [
      "Edição numerada de 250 unidades",
      "Tag em prata 925 numerada",
      "Cartão de autenticidade",
      "Peça surpresa do arquivo",
    ],
    images: [r("vaultbox-1"), r("vaultbox-2"), r("vaultbox-3")],
    sizes: ["Único"],
    colors: [{ name: "Matte Black", hex: "#0B0B0C" }],
    label: "Edition 001 / 250",
    featured: true,
    stock: 7,
  },
  {
    slug: "vault-tag-925",
    name: "Vault Tag 925",
    sku: "VA-EX-002",
    category: "exclusives",
    price: 149000,
    description:
      "A tag de identidade da associação em prata 925 maciça, numerada individualmente e acompanhada de corrente veneziana. O objeto que abre o Vault.",
    details: ["Prata 925 maciça", "Numeração individual", "Corrente veneziana 60 cm"],
    images: [r("tag925-1"), r("tag925-2")],
    sizes: ["Único"],
    colors: [{ name: "Sterling", hex: "#D4D6D9" }],
    label: "Numbered / 100",
    featured: true,
    isNew: true,
    stock: 11,
  },
  {
    slug: "archive-capsule-001",
    name: "Archive Capsule 001",
    sku: "VA-EX-003",
    category: "exclusives",
    price: 229000,
    description:
      "Cápsula de arquivo com Essential Tee, tag metálica e cartão de autenticidade em caixa numerada. Primeira tiragem esgotada — cadastre-se para a próxima.",
    details: ["Essential Tee + Tag + Cartão", "Caixa numerada", "Tiragem única"],
    images: [r("capsule-1"), r("capsule-2")],
    sizes: ["Único"],
    colors: [{ name: "Black", hex: "#111112" }],
    label: "Limited",
    stock: 0,
  },
  {
    slug: "va-01-runner-chrome",
    name: "VA-01 Runner Chrome",
    sku: "VA-EX-004",
    category: "exclusives",
    price: 429000,
    description:
      "Edição especial do VA-01 com cabedal em couro metalizado cromado e solado translúcido fumê. Cinquenta pares numerados.",
    details: ["Couro metalizado", "Solado fumê translúcido", "Edição de 50 pares"],
    images: [r("runner-chrome-1"), r("runner-chrome-2")],
    sizes: ["39", "40", "41", "42", "43"],
    colors: [{ name: "Chrome", hex: "#C9CBCE" }],
    label: "Edition / 50",
    stock: (size) => (size === "41" ? 2 : 0),
  },
];
