import { socialIcons } from "./icons";
import { navLinks, site, socials } from "@/lib/site";

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="overflow-hidden bg-ink text-paper">
      <div className="mx-auto max-w-7xl px-5 pt-20 pb-10 md:px-10 md:pt-28">
        <div className="grid gap-12 md:grid-cols-[1.4fr_1fr_1fr]">
          <p className="max-w-sm text-lg leading-relaxed text-paper/85">{site.description}</p>

          <nav aria-label="Menu do rodapé">
            <h2 className="text-[0.95rem] font-semibold text-paper/60">Menu</h2>
            <ul className="mt-4 space-y-3">
              {navLinks.map((l) => (
                <li key={l.href}>
                  <a href={l.href} className="text-lg text-paper transition-colors hover:text-[#8fa0ff]">
                    {l.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          <div>
            <h2 className="text-[0.95rem] font-semibold text-paper/60">Redes</h2>
            <ul className="mt-4 space-y-3">
              {socials.map((s) => {
                const Icon = socialIcons[s.id];
                return (
                  <li key={s.id}>
                    <a
                      href={s.href}
                      target={s.id === "email" ? undefined : "_blank"}
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2.5 text-lg text-paper transition-colors hover:text-[#8fa0ff]"
                    >
                      <Icon className="h-4 w-4" />
                      {s.label}
                    </a>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>

        <a
          href="#topo"
          className="mt-20 block font-display text-[clamp(4rem,17.5vw,16rem)] font-bold leading-[0.85] tracking-[-0.05em] md:mt-28"
          aria-label={`${site.name}, voltar ao início`}
        >
          {site.name}
        </a>

        <div className="mt-8 flex flex-col gap-2 text-[0.95rem] text-paper/60 sm:flex-row sm:justify-between">
          <span>
            © {year} {site.name}. Todos os direitos reservados.
          </span>
          <span>Código. Design. Experiência.</span>
        </div>
      </div>
    </footer>
  );
}
