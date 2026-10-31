import Reveal from "./Reveal";

const SERVICES = [
  {
    title: "Sites institucionais",
    text: "Presença digital com cara de marca grande: rápida, responsiva e fácil de atualizar.",
    tags: ["Next.js", "CMS", "Responsivo"],
  },
  {
    title: "Landing pages",
    text: "Páginas de alta conversão para campanhas, lançamentos e captação de clientes.",
    tags: ["Conversão", "A/B", "Analytics"],
  },
  {
    title: "E-commerce",
    text: "Lojas virtuais completas, do catálogo ao checkout, integradas a pagamento e frete.",
    tags: ["Checkout", "Pix", "Estoque"],
  },
  {
    title: "Sistemas & apps web",
    text: "Painéis, agendamentos e ferramentas sob medida para automatizar o seu negócio.",
    tags: ["Dashboards", "APIs", "Login"],
  },
  {
    title: "Experiências 3D",
    text: "Cenas interativas em WebGL que transformam o site em algo que as pessoas querem tocar.",
    tags: ["Three.js", "WebGL", "Motion"],
  },
  {
    title: "SEO & performance",
    text: "Sites que carregam em segundos e aparecem no Google, técnica que vira resultado.",
    tags: ["Core Web Vitals", "SEO", "Hospedagem"],
  },
];

export default function Services() {
  return (
    <section id="servicos" className="mx-auto max-w-7xl px-5 py-28 md:px-10 md:py-36">
      <Reveal className="grid gap-8 lg:grid-cols-[1.2fr_1fr] lg:items-end">
        <h2 className="font-display text-[clamp(2.6rem,7vw,6.5rem)] font-bold leading-[0.95] tracking-[-0.04em]">
          Do design
          <br />
          ao deploy.
        </h2>
        <p className="max-w-md text-lg leading-relaxed text-ink md:text-xl">
          Um só time cuida de tudo: estratégia, interface, código e publicação. Você acompanha cada etapa.
        </p>
      </Reveal>

      <ul className="mt-16 grid gap-3 md:mt-24">
        {SERVICES.map((s, i) => (
          <li key={s.title}>
            <Reveal
              delay={(i % 3) * 70}
              className="group grid gap-4 rounded-3xl bg-bg-soft p-7 transition-colors duration-300 hover:bg-ink hover:text-paper md:grid-cols-[1.1fr_1fr] md:items-center md:p-10"
            >
              <h3 className="font-display text-[clamp(1.9rem,3.4vw,3rem)] font-bold leading-none tracking-[-0.03em]">
                {s.title}
              </h3>
              <div>
                <p className="text-lg leading-relaxed text-ink transition-colors duration-300 group-hover:text-paper">
                  {s.text}
                </p>
                <p className="mt-3 hidden text-[0.95rem] text-ink-soft transition-colors duration-300 group-hover:text-paper/70 md:block">
                  {s.tags.join(" · ")}
                </p>
              </div>
            </Reveal>
          </li>
        ))}
      </ul>
    </section>
  );
}
