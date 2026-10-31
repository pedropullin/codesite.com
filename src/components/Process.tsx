import Reveal from "./Reveal";

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
    <section id="processo" className="bg-bg-soft">
      <div className="mx-auto max-w-7xl px-5 py-28 md:px-10 md:py-36">
        <Reveal>
          <h2 className="font-display text-[clamp(2.6rem,7vw,6.5rem)] font-bold leading-[0.95] tracking-[-0.04em]">
            Quatro commits
            <br />
            até o ar.
          </h2>
        </Reveal>

        <ol className="mt-16 grid gap-3 md:mt-24 md:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((s, i) => (
            <li key={s.title}>
              <Reveal delay={i * 80} className="flex h-full flex-col rounded-3xl bg-paper p-7 md:p-8">
                <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-2">
                  <h3 className="font-display text-3xl font-bold tracking-[-0.02em]">{s.title}</h3>
                  <code className="whitespace-nowrap rounded-md bg-ink px-2 py-0.5 font-mono text-[0.9rem] text-paper">
                    <span className="mr-1.5 text-[#8fa0ff]">$</span>
                    {s.cmd}
                  </code>
                </div>
                <p className="mt-3 text-[1.05rem] leading-relaxed text-ink">{s.text}</p>
              </Reveal>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
