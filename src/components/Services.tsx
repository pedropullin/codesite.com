"use client";

import { useEffect, useState } from "react";

type Feature = {
  id: string;
  title: string;
  text: string;
  tags: string[];
  visual: { kind: "code"; file: string; lines: string[] } | { kind: "blueprint"; variant: "site" | "speed" };
};

const FEATURES: Feature[] = [
  {
    id: "sites",
    title: "Sites institucionais",
    text: "Presença digital com cara de marca grande: rápida, responsiva e fácil de atualizar, com as páginas que o seu cliente procura antes de te chamar.",
    tags: ["Next.js", "CMS", "Responsivo"],
    visual: { kind: "blueprint", variant: "site" },
  },
  {
    id: "landing",
    title: "Landing pages",
    text: "Páginas de alta conversão para campanhas, lançamentos e captação de clientes. Uma ideia por tela e um botão que leva direto para a conversa.",
    tags: ["Conversão", "A/B", "Analytics"],
    visual: {
      kind: "code",
      file: "app/page.tsx",
      lines: [
        "export default function Landing() {",
        "  return (",
        "    <Hero",
        '      title="Seu sorriso, sem pressa."',
        '      cta={whatsapp("Quero agendar")}',
        "    />",
        "  );",
        "}",
      ],
    },
  },
  {
    id: "ecommerce",
    title: "E-commerce",
    text: "Lojas virtuais completas, do catálogo ao checkout, integradas a pagamento, frete e estoque. Pix na hora e cartão parcelado.",
    tags: ["Checkout", "Pix", "Estoque"],
    visual: {
      kind: "code",
      file: "lib/checkout.ts",
      lines: [
        "const pedido = await criar(carrinho);",
        "",
        "const pix = await pagamentos.pix({",
        "  valor: pedido.total,",
        "  expiraEm: '30m',",
        "});",
        "",
        "await estoque.reservar(pedido.itens);",
      ],
    },
  },
  {
    id: "sistemas",
    title: "Sistemas & apps web",
    text: "Painéis, agendamentos e ferramentas sob medida para automatizar o seu negócio, com login, permissões e dados na nuvem.",
    tags: ["Dashboards", "APIs", "Login"],
    visual: {
      kind: "code",
      file: "app/api/agenda/route.ts",
      lines: [
        "export async function POST(req) {",
        "  const reserva = await req.json();",
        "  await db.agenda.insert(reserva);",
        "  await avisar.whatsapp(reserva);",
        "  return Response.json({ ok: true });",
        "}",
      ],
    },
  },
  {
    id: "3d",
    title: "Experiências 3D",
    text: "Cenas interativas em WebGL que transformam o site em algo que as pessoas querem tocar: produtos que giram, montam e respondem ao mouse.",
    tags: ["Three.js", "WebGL", "Motion"],
    visual: {
      kind: "code",
      file: "components/Produto3D.tsx",
      lines: [
        "<Canvas camera={{ fov: 36 }}>",
        "  <Environment preset=\"studio\" />",
        "  <Float speed={1.4}>",
        "    <Hamburguer explodir={scroll} />",
        "  </Float>",
        "</Canvas>",
      ],
    },
  },
  {
    id: "seo",
    title: "SEO & performance",
    text: "Sites que carregam em segundos e aparecem no Google: imagens otimizadas, metadados certos e hospedagem rápida em todo o Brasil.",
    tags: ["Core Web Vitals", "SEO", "Hospedagem"],
    visual: { kind: "blueprint", variant: "speed" },
  },
];

function Code({ file, lines }: { file: string; lines: string[] }) {
  return (
    <div className="overflow-hidden rounded-2xl bg-[#0f172a] text-left shadow-[0_30px_60px_-30px_rgba(15,23,42,0.6)]">
      <div className="flex items-center gap-2 border-b border-white/10 px-4 py-3">
        <span className="h-2.5 w-2.5 rounded-full bg-white/20" />
        <span className="h-2.5 w-2.5 rounded-full bg-white/20" />
        <span className="h-2.5 w-2.5 rounded-full bg-white/20" />
        <span className="ml-2 font-mono text-xs text-slate-400">{file}</span>
      </div>
      <pre className="overflow-x-auto p-5 font-mono text-[13px] leading-6 text-slate-300">
        {lines.map((l, i) => (
          <div key={i} className="flex gap-4">
            <span className="w-4 shrink-0 text-right text-slate-600 select-none">{i + 1}</span>
            <code>{l || " "}</code>
          </div>
        ))}
      </pre>
    </div>
  );
}

function Blueprint({ variant }: { variant: "site" | "speed" }) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-5">
      <svg viewBox="0 0 400 260" className="h-auto w-full" aria-hidden>
        <defs>
          <pattern id={`bp-${variant}`} width="20" height="20" patternUnits="userSpaceOnUse">
            <path d="M20 0H0V20" fill="none" stroke="#e2e8f0" strokeWidth="1" />
          </pattern>
        </defs>
        <rect width="400" height="260" fill={`url(#bp-${variant})`} />
        {variant === "site" ? (
          <g fill="none" stroke="#94a3b8" strokeWidth="1.5">
            <rect x="30" y="24" width="340" height="212" rx="10" fill="#fff" />
            <path d="M30 52h340" />
            <circle cx="46" cy="38" r="4" /><circle cx="60" cy="38" r="4" /><circle cx="74" cy="38" r="4" />
            <rect x="52" y="72" width="150" height="16" rx="4" fill="#0f172a" stroke="none" />
            <rect x="52" y="96" width="110" height="16" rx="4" fill="#0f172a" stroke="none" />
            <rect x="52" y="124" width="140" height="6" rx="3" fill="#cbd5e1" stroke="none" />
            <rect x="52" y="136" width="120" height="6" rx="3" fill="#cbd5e1" stroke="none" />
            <rect x="52" y="160" width="86" height="26" rx="13" fill="#2b46ff" stroke="none" />
            <rect x="230" y="72" width="118" height="140" rx="10" strokeDasharray="5 5" />
            <path d="M230 212l50-58 30 34 18-20 20 44" />
            <path d="M210 160h12M216 154v12" stroke="#2b46ff" />
          </g>
        ) : (
          <g>
            <path d="M40 210H360" stroke="#94a3b8" strokeWidth="1.5" />
            {[0.9, 0.62, 0.48, 0.3].map((h, i) => (
              <g key={i}>
                <rect x={70 + i * 75} y={210 - 160 * h} width="40" height={160 * h} rx="6" fill={i === 3 ? "#2b46ff" : "#cbd5e1"} />
              </g>
            ))}
            <path d="M90 60 C 160 70, 240 120, 340 170" fill="none" stroke="#2b46ff" strokeWidth="2" strokeDasharray="6 6" />
            <text x="40" y="240" fontSize="12" fill="#64748b" fontFamily="ui-monospace, monospace">peso da página, antes → depois</text>
          </g>
        )}
      </svg>
    </div>
  );
}

export default function Services() {
  const [active, setActive] = useState(FEATURES[0].id);

  // Scroll-spy: the feature nearest the upper third of the screen is the active one.
  useEffect(() => {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) setActive(e.target.id.replace("feature-", ""));
        });
      },
      { rootMargin: "-35% 0px -55% 0px" }
    );
    FEATURES.forEach((f) => {
      const el = document.getElementById(`feature-${f.id}`);
      if (el) io.observe(el);
    });
    return () => io.disconnect();
  }, []);

  return (
    <section id="servicos" className="theme-light overflow-x-clip">
      <div className="mx-auto max-w-7xl px-5 py-28 md:px-10 md:py-36">
        <div className="grid gap-8 lg:grid-cols-[1.2fr_1fr] lg:items-end">
          <h2
            data-split
            className="font-display text-[clamp(2.6rem,6.5vw,5.5rem)] font-medium leading-[1.05] tracking-tight"
          >
            Do design <em className="font-medium">ao deploy.</em>
          </h2>
          <p data-fade className="max-w-md text-lg leading-relaxed text-ink-soft md:text-xl">
            Um só time cuida de tudo: estratégia, interface, código e publicação. Você acompanha cada etapa.
          </p>
        </div>

        <div className="mt-16 grid gap-12 md:mt-24 lg:grid-cols-[1fr_3fr] lg:gap-16">
          <nav aria-label="Serviços" className="hidden lg:block">
            <ul className="sticky top-32 space-y-1">
              {FEATURES.map((f) => {
                const on = active === f.id;
                return (
                  <li key={f.id}>
                    <a
                      href={`#feature-${f.id}`}
                      className={`flex items-center gap-3 py-2 text-base transition-[color,opacity] duration-500 ease-in-out ${
                        on ? "font-semibold text-slate-900" : "font-medium text-slate-400 hover:text-slate-600"
                      }`}
                    >
                      <span
                        className={`h-1.5 w-1.5 rounded-full bg-black transition-[opacity,transform] duration-500 ease-in-out ${
                          on ? "scale-100 opacity-100" : "scale-0 opacity-0"
                        }`}
                      />
                      {f.title}
                    </a>
                  </li>
                );
              })}
            </ul>
          </nav>

          <div className="flex flex-col gap-24 md:gap-32">
            {FEATURES.map((f, i) => (
              <article
                key={f.id}
                id={`feature-${f.id}`}
                className="feature-row grid scroll-mt-32 items-center gap-8 md:grid-cols-2 md:gap-12"
              >
                <div className={i % 2 ? "md:order-2" : ""}>
                  <h3 className="font-display text-[clamp(2rem,3.4vw,3rem)] font-medium leading-[1.1] tracking-tight">
                    {f.title}
                  </h3>
                  <p className="mt-4 text-lg leading-relaxed text-ink-soft">{f.text}</p>
                  <ul className="mt-6 flex flex-wrap gap-2">
                    {f.tags.map((t) => (
                      <li key={t} className="rounded-full bg-white px-3 py-1 text-sm font-medium text-slate-600 shadow-[0_0_0_1px_rgba(15,23,42,0.08)]">
                        {t}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className={`feature-visual ${i % 2 ? "md:order-1" : ""}`}>
                  {f.visual.kind === "code" ? (
                    <Code file={f.visual.file} lines={f.visual.lines} />
                  ) : (
                    <Blueprint variant={f.visual.variant} />
                  )}
                </div>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
