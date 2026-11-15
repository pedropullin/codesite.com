
const STEPS = [
  {
    cmd: "git init",
    title: "Descoberta",
    text: "Entendemos o seu negócio, público e objetivos numa conversa rápida, sem enrolação.",
  },
  {
    cmd: "design --figma",
    title: "Design",
    text: "Criamos a interface e a identidade visual. Você aprova cada tela antes do código.",
  },
  {
    cmd: "npm run build",
    title: "Desenvolvimento",
    text: "Código limpo, rápido e responsivo. Você acompanha a evolução em um link ao vivo.",
  },
  {
    cmd: "deploy --prod",
    title: "Lançamento",
    text: "Publicamos com domínio, SEO e analytics configurados, e seguimos dando suporte.",
  },
];

export default function Process() {
  return (
    <section id="processo" className="process-section bg-bg">
      <div className="process-pin mx-auto flex max-w-7xl flex-col justify-center px-5 py-28 md:px-10 md:py-36 lg:min-h-screen lg:py-24">
        <h2
          data-split
          className="font-display text-[clamp(2.6rem,7vw,6.5rem)] font-semibold leading-[0.95] tracking-[-0.04em]"
        >
          Quatro commits
          <br />
          até o ar.
        </h2>

        <div className="relative mt-16 md:mt-20">
          <div className="process-bar absolute -top-6 left-0 hidden h-[3px] w-full origin-left scale-x-0 rounded-full bg-brand lg:block" aria-hidden />
          <ol className="process-steps grid gap-3 md:grid-cols-2 lg:grid-cols-4">
            {STEPS.map((s) => (
              <li key={s.title} className="process-step">
                <div className="flex h-full flex-col rounded-3xl border border-line bg-bg-soft p-7 transition-colors md:p-8">
                  <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-2">
                    <h3 className="font-display text-3xl font-semibold tracking-[-0.02em]">{s.title}</h3>
                    <code className="whitespace-nowrap rounded-md border border-line bg-white/[0.06] px-2 py-0.5 font-mono text-[0.9rem] text-white">
                      <span className="mr-1.5 text-[#8fa0ff]">$</span>
                      {s.cmd}
                    </code>
                  </div>
                  <p className="mt-3 text-[1.05rem] leading-relaxed text-ink">{s.text}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
