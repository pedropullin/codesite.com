"use client";

import { useRef } from "react";
import Reveal from "./Reveal";

const SERVICES = [
  {
    code: "01",
    title: "Sites institucionais",
    text: "Presença digital com cara de marca grande: rápida, responsiva e fácil de atualizar.",
    tags: ["Next.js", "CMS", "Responsivo"],
  },
  {
    code: "02",
    title: "Landing pages",
    text: "Páginas de alta conversão para campanhas, lançamentos e captação de clientes.",
    tags: ["Conversão", "A/B", "Analytics"],
  },
  {
    code: "03",
    title: "E-commerce",
    text: "Lojas virtuais completas, do catálogo ao checkout, integradas a pagamento e frete.",
    tags: ["Checkout", "Pix", "Estoque"],
  },
  {
    code: "04",
    title: "Sistemas & apps web",
    text: "Painéis, agendamentos e ferramentas sob medida para automatizar o seu negócio.",
    tags: ["Dashboards", "APIs", "Login"],
  },
  {
    code: "05",
    title: "Experiências 3D",
    text: "Cenas interativas em WebGL que transformam o site em algo que as pessoas querem tocar.",
    tags: ["Three.js", "WebGL", "Motion"],
  },
  {
    code: "06",
    title: "SEO & performance",
    text: "Sites que carregam em segundos e aparecem no Google — técnica que vira resultado.",
    tags: ["Core Web Vitals", "SEO", "Hospedagem"],
  },
];

function TiltCard({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);

  const onMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const el = ref.current;
    if (!el || e.pointerType !== "mouse") return;
    const r = el.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width - 0.5;
    const y = (e.clientY - r.top) / r.height - 0.5;
    el.style.transform = `perspective(900px) rotateX(${(-y * 8).toFixed(2)}deg) rotateY(${(x * 10).toFixed(2)}deg) translateZ(0)`;
    el.style.setProperty("--gx", `${(x + 0.5) * 100}%`);
    el.style.setProperty("--gy", `${(y + 0.5) * 100}%`);
  };

  const onLeave = () => {
    if (ref.current) ref.current.style.transform = "";
  };

  return (
    <div
      ref={ref}
      onPointerMove={onMove}
      onPointerLeave={onLeave}
      className="group relative h-full overflow-hidden rounded-3xl border border-line bg-paper p-7 transition-[transform,box-shadow,border-color] duration-300 ease-out will-change-transform hover:border-ink/25 hover:shadow-[0_30px_60px_-30px_rgba(11,11,12,0.35)] md:p-8"
      style={{ transformStyle: "preserve-3d" }}
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        style={{
          background: "radial-gradient(420px circle at var(--gx, 50%) var(--gy, 50%), rgba(43,70,255,0.10), transparent 60%)",
        }}
      />
      {children}
    </div>
  );
}

export default function Services() {
  return (
    <section id="servicos" className="mx-auto max-w-7xl px-5 py-24 md:px-10 md:py-32">
      <Reveal className="mb-14 flex flex-col justify-between gap-6 md:flex-row md:items-end">
        <div>
          <span className="mb-6 inline-flex items-center gap-2.5 font-mono text-[0.7rem] font-medium uppercase tracking-[0.24em] text-ink-soft">
            <span className="h-px w-6 bg-brand" />
            Serviços
          </span>
          <h2 className="font-display text-5xl font-bold uppercase leading-[0.92] tracking-[-0.03em] md:text-7xl">
            Do design
            <br />
            ao deploy.
          </h2>
        </div>
        <p className="max-w-sm leading-relaxed text-ink-soft">
          Um só time cuida de tudo: estratégia, interface, código e publicação. Você acompanha cada etapa.
        </p>
      </Reveal>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {SERVICES.map((s, i) => (
          <Reveal key={s.code} delay={i * 70}>
            <TiltCard>
              <div className="relative flex h-full flex-col" style={{ transform: "translateZ(30px)" }}>
                <div className="mb-10 flex items-center justify-between">
                  <span className="font-mono text-xs text-ink-faint">/{s.code}</span>
                  <span className="font-mono text-lg text-brand transition-transform duration-300 group-hover:rotate-12">
                    {"{ }"}
                  </span>
                </div>
                <h3 className="font-display text-2xl font-bold tracking-tight md:text-[1.7rem]">{s.title}</h3>
                <p className="mt-3 flex-1 leading-relaxed text-ink-soft">{s.text}</p>
                <ul className="mt-7 flex flex-wrap gap-1.5">
                  {s.tags.map((t) => (
                    <li
                      key={t}
                      className="rounded-full border border-line px-3 py-1 font-mono text-[0.65rem] uppercase tracking-[0.1em] text-ink-soft"
                    >
                      {t}
                    </li>
                  ))}
                </ul>
              </div>
            </TiltCard>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
