import HeroCanvas from "./three/HeroCanvas";
import { ArrowUpRight, WhatsAppIcon, socialIcons } from "./icons";
import { socials, whatsappLink } from "@/lib/site";

const MARQUEE = [
  "Web Design",
  "Desenvolvimento",
  "Experiências 3D",
  "Landing Pages",
  "E-commerce",
  "Identidade Visual",
  "SEO & Performance",
];

export default function Hero() {
  return (
    <section id="topo" className="relative overflow-hidden grid-bg">
      <div className="mx-auto grid min-h-[100svh] max-w-7xl grid-cols-1 items-center gap-6 px-5 pt-24 pb-10 md:px-10 lg:grid-cols-[1.02fr_1fr] lg:gap-4 lg:pt-20">
        <div className="relative z-10 flex flex-col">

          <h1 className="font-display text-[12.4vw] font-bold uppercase leading-[0.88] tracking-[-0.04em] sm:text-[10vw] lg:text-[5.4rem] xl:text-[6.2rem]">
            Código
            <br />
            que vira
            <br />
            <span className="text-brand">experiência.</span>
          </h1>

          <p className="mt-7 max-w-md text-base leading-relaxed text-ink-soft md:text-lg">
            Criamos sites rápidos, bonitos e interativos — do design ao código — para marcas que querem ser
            lembradas.
          </p>

          <div className="mt-9 flex flex-wrap items-center gap-3">
            <a
              href={whatsappLink()}
              target="_blank"
              rel="noopener noreferrer"
              className="group inline-flex items-center gap-3 rounded-full bg-ink px-7 py-4 font-mono text-[0.76rem] font-medium uppercase tracking-[0.14em] text-paper transition-colors duration-300 hover:bg-brand"
            >
              <WhatsAppIcon className="h-4 w-4" />
              Vamos criar
              <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </a>
            <a
              href="#trabalhos"
              className="inline-flex items-center gap-2 rounded-full border border-line px-7 py-4 font-mono text-[0.76rem] font-medium uppercase tracking-[0.14em] transition-colors hover:border-ink"
            >
              Ver trabalhos
            </a>
          </div>

          <ul className="mt-9 flex items-center gap-2" aria-label="Redes sociais">
            {socials
              .filter((s) => s.id !== "linkedin")
              .map((s) => {
                const Icon = socialIcons[s.id];
                return (
                  <li key={s.id}>
                    <a
                      href={s.href}
                      target={s.id === "email" ? undefined : "_blank"}
                      rel="noopener noreferrer"
                      aria-label={s.label}
                      title={s.label}
                      className="flex h-11 w-11 items-center justify-center rounded-full border border-line bg-paper/60 text-ink transition-all duration-300 hover:-translate-y-0.5 hover:border-brand hover:bg-brand hover:text-paper"
                    >
                      <Icon className="h-[18px] w-[18px]" />
                    </a>
                  </li>
                );
              })}
          </ul>
        </div>

        <div className="relative h-[420px] sm:h-[520px] lg:h-[680px]">
          <HeroCanvas />
          <p className="pointer-events-none absolute inset-x-0 bottom-2 text-center font-mono text-[0.62rem] uppercase tracking-[0.2em] text-ink-faint">
<span className="hidden sm:inline">mova o cursor · </span>toque nos símbolos · aperte{" "}
            <span className="text-brand">RUN</span>
          </p>
        </div>
      </div>

      <div className="relative border-y border-line bg-ink py-4 text-paper" aria-hidden>
        <div className="marquee flex w-max gap-10 whitespace-nowrap font-mono text-[0.78rem] uppercase tracking-[0.2em]">
          {[...MARQUEE, ...MARQUEE].map((m, i) => (
            <span key={i} className="flex items-center gap-10">
              {m}
              <span className="text-brand">{"</>"}</span>
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
