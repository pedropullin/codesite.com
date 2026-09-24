import Reveal from "./Reveal";

const STEPS = [
  {
    cmd: "git init",
    title: "Descoberta",
    text: "Entendemos o seu negócio, público e objetivos numa conversa rápida — sem enrolação.",
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
    text: "Publicamos com domínio, SEO e analytics configurados — e seguimos dando suporte.",
  },
];

export default function Process() {
  return (
    <section id="processo" className="mx-auto max-w-7xl px-5 py-24 md:px-10 md:py-32">
      <Reveal className="mb-14">
        <h2 className="font-display text-5xl font-bold uppercase leading-[0.92] tracking-[-0.03em] md:text-7xl">
          Quatro commits
          <br />
          até o ar.
        </h2>
      </Reveal>

      <ol className="grid gap-px overflow-hidden rounded-3xl border border-line bg-line md:grid-cols-2 lg:grid-cols-4">
        {STEPS.map((s, i) => (
          <li key={s.title} className="bg-bg">
            <Reveal delay={i * 90} className="flex h-full flex-col p-7 md:p-8">
              <code className="inline-flex w-fit rounded-md bg-ink px-2.5 py-1 font-mono text-[0.72rem] text-paper">
                <span className="mr-1.5 text-brand">$</span>
                {s.cmd}
              </code>
              <h3 className="mt-5 font-display text-2xl font-bold tracking-tight">{s.title}</h3>
              <p className="mt-3 leading-relaxed text-ink-soft">{s.text}</p>
            </Reveal>
          </li>
        ))}
      </ol>
    </section>
  );
}
