export type ProjectTheme = "electric" | "graphite" | "ember";

export type Project = {
  name: string;
  category: string;
  description: string;
  url: string;
  theme: ProjectTheme;
  stack: string[];
  /** Real screenshots of the live project, in public/work. */
  shots: { desktop: string; mobile: string };
  /** Optional muted loop shown in place of the phone screenshot. */
  clip?: string;
};

export const projects: Project[] = [
  {
    name: "SAINT AMI",
    category: "Moda de luxo · Landing page · Encomendas",
    description:
      "Landing para revenda de peças de grife 100% originais, sob encomenda: curadoria por categoria e pedido direto pelo WhatsApp.",
    url: "https://saintami.vercel.app/",
    theme: "graphite",
    stack: ["Landing page", "Catálogo", "WhatsApp"],
    shots: { desktop: "/work/saintami-desktop.jpg", mobile: "/work/saintami-mobile.jpg" },
  },
  {
    name: "Prospecta.ai",
    category: "SaaS · Prospecção · CRM",
    description:
      "Plataforma para encontrar empresas em qualquer lugar do mundo, ver quem ainda não tem site e chamar no WhatsApp em um clique, com um CRM para acompanhar cada venda.",
    url: "https://prospecta-ai-ashy.vercel.app/",
    theme: "electric",
    stack: ["SaaS", "Planos", "CRM"],
    shots: { desktop: "/work/prospecta-desktop.jpg", mobile: "/work/prospecta-mobile.jpg" },
  },
  {
    name: "BRASA 41",
    category: "Conceito · Hamburgueria · Landing page",
    description:
      "Landing conceito para uma smash burger fictícia: um hambúrguer em 3D realista gira no topo e se desmonta camada por camada na rolagem, com cardápio em abas e brasas animadas.",
    url: "https://codesite.online/projetos/brasa41",
    theme: "ember",
    stack: ["Landing page", "3D", "Cardápio"],
    shots: { desktop: "/work/brasa41-desktop.jpg", mobile: "/work/brasa41-mobile.jpg" },
    clip: "/work/brasa41-reel.mp4",
  },
];
