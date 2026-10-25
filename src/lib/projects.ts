export type ProjectTheme = "electric" | "graphite" | "ember";

export type Project = {
  name: string;
  category: string;
  description: string;
  url: string;
  theme: ProjectTheme;
  stack: string[];
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
  },
  {
    name: "Prospecta.ai",
    category: "SaaS · Prospecção · CRM",
    description:
      "Plataforma para encontrar empresas em qualquer lugar do mundo, ver quem ainda não tem site e chamar no WhatsApp em um clique, com um CRM para acompanhar cada venda.",
    url: "https://prospecta-ai-ashy.vercel.app/",
    theme: "electric",
    stack: ["SaaS", "Planos", "CRM"],
  },
  {
    name: "BRASA 41",
    category: "Conceito · Hamburgueria · Landing page",
    description:
      "Landing conceito para uma smash burger fictícia: o hambúrguer se desmonta camada por camada na rolagem, com cardápio em abas e brasas animadas no topo.",
    url: "https://codesite.online/projetos/brasa41",
    theme: "ember",
    stack: ["Landing page", "Animação", "Cardápio"],
  },
];
