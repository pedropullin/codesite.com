export type ProjectTheme = "ember" | "forest" | "graphite";

export type Project = {
  index: string;
  name: string;
  category: string;
  description: string;
  url: string;
  theme: ProjectTheme;
  stack: string[];
};

export const projects: Project[] = [
  {
    index: "01",
    name: "Prime Parrilla",
    category: "Restaurante · Branding · Web Design",
    description:
      "Uma experiência digital sofisticada para uma parrilla premium — gastronomia, identidade visual e interface em harmonia.",
    url: "https://prime-parrilla-cwb.base44.app/",
    theme: "ember",
    stack: ["Web Design", "Cardápio digital", "Reservas"],
  },
  {
    index: "02",
    name: "Jardim do Bosque",
    category: "Restaurante · Experiência · Web Design",
    description:
      "Um refúgio natural no coração de Curitiba, traduzido em uma experiência digital calma e imersiva.",
    url: "https://jardim-bosque-gastronomia.base44.app/",
    theme: "forest",
    stack: ["Experiência", "Galeria", "Eventos"],
  },
  {
    index: "03",
    name: "Chiseled Edge Barber",
    category: "Barbearia · Identidade de Marca · Web Design",
    description:
      "Precisão e caráter para uma barbearia contemporânea — uma identidade forte com presença digital à altura.",
    url: "https://chiseled-edge-barber.base44.app/",
    theme: "graphite",
    stack: ["Identidade", "Agendamento", "Landing page"],
  },
];
