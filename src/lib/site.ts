// Every contact link on the site comes from here, so changing a profile or
// the phone number is a one-line edit.

const WHATSAPP_NUMBER = "5541984303059";
const WHATSAPP_GREETING =
  "Olá! Vim pelo site da CODE SITE e quero conversar sobre um projeto.";

export const site = {
  name: "CODE SITE",
  tagline: "Estúdio Digital",
  description:
    "CODE SITE é um estúdio de criação digital especializado em web design, desenvolvimento e experiências interativas de alto nível.",
  url: "https://codesite.online",
  email: "hello@codesite.studio",
  phoneDisplay: "+55 41 98430-3059",
  whatsappNumber: WHATSAPP_NUMBER,
};

export function whatsappLink(message: string = WHATSAPP_GREETING) {
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
}

export function mailtoLink(subject = "Projeto — CODE SITE", body = "") {
  const params = new URLSearchParams({ subject, body });
  // URLSearchParams encodes spaces as "+", which mail clients show literally.
  return `mailto:${site.email}?${params.toString().replace(/\+/g, "%20")}`;
}

export type SocialId =
  | "whatsapp"
  | "instagram"
  | "discord"
  | "tiktok"
  | "email"
  | "linkedin";

export type Social = {
  id: SocialId;
  label: string;
  handle: string;
  href: string;
};

export const socials: Social[] = [
  {
    id: "whatsapp",
    label: "WhatsApp",
    handle: site.phoneDisplay,
    href: whatsappLink(),
  },
  {
    id: "instagram",
    label: "Instagram",
    handle: "@codesite0",
    href: "https://www.instagram.com/codesite0/",
  },
  {
    id: "discord",
    label: "Discord",
    handle: "Servidor CODE SITE",
    href: "https://discord.gg/2FMESJpwhA",
  },
  {
    id: "tiktok",
    label: "TikTok",
    handle: "@code.site0",
    href: "https://www.tiktok.com/@code.site0",
  },
  {
    id: "email",
    label: "E-mail",
    handle: site.email,
    href: mailtoLink(),
  },
  {
    id: "linkedin",
    label: "LinkedIn",
    handle: "Pedro Pullin Arantes",
    href: "https://www.linkedin.com/in/pedro-henrique-pullin-arantes-3a5a2a3ab",
  },
];

export function social(id: SocialId): Social {
  const found = socials.find((s) => s.id === id);
  if (!found) throw new Error(`Unknown social: ${id}`);
  return found;
}

export const navLinks = [
  { href: "#servicos", label: "Serviços" },
  { href: "#trabalhos", label: "Trabalhos" },
  { href: "#processo", label: "Processo" },
  { href: "#contato", label: "Contato" },
];
