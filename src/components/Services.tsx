import type { CSSProperties } from "react";

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
      <div className="grid gap-8 lg:grid-cols-[1.2fr_1fr] lg:items-end">
        <h2
          data-split
          className="font-display text-[clamp(2.6rem,7vw,6.5rem)] font-semibold leading-[0.95] tracking-[-0.04em]"
        >
          Do design
          <br />
          ao deploy.
        </h2>
        <p data-fade className="max-w-md text-lg leading-relaxed text-ink md:text-xl">
          Um só time cuida de tudo: estratégia, interface, código e publicação. Você acompanha cada etapa.
        </p>
      </div>

      {/* Cards stick and stack: each one parks under the header while the next slides over it. */}
      <ul className="svc-stack mt-16 md:mt-24">
        {SERVICES.map((s, i) => (
          <li
            key={s.title}
            className="svc-item sticky mb-[6vh] last:mb-0"
            style={{ top: `calc(6.5rem + ${i * 12}px)` } as CSSProperties}
          >
            <div className="svc-card group grid origin-top gap-4 rounded-3xl border border-line bg-bg-soft p-7 shadow-[0_-20px_60px_-30px_rgba(0,0,0,0.9)] transition-colors duration-300 hover:border-white/20 md:min-h-[260px] md:grid-cols-[1.1fr_1fr] md:items-center md:p-12">
              <h3 className="font-display text-[clamp(1.9rem,3.6vw,3.25rem)] font-semibold leading-none tracking-[-0.03em]">
                {s.title}
              </h3>
              <div>
                <p className="text-lg leading-relaxed text-ink">{s.text}</p>
                <p className="mt-3 hidden text-[0.95rem] text-ink-soft md:block">{s.tags.join(" · ")}</p>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
