/* eslint-disable @next/next/no-img-element -- static screenshots served from public/work */
import Reveal from "./Reveal";
import { ArrowUpRight } from "./icons";
import { projects } from "@/lib/projects";

function hostname(url: string) {
  return new URL(url).hostname.replace(/^www\./, "");
}

export default function Work() {
  return (
    <section id="trabalhos" className="bg-bg">
      <div className="mx-auto max-w-7xl px-5 py-28 md:px-10 md:py-36">
        <Reveal className="grid gap-8 lg:grid-cols-[1.2fr_1fr] lg:items-end">
          <h2 className="font-display text-[clamp(2.6rem,7vw,6.5rem)] font-bold leading-[0.95] tracking-[-0.04em]">
            Projetos
            <br />
            no ar.
          </h2>
          <p className="max-w-md text-lg leading-relaxed text-ink md:text-xl">
            Cada projeto é feito do zero, com identidade própria. Clique e veja funcionando.
          </p>
        </Reveal>

        <div className="mt-16 flex flex-col gap-24 md:mt-24 md:gap-36">
          {projects.map((p, i) => {
            const flip = i % 2 === 1;
            return (
              <Reveal key={p.name}>
                <article className="grid items-center gap-8 lg:grid-cols-12 lg:gap-10">
                  <a
                    href={p.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`Abrir ${p.name}`}
                    className={`group relative block overflow-hidden rounded-2xl bg-ink lg:col-span-8 ${flip ? "lg:order-2" : ""}`}
                  >
                    <img
                      src={p.shots.desktop}
                      alt={`Página inicial do ${p.name} no computador`}
                      width={1440}
                      height={900}
                      loading="lazy"
                      className="block aspect-[16/10] w-full object-cover object-top transition-transform duration-700 ease-out group-hover:scale-[1.02]"
                    />
                  </a>

                  <div className={`flex flex-col lg:col-span-4 ${flip ? "lg:order-1" : ""}`}>
                    <h3 className="font-display text-[clamp(2rem,3.4vw,3rem)] font-bold leading-none tracking-[-0.03em]">
                      {p.name}
                    </h3>
                    <div className="mt-7 flex items-start gap-5">
                      {p.clip ? (
                        <video
                          src={p.clip}
                          poster={p.shots.mobile}
                          autoPlay
                          muted
                          loop
                          playsInline
                          preload="metadata"
                          aria-label={`Reel do ${p.name}`}
                          className="aspect-[9/16] w-24 shrink-0 rounded-xl bg-ink object-cover sm:w-28"
                        />
                      ) : (
                        <img
                          src={p.shots.mobile}
                          alt={`${p.name} no celular`}
                          width={390}
                          height={844}
                          loading="lazy"
                          className="w-24 shrink-0 rounded-xl bg-ink sm:w-28"
                        />
                      )}
                      <p className="text-lg leading-relaxed text-ink">{p.description}</p>
                    </div>
                    <p className="mt-3 text-[0.95rem] text-ink-soft">{p.category}</p>
                    <a
                      href={p.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group mt-7 inline-flex w-fit items-center gap-2 text-base font-semibold text-brand"
                    >
                      Ver ao vivo em {hostname(p.url)}
                      <ArrowUpRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                    </a>
                  </div>
                </article>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}
