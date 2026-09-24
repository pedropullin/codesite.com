import Reveal from "./Reveal";
import { ArrowUpRight } from "./icons";
import { projects, type ProjectTheme } from "@/lib/projects";

// Same themed gradients the original codesite.online used for project cards.
const THEME: Record<ProjectTheme, string> = {
  ember:
    "radial-gradient(circle at 30% 20%, rgba(255,120,60,.35), transparent 55%), radial-gradient(circle at 75% 75%, rgba(255,60,30,.22), transparent 55%), #1a1210",
  forest:
    "radial-gradient(circle at 25% 25%, rgba(90,200,140,.28), transparent 55%), radial-gradient(circle at 78% 70%, rgba(40,150,100,.24), transparent 55%), #0d1712",
  graphite:
    "radial-gradient(circle at 30% 25%, rgba(180,180,190,.22), transparent 55%), radial-gradient(circle at 75% 75%, rgba(90,90,100,.24), transparent 55%), #16171a",
};

function hostname(url: string) {
  return new URL(url).hostname.replace(/^www\./, "");
}

export default function Work() {
  return (
    <section id="trabalhos" className="border-t border-line bg-bg-soft py-24 md:py-32">
      <div className="mx-auto max-w-7xl px-5 md:px-10">
        <Reveal className="mb-14 flex flex-col justify-between gap-6 md:flex-row md:items-end">
          <div>
            <span className="mb-6 inline-flex items-center gap-2.5 font-mono text-[0.7rem] font-medium uppercase tracking-[0.24em] text-ink-soft">
              <span className="h-px w-6 bg-brand" />
              Trabalhos
            </span>
            <h2 className="font-display text-5xl font-bold uppercase leading-[0.92] tracking-[-0.03em] md:text-7xl">
              Projetos
              <br />
              no ar.
            </h2>
          </div>
          <p className="max-w-sm leading-relaxed text-ink-soft">
            Cada projeto é feito do zero, com identidade própria. Clique e veja funcionando.
          </p>
        </Reveal>

        <div className="flex flex-col gap-5">
          {projects.map((p, i) => (
            <Reveal key={p.name} delay={i * 80}>
              <a
                href={p.url}
                target="_blank"
                rel="noopener noreferrer"
                className="group grid overflow-hidden rounded-3xl border border-line bg-paper transition-shadow duration-500 hover:shadow-[0_40px_80px_-40px_rgba(11,11,12,0.45)] md:grid-cols-[1.15fr_1fr]"
              >
                <div
                  className="relative flex min-h-[260px] items-center justify-center overflow-hidden p-8 md:min-h-[340px]"
                  style={{ background: THEME[p.theme] }}
                >
                  {/* Browser mockup */}
                  <div className="w-full max-w-md rounded-xl border border-white/10 bg-white/5 shadow-2xl backdrop-blur-sm transition-transform duration-700 ease-out group-hover:-translate-y-2 group-hover:scale-[1.03]">
                    <div className="flex items-center gap-1.5 border-b border-white/10 px-3 py-2.5">
                      <span className="h-2 w-2 rounded-full bg-white/25" />
                      <span className="h-2 w-2 rounded-full bg-white/25" />
                      <span className="h-2 w-2 rounded-full bg-white/25" />
                      <span className="ml-2 truncate rounded bg-white/10 px-2 py-0.5 font-mono text-[0.6rem] text-white/60">
                        {hostname(p.url)}
                      </span>
                    </div>
                    <div className="space-y-3 p-6">
                      <div className="font-display text-3xl font-bold uppercase leading-none tracking-tight text-white md:text-4xl">
                        {p.name}
                      </div>
                      <div className="h-1.5 w-2/3 rounded bg-white/15" />
                      <div className="h-1.5 w-1/2 rounded bg-white/10" />
                      <div className="flex gap-2 pt-3">
                        <div className="h-7 w-24 rounded-full bg-white/80" />
                        <div className="h-7 w-20 rounded-full border border-white/25" />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col p-7 md:p-10">
                  <div className="flex items-start justify-between gap-4">
                    <span className="font-mono text-xs text-ink-faint">{p.index}</span>
                    <span className="flex h-11 w-11 items-center justify-center rounded-full border border-line transition-colors duration-300 group-hover:border-brand group-hover:bg-brand group-hover:text-paper">
                      <ArrowUpRight className="h-4 w-4" />
                    </span>
                  </div>
                  <h3 className="mt-6 font-display text-3xl font-bold tracking-tight md:text-4xl">{p.name}</h3>
                  <p className="mt-2 font-mono text-[0.7rem] uppercase tracking-[0.14em] text-ink-soft">{p.category}</p>
                  <p className="mt-5 flex-1 leading-relaxed text-ink-soft">{p.description}</p>
                  <ul className="mt-7 flex flex-wrap gap-1.5">
                    {p.stack.map((t) => (
                      <li
                        key={t}
                        className="rounded-full border border-line px-3 py-1 font-mono text-[0.65rem] uppercase tracking-[0.1em] text-ink-soft"
                      >
                        {t}
                      </li>
                    ))}
                  </ul>
                  <span className="mt-7 font-mono text-[0.72rem] uppercase tracking-[0.14em] text-brand">
                    Ver projeto ao vivo →
                  </span>
                </div>
              </a>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
