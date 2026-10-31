import HeroCanvas from "./three/HeroCanvas";
import { ArrowUpRight, WhatsAppIcon, socialIcons } from "./icons";
import { socials, whatsappLink } from "@/lib/site";

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
    <section id="topo" className="relative overflow-hidden bg-bg">
      <div className="mx-auto max-w-7xl px-5 pt-28 pb-12 md:px-10 md:pt-36 md:pb-16">
        <h1 className="font-display text-[clamp(2.4rem,9.6vw,8.5rem)] font-bold leading-[0.92] tracking-[-0.04em]">
          Código que vira
          <br />
          experiência.
        </h1>

        <div className="mt-10 grid grid-cols-1 items-end gap-10 lg:mt-6 lg:grid-cols-[0.85fr_1.15fr]">
          <div className="relative z-10 flex flex-col">
            <p className="max-w-md text-lg leading-relaxed text-ink md:text-xl">
              Criamos sites rápidos, bonitos e interativos, do design ao código, para marcas que querem ser
              lembradas.
            </p>

            <div className="mt-9 flex flex-wrap items-center gap-3">
              <a
                href={whatsappLink()}
                target="_blank"
                rel="noopener noreferrer"
                className="group inline-flex items-center gap-3 rounded-full bg-ink px-7 py-4 text-base font-semibold text-paper transition-[background-color,transform] duration-200 hover:bg-brand active:scale-[0.97]"
              >
                <WhatsAppIcon className="h-5 w-5" />
                Vamos criar
                <ArrowUpRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </a>
              <a
                href="#trabalhos"
                className="inline-flex items-center rounded-full bg-bg-soft px-7 py-4 text-base font-semibold transition-[background-color,transform] duration-200 hover:bg-[#dededa] active:scale-[0.97]"
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
                        className="flex h-11 w-11 items-center justify-center rounded-full bg-bg-soft text-ink transition-[background-color,color,transform] duration-200 hover:-translate-y-0.5 hover:bg-brand hover:text-paper"
                      >
                        <Icon className="h-[18px] w-[18px]" />
                      </a>
                    </li>
                  );
                })}
            </ul>
          </div>

          <div className="relative h-[380px] sm:h-[460px] lg:h-[540px]">
            <HeroCanvas />
            <p className="pointer-events-none absolute inset-x-0 bottom-0 text-center text-sm text-ink-soft">
              Toque nos símbolos e aperte Run.
            </p>
          </div>
        </div>
      </div>

      <div className="relative bg-ink py-5 text-paper" aria-hidden>
        <div className="marquee flex w-max gap-10 whitespace-nowrap font-display text-2xl font-bold tracking-[-0.02em] md:text-3xl">
          {[...MARQUEE, ...MARQUEE].map((m, i) => (
            <span key={i} className="flex items-center gap-10">
              {m}
              <span className="text-brand">/</span>
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
