import CommandBar from "./CommandBar";
import { ArrowUpRight, WhatsAppIcon } from "./icons";
import { site, whatsappLink } from "@/lib/site";
import { projects } from "@/lib/projects";

const MARQUEE = [
  "Web design",
  "Desenvolvimento",
  "Experiências 3D",
  "Landing pages",
  "E-commerce",
  "Identidade visual",
  "SEO e performance",
];

export default function Hero() {
  return (
    <section id="topo" className="relative isolate overflow-hidden bg-[#07080a] text-white">
      <div className="aurora" aria-hidden>
        <div className="aurora-blade aurora-b4" />
        <div className="aurora-blade aurora-b1" />
        <div className="aurora-blade aurora-b2" />
        <div className="aurora-blade aurora-b3" />
        <div className="aurora-blade aurora-b5" />
      </div>
      <div className="aurora-grain" aria-hidden />
      <div className="aurora-vignette" aria-hidden />

      <div className="mx-auto flex max-w-7xl flex-col items-center px-5 pt-36 pb-16 text-center md:px-10 md:pt-44 md:pb-20">
        <h1 className="max-w-[860px] text-[clamp(2.6rem,6.4vw,4.75rem)] font-semibold leading-[1.05] tracking-[-0.04em] text-balance">
          Código que vira <span className="text-aurora">experiência.</span>
        </h1>
        <p className="mt-6 max-w-[640px] text-[1.0625rem] leading-relaxed tracking-[0.2px] text-white/72 md:text-lg">
          Criamos sites rápidos, bonitos e interativos, do design ao código, para marcas que querem ser
          lembradas.
        </p>

        <div className="mt-9 flex w-full flex-col gap-3.5 sm:w-auto sm:flex-row">
          <a
            href={whatsappLink()}
            target="_blank"
            rel="noopener noreferrer"
            className="keycap inline-flex items-center justify-center gap-2.5 rounded-lg px-5 py-3.5 text-[0.95rem] font-medium sm:py-3"
          >
            <WhatsAppIcon className="h-4 w-4" />
            Falar no WhatsApp
          </a>
          <a
            href="#trabalhos"
            className="keycap inline-flex items-center justify-center gap-2.5 rounded-lg px-5 py-3.5 text-[0.95rem] font-medium sm:py-3"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-4 w-4"
              aria-hidden
            >
              <path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2Z" />
            </svg>
            Ver trabalhos
          </a>
        </div>
        <p className="mt-5 font-mono text-xs text-[#9c9c9d]">
          <span className="text-white/72">$ whatsapp {site.phoneDisplay}</span>
          <span className="hidden sm:inline"> · orçamento sem compromisso</span>
        </p>

        <div className="mt-14 w-full flex justify-center md:mt-16">
          <CommandBar />
        </div>

        <a
          href="#servicos"
          className="mt-10 inline-flex items-center gap-2 rounded-full border border-white/16 px-[18px] py-2.5 text-sm font-medium text-white/72 transition-colors hover:border-white/32 hover:text-white"
        >
          Ver serviços <span aria-hidden>↓</span>
        </a>
      </div>

      <a
        href="#trabalhos"
        className="absolute right-7 bottom-24 hidden items-center gap-3 rounded-xl border border-white/10 bg-[rgba(16,17,20,0.78)] py-2.5 pr-4 pl-2.5 text-left shadow-[inset_0_1px_0_rgba(255,255,255,0.05),0_12px_30px_rgba(0,0,0,0.45)] backdrop-blur-md transition-colors hover:border-white/20 xl:flex"
      >
        {/* eslint-disable-next-line @next/next/no-img-element -- small static thumbnail */}
        <img
          src={projects[projects.length - 1].shots.mobile}
          alt=""
          width={34}
          height={34}
          className="h-[34px] w-[34px] rounded-[9px] object-cover object-top"
        />
        <span>
          <span className="block text-[11px] text-[#9c9c9d]">{projects.length} projetos no ar</span>
          <span className="flex items-center gap-1 text-[13.5px] font-semibold text-white">
            {projects.map((p) => p.name).join(" · ")}
            <ArrowUpRight className="h-3.5 w-3.5" />
          </span>
        </span>
      </a>

      <div className="relative border-t border-white/10 bg-[#07080a] py-5 text-white" aria-hidden>
        <div className="marquee flex w-max gap-10 whitespace-nowrap text-2xl font-semibold tracking-[-0.02em] md:text-3xl">
          {[...MARQUEE, ...MARQUEE].map((m, i) => (
            <span key={i} className="flex items-center gap-10">
              {m}
              <span className="text-[#4f86ff]">/</span>
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
