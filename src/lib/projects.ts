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
    name: "ARCO Odontologia",
    category: "Conceito · Clínica odontológica · Site",
    description:
      "Site conceito para uma clínica fictícia em Curitiba: o arco da arcada dentária vira janelas, botões e o rodapé, com tabela de valores e um cupom de agendamento que mostra como vai ser a primeira consulta.",
    url: "https://codesite.online/projetos/arco/",
    theme: "electric",
    stack: ["Site", "Agendamento", "Valores"],
    shots: { desktop: "/work/arco-desktop.jpg", mobile: "/work/arco-mobile.jpg" },
  },
];
