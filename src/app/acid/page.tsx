/* eslint-disable @next/next/no-img-element -- static screenshots served from public/work */
import type { Metadata } from "next";
import Link from "next/link";
import { Plus_Jakarta_Sans, Syne } from "next/font/google";
import { ArrowUpRight, WhatsAppIcon, socialIcons } from "@/components/icons";
import { projects } from "@/lib/projects";
import { navLinks, site, socials, whatsappLink } from "@/lib/site";
import { ChromeBlob, Rise } from "./Client";
import "./acid.css";

const syne = Syne({ subsets: ["latin"], weight: ["700", "800"], variable: "--font-syne", display: "swap" });
const jakarta = Plus_Jakarta_Sans({ subsets: ["latin"], weight: ["400", "500", "700"], variable: "--font-jakarta", display: "swap" });

export const metadata: Metadata = {
  title: `${site.name} — Acid`,
  description: site.description,
};

const TICKER = ["Web design", "Desenvolvimento", "Experiências 3D", "Landing pages", "E-commerce", "Identidade visual", "SEO"];

const SERVICES = [
  { title: "Sites", text: "Presença digital com cara de marca grande: rápida, responsiva e fácil de atualizar.", shape: "20% 80% 30% 70% / 50% 20% 80% 50%", color: "var(--volt)" },
  { title: "Landing pages", text: "Páginas de alta conversão para campanhas, lançamentos e captação de clientes.", shape: "70% 30% 60% 40% / 30% 60% 40% 70%", color: "var(--pink)" },
  { title: "E-commerce", text: "Lojas completas, do catálogo ao checkout, com Pix, cartão e frete.", shape: "40% 60% 70% 30% / 60% 30% 70% 40%", color: "var(--cyan)" },
  { title: "Sistemas", text: "Painéis, agendamentos e ferramentas sob medida para automatizar o seu negócio.", shape: "60% 40% 30% 70% / 40% 70% 30% 60%", color: "var(--volt)" },
  { title: "3D", text: "Cenas em WebGL que transformam o site em algo que as pessoas querem tocar.", shape: "30% 70% 50% 50% / 70% 40% 60% 30%", color: "var(--pink)" },
  { title: "SEO", text: "Sites que carregam em segundos e aparecem no Google.", shape: "50% 50% 70% 30% / 30% 50% 50% 70%", color: "var(--cyan)" },
];

const STEPS = [
  { cmd: "git init", title: "Descoberta", text: "Entendemos o seu negócio, público e objetivos numa conversa rápida." },
  { cmd: "design --figma", title: "Design", text: "Criamos a interface e a identidade. Você aprova cada tela antes do código." },
  { cmd: "npm run build", title: "Código", text: "Rápido e responsivo. Você acompanha tudo num link ao vivo." },
  { cmd: "deploy --prod", title: "No ar", text: "Domínio, SEO e analytics configurados, e seguimos dando suporte." },
];

function Star({ className = "", color = "var(--volt)" }: { className?: string; color?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden>
      <path d="M12 0c.6 6.5 5.5 11.4 12 12-6.5.6-11.4 5.5-12 12-.6-6.5-5.5-11.4-12-12C6.5 11.4 11.4 6.5 12 0Z" fill={color} />
    </svg>
  );
}

function Ticker({ reverse = false, tone = "volt" }: { reverse?: boolean; tone?: "volt" | "black" }) {
  const items = [...TICKER, ...TICKER];
  return (
    <div
      className={`overflow-hidden py-3 ${tone === "volt" ? "bg-[var(--volt)] text-white" : "border-y border-white/10 bg-black text-white"}`}
      aria-hidden
    >
      <div className={`marquee flex w-max gap-8 whitespace-nowrap ${reverse ? "reverse" : ""}`}>
        {items.map((t, i) => (
          <span key={i} className="display flex items-center gap-8 text-xl italic md:text-2xl">
            {t}
            <Star className="h-4 w-4" color={tone === "volt" ? "#fff" : "var(--pink)"} />
          </span>
        ))}
      </div>
    </div>
  );
}

export default function AcidPage() {
  return (
    <div className={`acid ${syne.variable} ${jakarta.variable} min-h-screen`}>
      {/* SVG filter for the melted photos. */}
      <svg width="0" height="0" className="absolute" aria-hidden>
        <filter id="wavy">
          <feTurbulence type="fractalNoise" baseFrequency="0.012 0.03" numOctaves="2" seed="4" result="t">
            <animate attributeName="baseFrequency" dur="14s" values="0.012 0.03;0.02 0.05;0.012 0.03" repeatCount="indefinite" />
          </feTurbulence>
          <feDisplacementMap in="SourceGraphic" in2="t" scale="26" />
        </filter>
      </svg>
      <div className="grain" aria-hidden />

      <Ticker />

      {/* ---------- nav ---------- */}
      <header className="relative z-30 flex items-center justify-between gap-4 px-5 py-5 md:px-10">
        <a href="#topo" className="display split text-xl md:text-3xl" aria-label={`${site.name}, início`}>
          CODE<span className="text-[var(--pink)]">/</span>SITE
        </a>
        <nav aria-label="Principal" className="hidden md:block">
          <ul className="flex gap-7 text-sm font-bold tracking-wide uppercase">
            {navLinks.filter((l) => l.href !== "#duvidas").map((l) => (
              <li key={l.href}>
                <a href={l.href} className="split-hover inline-block transition-colors hover:text-[var(--pink)]">
                  {l.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>
        <a href={whatsappLink()} target="_blank" rel="noopener noreferrer" className="chrome-btn !px-4 !py-2.5 text-xs md:!px-6 md:!py-3 md:text-sm">
          <span>Orçamento</span>
        </a>
      </header>

      <main id="topo">
        {/* ---------- hero ---------- */}
        <section className="relative isolate min-h-[92svh] overflow-hidden px-5 pt-6 pb-20 md:px-10">
          <div className="drift top-[8%] left-[55%] h-[340px] w-[340px]" aria-hidden />
          <div className="drift bottom-[10%] left-[-6%] h-[220px] w-[220px] [animation-delay:-7s]" aria-hidden />
          <p className="display outline-white pointer-events-none absolute -right-6 bottom-6 -z-10 text-[34vw] leading-none select-none" aria-hidden>
            CODE
          </p>

          <div className="absolute top-0 right-[-8%] h-[78vh] w-[78vw] opacity-55 md:right-[-4%] md:w-[52vw] md:opacity-100">
            <ChromeBlob />
          </div>

          <p
            className="absolute top-1/2 left-3 hidden origin-left -translate-y-1/2 -rotate-90 text-xs font-bold tracking-[0.4em] text-[var(--pink)] uppercase md:block"
            aria-hidden
          >
            Estúdio digital ✶ Código ✶ Design ✶ Experiência
          </p>

          <div className="relative z-10 max-w-[1500px] md:pl-10">
            <h1 className="display mt-[14vh] text-[clamp(3rem,10.5vw,10rem)] italic">
              <span className="split block origin-left md:scale-x-110">Código</span>
              <span className="split block pl-[8vw]">
                que <span className="text-[var(--pink)]">vira</span>
              </span>
              <span className="chrome-text block origin-left -rotate-2 text-[0.66em] not-italic md:text-[0.8em]">experiência</span>
            </h1>

            <div className="mt-10 grid max-w-4xl gap-8 md:ml-[24vw] md:grid-cols-[minmax(0,26rem)_auto] md:items-end">
              <p className="max-w-md text-lg leading-relaxed text-white/80">
                Criamos sites rápidos, bonitos e interativos, do design ao código, para marcas que querem ser lembradas.
              </p>
              <div className="flex flex-wrap gap-3">
                <a href={whatsappLink()} target="_blank" rel="noopener noreferrer" className="chrome-btn">
                  <WhatsAppIcon className="h-5 w-5" />
                  <span>Vamos criar</span>
                </a>
                <a href="#trabalhos" className="ghost-btn">
                  Ver trabalhos
                </a>
              </div>
            </div>
          </div>
        </section>

        <Ticker reverse tone="black" />

        {/* ---------- services ---------- */}
        <section id="servicos" className="relative px-5 py-28 md:px-10 md:py-40">
          <h2 className="display rise text-[clamp(3rem,10vw,9rem)]">
            Do design <br />
            <span className="outline-volt italic">ao deploy</span>
          </h2>
          <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-3 md:mt-24">
            {SERVICES.map((s, i) => (
              <article
                key={s.title}
                className={`blob rise ${i % 3 === 1 ? "lg:translate-y-16" : ""} ${i % 3 === 2 ? "lg:-translate-y-6" : ""}`}
                style={{ ["--shape" as string]: s.shape }}
              >
                <div className="flex min-h-[300px] flex-col justify-between p-10 md:p-12">
                  <Star className="h-8 w-8" color={s.color} />
                  <div>
                    <h3 className="display split-hover text-[clamp(1.9rem,2.8vw,2.75rem)] [overflow-wrap:anywhere]" style={{ color: s.color }}>
                      {s.title}
                    </h3>
                    <p className="mt-4 max-w-xs leading-relaxed text-white/75">{s.text}</p>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>

        {/* ---------- work ---------- */}
        <section id="trabalhos" className="relative bg-[var(--onyx)] px-5 py-28 md:px-10 md:py-40">
          <div className="flex flex-wrap items-end justify-between gap-6">
            <h2 className="display rise text-[clamp(3rem,11vw,10rem)] italic">
              <span className="split">Projetos</span>
              <br />
              <span className="chrome-text not-italic">no ar</span>
            </h2>
            <p className="rise max-w-sm text-white/70">Passe o mouse para tirar as fotos de baixo d’água.</p>
          </div>

          <div className="mt-20 flex flex-col gap-28">
            {projects.map((p, i) => (
              <article
                key={p.name}
                className={`rise grid items-center gap-8 lg:grid-cols-12 ${i % 2 ? "lg:[&>*:first-child]:order-2" : ""}`}
              >
                <a
                  href={p.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`Abrir ${p.name}`}
                  className={`warp block overflow-hidden lg:col-span-8 ${i % 2 ? "rotate-1" : "-rotate-1"}`}
                  style={{ borderRadius: i % 2 ? "42% 8% 38% 6% / 10% 30% 8% 28%" : "8% 40% 6% 36% / 28% 8% 30% 10%" }}
                >
                  <img src={p.shots.desktop} alt={`Página inicial do ${p.name}`} width={1440} height={900} loading="lazy" className="aspect-[16/10] w-full object-cover object-top" />
                </a>
                <div className="lg:col-span-4">
                  <h3 className="display split-hover text-[clamp(2rem,3.4vw,3.4rem)] italic [overflow-wrap:anywhere]">{p.name}</h3>
                  <p className="mt-5 leading-relaxed text-white/75">{p.description}</p>
                  <p className="mt-4 text-sm font-bold tracking-wide text-[var(--cyan)] uppercase">{p.category}</p>
                  <a href={p.url} target="_blank" rel="noopener noreferrer" className="ghost-btn mt-7 text-sm">
                    Ver ao vivo <ArrowUpRight className="h-4 w-4" />
                  </a>
                </div>
              </article>
            ))}
          </div>
        </section>

        {/* ---------- process ---------- */}
        <section id="processo" className="relative overflow-hidden px-5 py-28 md:px-10 md:py-40">
          <h2 className="display rise text-[clamp(3rem,10vw,9rem)]">
            Quatro commits
            <br />
            <span className="text-[var(--pink)] italic">até o ar</span>
          </h2>
          <ol className="mt-16 grid gap-px overflow-hidden rounded-[2rem] border border-white/10 bg-white/10 md:grid-cols-4">
            {STEPS.map((s, i) => (
              <li key={s.title} className="rise group relative bg-black p-8 transition-colors duration-500 hover:bg-[var(--volt)] hover:text-white">
                <code className="font-mono text-sm text-[var(--pink)] group-hover:text-white">$ {s.cmd}</code>
                <h3 className="display mt-10 text-[clamp(1.6rem,2.2vw,2.2rem)] italic">{s.title}</h3>
                <p className="mt-4 text-sm leading-relaxed text-white/70 group-hover:text-white/85">{s.text}</p>
                <Star className={`absolute top-6 right-6 h-5 w-5 transition-transform duration-700 group-hover:rotate-180 ${i % 2 ? "" : ""}`} color="var(--pink)" />
              </li>
            ))}
          </ol>
        </section>

        {/* ---------- contact ---------- */}
        <section id="contato" className="relative isolate overflow-hidden bg-[var(--volt)] px-5 py-28 text-white md:px-10 md:py-40">
          <p className="display pointer-events-none absolute -bottom-10 left-0 -z-10 text-[30vw] leading-none text-white/10 select-none" aria-hidden>
            RUN
          </p>
          <h2 className="display rise text-[clamp(3.4rem,12vw,11rem)] italic">
            Vamos tirar
            <br />
            <span className="ml-[10vw] inline-block -rotate-2 bg-white px-4 text-[var(--volt)] not-italic">do papel</span>
          </h2>
          <div className="mt-14 grid gap-10 md:grid-cols-[1fr_1.2fr] md:items-end">
            <div>
              <p className="max-w-md text-lg font-medium leading-relaxed">
                Chama no WhatsApp e conta a ideia. O orçamento é sem compromisso.
              </p>
              <a
                href={whatsappLink()}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-8 inline-flex items-center gap-3 rounded-full bg-white px-8 py-5 font-[family-name:var(--font-syne)] text-lg font-extrabold text-[var(--volt)] uppercase transition-transform duration-500 hover:scale-105 hover:-rotate-2"
              >
                <WhatsAppIcon className="h-5 w-5" /> {site.phoneDisplay}
              </a>
            </div>
            <ul className="flex flex-wrap gap-3">
              {socials
                .filter((s) => s.id !== "whatsapp")
                .map((s) => {
                  const Icon = socialIcons[s.id];
                  return (
                    <li key={s.id}>
                      <a
                        href={s.href}
                        target={s.id === "email" ? undefined : "_blank"}
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 rounded-full border-2 border-white px-5 py-3 font-bold transition-colors duration-300 hover:bg-white hover:text-[var(--volt)]"
                      >
                        <Icon className="h-4 w-4" /> {s.label}
                      </a>
                    </li>
                  );
                })}
            </ul>
          </div>
        </section>
      </main>

      <Ticker reverse />

      <footer className="relative overflow-hidden px-5 pt-20 pb-10 md:px-10">
        <p className="display chrome-text text-[clamp(4rem,19vw,18rem)] italic leading-[0.8]">CODE SITE</p>
        <div className="mt-10 flex flex-col justify-between gap-3 text-sm text-white/60 sm:flex-row">
          <span>© {new Date().getFullYear()} {site.name}. Todos os direitos reservados.</span>
          <Link href="/" className="font-bold text-[var(--pink)] hover:underline">
            Ver a versão principal do site
          </Link>
        </div>
      </footer>

      <Rise />
    </div>
  );
}
