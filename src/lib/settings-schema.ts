import { z } from "zod";

/**
 * Store settings are stored as JSON documents in STORE_SETTINGS (one row per
 * section). This module is client-safe: it only contains types, validation
 * and defaults.
 */

export const brandSchema = z.object({
  name: z.string().min(1).max(80),
  shortName: z.string().min(1).max(40),
  tagline: z.string().max(160),
  logoUrl: z.string().max(500).optional().default(""),
  description: z.string().max(1200),
  manifesto: z.string().max(1200),
  foundedYear: z.string().max(12),
  location: z.string().max(80),
});

export const contactSchema = z.object({
  email: z.string().max(120),
  whatsapp: z.string().max(30),
  phone: z.string().max(30),
  instagram: z.string().max(80),
  tiktok: z.string().max(80).optional().default(""),
  youtube: z.string().max(120).optional().default(""),
  x: z.string().max(80).optional().default(""),
  pinterest: z.string().max(120).optional().default(""),
  address: z.string().max(200),
  hours: z.string().max(120),
});

export const heroSchema = z.object({
  eyebrow: z.string().max(60),
  titleLine1: z.string().min(1).max(40),
  titleLine2: z.string().max(40),
  subtitle: z.string().max(240),
  ctaPrimary: z.string().max(40),
  ctaSecondary: z.string().max(40),
  scrollLabel: z.string().max(40),
  annotations: z.array(z.string().max(40)).max(4),
});

export const textsSchema = z.object({
  announcement: z.string().max(140),
  brandStatement: z.string().max(400),
  collectionTitle: z.string().max(60),
  collectionIntro: z.string().max(300),
  categoriesTitle: z.string().max(60),
  categoriesIntro: z.string().max(300),
  featuredLabel: z.string().max(60),
  galleryTitle: z.string().max(60),
  catalogTitle: z.string().max(60),
  catalogIntro: z.string().max(300),
  footerNote: z.string().max(300),
  shippingNote: z.string().max(200),
});

export const bannerSchema = z.object({
  title: z.string().min(1).max(60),
  category: z.string().max(60),
  description: z.string().max(200),
  image: z.string().max(500),
  href: z.string().max(300),
  cta: z.string().max(40),
});

export const bannersSchema = z.object({
  items: z.array(bannerSchema).min(1).max(6),
});

export const featuredSchema = z.object({
  productSlug: z.string().max(120),
  collectionLabel: z.string().max(60),
  image: z.string().max(500).optional().default(""),
  heroProductSlug: z.string().max(120).optional().default(""),
});

export const settingsSchemas = {
  brand: brandSchema,
  contact: contactSchema,
  hero: heroSchema,
  texts: textsSchema,
  banners: bannersSchema,
  featured: featuredSchema,
} as const;

export type SettingsKey = keyof typeof settingsSchemas;
export type BrandSettings = z.infer<typeof brandSchema>;
export type ContactSettings = z.infer<typeof contactSchema>;
export type HeroSettings = z.infer<typeof heroSchema>;
export type TextsSettings = z.infer<typeof textsSchema>;
export type Banner = z.infer<typeof bannerSchema>;
export type BannersSettings = z.infer<typeof bannersSchema>;
export type FeaturedSettings = z.infer<typeof featuredSchema>;

export type StoreSettings = {
  brand: BrandSettings;
  contact: ContactSettings;
  hero: HeroSettings;
  texts: TextsSettings;
  banners: BannersSettings;
  featured: FeaturedSettings;
};

export const defaultSettings: StoreSettings = {
  brand: {
    name: "Vault Association",
    shortName: "Vault",
    tagline: "The vault of exclusivity.",
    logoUrl: "",
    description:
      "Vault Association é uma casa de objetos e vestuário de edição limitada. Cada peça é desenhada, numerada e guardada como parte de um arquivo — pensada para ser mantida, não descartada.",
    manifesto:
      "Não produzimos em excesso. Produzimos com intenção. Tecidos pesados, metais escovados, embalagens que merecem ser guardadas. Uma associação para quem entende que exclusividade é uma forma de cuidado.",
    foundedYear: "MMXXVI",
    location: "São Paulo, BR",
  },
  contact: {
    email: "contato@vaultassociation.com",
    whatsapp: "5511999990000",
    phone: "+55 11 99999-0000",
    instagram: "vaultassociation",
    tiktok: "",
    youtube: "",
    x: "",
    pinterest: "",
    address: "Rua Oscar Freire, 000 — Jardins, São Paulo",
    hours: "Seg — Sáb, 10h às 19h",
  },
  hero: {
    eyebrow: "Vault / Association",
    titleLine1: "The Vault",
    titleLine2: "of Exclusivity",
    subtitle: "Uma experiência de curadoria, exclusividade e identidade.",
    ctaPrimary: "Explore Collection",
    ctaSecondary: "View Products",
    scrollLabel: "Scroll to explore",
    annotations: [
      "Matte black finish",
      "Brushed steel hardware",
      "Debossed identity",
      "Numbered 001 / 250",
    ],
  },
  texts: {
    announcement: "Drop 001 — edições numeradas disponíveis por tempo limitado",
    brandStatement:
      "Uma associação de objetos raros, vestuário de construção precisa e embalagens feitas para durar. Cada lançamento é finito. Cada peça, documentada.",
    collectionTitle: "The Collection",
    collectionIntro:
      "Peças selecionadas do arquivo atual. Produção limitada, sem reposição garantida.",
    categoriesTitle: "Categories",
    categoriesIntro: "Quatro frentes, uma mesma disciplina de forma e material.",
    featuredLabel: "Featured Object",
    galleryTitle: "The Lines",
    catalogTitle: "The Catalog",
    catalogIntro: "O arquivo completo. Filtre por categoria, preço e disponibilidade.",
    footerNote:
      "Objetos de edição limitada. Produzidos em pequenas tiragens e entregues em embalagem Vault numerada.",
    shippingNote: "Frete e prazo confirmados pelo nosso concierge via WhatsApp.",
  },
  banners: {
    items: [
      {
        title: "Vault Essential",
        category: "Clothing",
        description: "Básicos de gramatura pesada. A base de todo arquivo.",
        image: "/renders/campaign-essential.webp",
        href: "/shop?category=clothing",
        cta: "Explore",
      },
      {
        title: "Vault Archive",
        category: "Accessories",
        description: "Metais escovados, couro e objetos de uso diário.",
        image: "/renders/campaign-archive.webp",
        href: "/shop?category=accessories",
        cta: "Explore",
      },
      {
        title: "Vault Select",
        category: "Footwear",
        description: "Silhuetas esculpidas. Solados precisos.",
        image: "/renders/campaign-select.webp",
        href: "/shop?category=footwear",
        cta: "Explore",
      },
      {
        title: "Vault Exclusive",
        category: "Exclusives",
        description: "Edições numeradas. Disponíveis somente dentro do Vault.",
        image: "/renders/campaign-exclusive.webp",
        href: "/shop?category=exclusives",
        cta: "Explore",
      },
    ],
  },
  featured: {
    productSlug: "va-01-runner",
    collectionLabel: "Drop 001",
    image: "/renders/runner-hero.webp",
    heroProductSlug: "vault-tag-925",
  },
};
