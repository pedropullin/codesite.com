/* eslint-disable @next/next/no-img-element -- static screenshots served from public/work */
import { ArrowUpRight } from "./icons";
import { projects } from "@/lib/projects";

function hostname(url: string) {
  return new URL(url).hostname.replace(/^www\./, "");
}

export default function Work() {
  return (
    <section id="trabalhos" className="work-section relative isolate overflow-hidden bg-bg py-28 md:py-36">
      <div className="pointer-events-none absolute top-1/3 left-1/2 -z-10 h-[520px] w-[900px] -translate-x-1/2 rounded-full bg-brand/25 blur-[140px]" aria-hidden />
      <div className="mx-auto grid max-w-7xl gap-8 px-5 md:px-10 lg:grid-cols-[1.2fr_1fr] lg:items-end">
        <h2
          data-split
          className="font-display text-[clamp(2.6rem,7vw,6.5rem)] font-medium leading-[1.05] tracking-tight"
        >
          Projetos <em className="font-medium">no ar.</em>
        </h2>
        <p data-fade className="max-w-md text-lg leading-relaxed text-ink md:text-xl">
          Cada projeto é feito do zero, com identidade própria. Role para passar por eles e clique para ver
          funcionando.
        </p>
      </div>

      {/* On large screens this row is pinned and scrolls sideways; on phones it stacks. */}
      <div className="work-pin mt-16 md:mt-24 lg:flex lg:h-screen lg:items-center lg:mt-0">
        <div className="work-track flex flex-col gap-24 px-5 md:px-10 lg:w-max lg:flex-row lg:gap-[6vw] lg:px-[max(2.5rem,calc(50vw-37.5rem))]">
          {projects.map((p) => (
            <article
              key={p.name}
              className="work-panel grid rounded-3xl border border-white/10 bg-[#16213a] items-center gap-8 p-4 md:p-6 lg:w-[min(80vw,1220px)] lg:shrink-0 lg:grid-cols-12 lg:gap-10"
            >
              <a
                href={p.url}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`Abrir ${p.name}`}
                className="work-shot group relative block overflow-hidden rounded-2xl border border-line bg-bg-soft lg:col-span-8"
              >
                <img
                  src={p.shots.desktop}
                  alt={`Página inicial do ${p.name} no computador`}
                  width={1440}
                  height={900}
                  loading="lazy"
                  className="block aspect-[16/10] w-full object-cover object-top"
                />
              </a>

              <div className="flex flex-col lg:col-span-4">
                <h3 className="font-display text-[clamp(2rem,3.4vw,3rem)] font-medium leading-[1.1] tracking-tight">
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
                      className="aspect-[9/16] w-24 shrink-0 rounded-xl bg-bg-soft object-cover sm:w-28"
                    />
                  ) : (
                    <img
                      src={p.shots.mobile}
                      alt={`${p.name} no celular`}
                      width={390}
                      height={844}
                      loading="lazy"
                      className="w-24 shrink-0 rounded-xl bg-bg-soft sm:w-28"
                    />
                  )}
                  <p className="text-lg leading-relaxed text-ink">{p.description}</p>
                </div>
                <p className="mt-3 text-[0.95rem] text-ink-soft">{p.category}</p>
                <a
                  href={p.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group mt-7 inline-flex w-fit items-center gap-2 text-base font-semibold text-brand-light"
                >
                  Ver ao vivo em {hostname(p.url)}
                  <ArrowUpRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                </a>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
