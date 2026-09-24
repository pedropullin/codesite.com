import { CodeSiteMark, socialIcons } from "./icons";
import { navLinks, site, socials } from "@/lib/site";

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="bg-ink text-paper">
      <div className="mx-auto max-w-7xl px-5 py-16 md:px-10">
        <div className="flex flex-col gap-12 md:flex-row md:items-start md:justify-between">
          <div className="max-w-xs">
            <a href="#topo" className="flex items-center gap-2.5">
              <CodeSiteMark className="h-8 w-8" inverted />
              <span className="font-display text-lg font-bold tracking-tight">{site.name}</span>
            </a>
            <p className="mt-4 text-sm leading-relaxed text-paper/55">{site.description}</p>
          </div>

          <div className="flex flex-wrap gap-x-16 gap-y-10">
            <div>
              <h4 className="font-mono text-[0.62rem] uppercase tracking-[0.2em] text-paper/40">Menu</h4>
              <ul className="mt-4 space-y-3">
                {navLinks.map((l) => (
                  <li key={l.href}>
                    <a
                      href={l.href}
                      className="font-mono text-[0.74rem] uppercase tracking-[0.1em] text-paper/70 transition-colors hover:text-paper"
                    >
                      {l.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="font-mono text-[0.62rem] uppercase tracking-[0.2em] text-paper/40">Redes</h4>
              <ul className="mt-4 space-y-3">
                {socials.map((s) => {
                  const Icon = socialIcons[s.id];
                  return (
                    <li key={s.id}>
                      <a
                        href={s.href}
                        target={s.id === "email" ? undefined : "_blank"}
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2.5 font-mono text-[0.74rem] uppercase tracking-[0.1em] text-paper/70 transition-colors hover:text-paper"
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
        </div>

        <div className="mt-16 flex flex-col gap-3 border-t border-paper/10 pt-8 font-mono text-[0.66rem] uppercase tracking-[0.16em] text-paper/40 sm:flex-row sm:justify-between">
          <span>
            © {year} {site.name}. Todos os direitos reservados.
          </span>
          <span>
            Código. Design. <span className="text-brand">Experiência.</span>
          </span>
        </div>
      </div>
    </footer>
  );
}
