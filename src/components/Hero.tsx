import Typewriter from "./Typewriter";
import VibeInput from "./VibeInput";
import { HeroGlyphs } from "./three/Lazy";

const PHRASES = ["sites institucionais", "landing pages", "lojas virtuais", "sistemas sob medida", "experiências 3D"];

const STACK = ["Next.js", "React", "Tailwind", "Three.js", "TypeScript"];
const INTEGRATIONS = ["WhatsApp", "Pix", "Mercado Pago", "Stripe", "Supabase", "Vercel", "Google Analytics", "Meta Pixel", "Figma", "Instagram"];

export default function Hero() {
  return (
    <section id="topo" className="hero-section relative isolate flex min-h-[110vh] flex-col overflow-hidden bg-[#0f172a] text-white">
      <div className="aurora" aria-hidden>
        <div className="aurora-blade aurora-b4" />
        <div className="aurora-blade aurora-b1" />
        <div className="aurora-blade aurora-b2" />
        <div className="aurora-blade aurora-b3" />
        <div className="aurora-blade aurora-b5" />
      </div>
      <div className="grid-overlay absolute inset-0 -z-10" aria-hidden />
      <div className="aurora-grain" aria-hidden />
      <div className="aurora-vignette" aria-hidden />
      <div className="hero-3d absolute inset-0" aria-hidden>
        <HeroGlyphs />
      </div>

      <div className="hero-content relative z-10 mx-auto flex w-full max-w-7xl flex-1 flex-col items-center px-5 pt-36 pb-10 text-center md:px-10 md:pt-44">
        <h1
          data-hero-title
          className="max-w-[900px] font-display text-[clamp(2.75rem,7vw,4.5rem)] font-medium leading-[1.1] tracking-tight text-balance"
        >
          Código que vira <em className="text-aurora font-medium">experiência.</em>
        </h1>
        <p data-hero-in className="mt-6 max-w-[640px] text-lg leading-relaxed text-slate-300 md:text-xl">
          Criamos <Typewriter phrases={PHRASES} className="font-medium text-white" />
          <br className="hidden sm:block" /> do design ao código, para marcas que querem ser lembradas.
        </p>

        <div data-hero-in className="mt-10 flex w-full justify-center">
          <VibeInput />
        </div>
        <a
          data-hero-in
          href="#trabalhos"
          className="mt-5 text-sm font-medium text-slate-400 underline-offset-4 transition-colors hover:text-white hover:underline"
        >
          ou veja os projetos no ar ↓
        </a>
      </div>

      {/* Floating stack bar at the foot of the hero. */}
      <div className="relative z-10 mx-auto mb-10 w-[calc(100%-2.5rem)] max-w-4xl md:mb-14">
        <div data-hero-in className="glass-soft grid overflow-hidden rounded-2xl md:grid-cols-[auto_1fr]">
          <div className="flex items-center gap-4 border-b border-white/10 px-5 py-4 md:border-r md:border-b-0">
            <span className="text-sm font-medium text-slate-400">Feito com</span>
            <ul className="flex flex-wrap gap-x-4 gap-y-1">
              {STACK.map((s) => (
                <li key={s} className="font-brand text-sm font-bold tracking-tight text-slate-300 transition-colors duration-300 hover:text-white">
                  {s}
                </li>
              ))}
            </ul>
          </div>
          <div className="flex min-w-0 items-center gap-4 px-5 py-4">
            <span className="shrink-0 text-sm font-medium text-slate-400">Integra com</span>
            <div className="min-w-0 flex-1 overflow-hidden [mask-image:linear-gradient(90deg,transparent,#000_12%,#000_88%,transparent)]">
              <ul className="slide-left flex w-max gap-6" aria-label="Integrações">
                {[...INTEGRATIONS, ...INTEGRATIONS].map((s, i) => (
                  <li
                    key={i}
                    aria-hidden={i >= INTEGRATIONS.length}
                    className="font-brand text-sm font-bold tracking-tight whitespace-nowrap text-slate-400 transition-colors duration-300 hover:text-[#9fd2ff]"
                  >
                    {s}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
