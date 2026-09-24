"use client";

import { useEffect, useRef, useState, type FormEvent, type ReactNode } from "react";
import Reveal from "./Reveal";
import { projects } from "@/lib/projects";
import { social, socials, type SocialId } from "@/lib/site";

type Line = { id: number; kind: "in" | "out" | "err"; content: ReactNode };

const PROMPT = "visitante@codesite:~$";
const SHORTCUTS = ["help", "servicos", "projetos", "whatsapp", "instagram", "discord", "tiktok", "email"];

const LINK_COMMANDS: Record<string, SocialId> = {
  whatsapp: "whatsapp",
  zap: "whatsapp",
  instagram: "instagram",
  insta: "instagram",
  discord: "discord",
  tiktok: "tiktok",
  email: "email",
  "e-mail": "email",
  linkedin: "linkedin",
};

function openSocial(id: SocialId) {
  const s = social(id);
  if (id === "email") {
    window.location.href = s.href;
  } else {
    window.open(s.href, "_blank", "noopener,noreferrer");
  }
}

function ExtLink({ href, children }: { href: string; children: ReactNode }) {
  const isMail = href.startsWith("mailto:");
  return (
    <a
      href={href}
      target={isMail ? undefined : "_blank"}
      rel="noopener noreferrer"
      className="text-[#8fa0ff] underline decoration-[#8fa0ff]/40 underline-offset-4 hover:decoration-[#8fa0ff]"
    >
      {children}
    </a>
  );
}

function run(raw: string): { output: ReactNode; kind?: "out" | "err"; clear?: boolean } {
  const cmd = raw.trim().toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");

  if (cmd === "") return { output: null };
  if (cmd === "clear" || cmd === "limpar") return { output: null, clear: true };

  if (cmd === "help" || cmd === "ajuda") {
    return {
      output: (
        <div className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-1">
          {[
            ["servicos", "o que a gente faz"],
            ["projetos", "trabalhos recentes"],
            ["contato", "todos os canais"],
            ["whatsapp", "abre uma conversa agora"],
            ["instagram", "abre o @codesite0"],
            ["discord", "entra no servidor"],
            ["tiktok", "abre o @code.site0"],
            ["email", "escreve um e-mail"],
            ["clear", "limpa o terminal"],
          ].map(([c, d]) => (
            <div key={c} className="contents">
              <span className="text-paper">{c}</span>
              <span className="text-paper/50">{d}</span>
            </div>
          ))}
        </div>
      ),
    };
  }

  if (cmd === "servicos") {
    return {
      output: (
        <ul className="space-y-1">
          {["Sites institucionais", "Landing pages", "E-commerce", "Sistemas & apps web", "Experiências 3D", "SEO & performance"].map(
            (s) => (
              <li key={s}>
                <span className="text-[#8fa0ff]">→</span> {s}
              </li>
            )
          )}
        </ul>
      ),
    };
  }

  if (cmd === "projetos") {
    return {
      output: (
        <ul className="space-y-1">
          {projects.map((p) => (
            <li key={p.name}>
              <span className="text-paper/40">{p.index}</span> <ExtLink href={p.url}>{p.name}</ExtLink>{" "}
              <span className="text-paper/50">— {p.category}</span>
            </li>
          ))}
        </ul>
      ),
    };
  }

  if (cmd === "contato") {
    return {
      output: (
        <ul className="space-y-1">
          {socials.map((s) => (
            <li key={s.id}>
              <span className="inline-block w-24 text-paper/50">{s.label}</span>
              <ExtLink href={s.href}>{s.handle}</ExtLink>
            </li>
          ))}
        </ul>
      ),
    };
  }

  const linkId = LINK_COMMANDS[cmd];
  if (linkId) {
    const s = social(linkId);
    openSocial(linkId);
    return {
      output: (
        <span>
          <span className="text-[#5ee39a]">✓</span> abrindo {s.label}… se nada abriu,{" "}
          <ExtLink href={s.href}>clique aqui</ExtLink>.
        </span>
      ),
    };
  }

  if (cmd === "sudo" || cmd.startsWith("sudo ")) {
    return { output: "permissão negada. mas um orçamento a gente libera: digite whatsapp", kind: "err" };
  }

  return { output: `comando não encontrado: ${raw.trim()}. digite help`, kind: "err" };
}

export default function Terminal() {
  const [lines, setLines] = useState<Line[]>([
    { id: 0, kind: "out", content: "CODE SITE shell v2.0 — digite help ou toque num atalho abaixo." },
  ]);
  const [value, setValue] = useState("");
  const [history, setHistory] = useState<string[]>([]);
  const [cursor, setCursor] = useState(-1);
  const nextId = useRef(1);
  const input = useRef<HTMLInputElement>(null);
  const body = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = body.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [lines]);

  const exec = (raw: string) => {
    const result = run(raw);
    if (result.clear) {
      setLines([]);
    } else {
      const add: Line[] = [{ id: nextId.current++, kind: "in", content: raw }];
      if (result.output) add.push({ id: nextId.current++, kind: result.kind ?? "out", content: result.output });
      setLines((prev) => [...prev, ...add]);
    }
    if (raw.trim()) setHistory((h) => [raw, ...h].slice(0, 30));
    setCursor(-1);
  };

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    exec(value);
    setValue("");
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowUp" && history.length) {
      e.preventDefault();
      const next = Math.min(cursor + 1, history.length - 1);
      setCursor(next);
      setValue(history[next]);
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      const next = cursor - 1;
      setCursor(next);
      setValue(next >= 0 ? history[next] : "");
    }
  };

  return (
    <section id="terminal" className="relative bg-ink py-24 text-paper grid-bg-dark md:py-32">
      <div className="mx-auto grid max-w-7xl gap-12 px-5 md:px-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
        <Reveal>
          <span className="mb-6 inline-flex items-center gap-2.5 font-mono text-[0.7rem] font-medium uppercase tracking-[0.24em] text-paper/60">
            <span className="h-px w-6 bg-brand" />
            Interativo
          </span>
          <h2 className="font-display text-5xl font-bold uppercase leading-[0.92] tracking-[-0.03em] md:text-7xl">
            Fale com a gente
            <br />
            <span className="text-brand">em código.</span>
          </h2>
          <p className="mt-6 max-w-md leading-relaxed text-paper/60">
            Um terminal de verdade: digite um comando e ele executa. Experimente <code className="text-paper">whatsapp</code>,{" "}
            <code className="text-paper">projetos</code> ou <code className="text-paper">discord</code>.
          </p>
        </Reveal>

        <Reveal delay={120}>
          <div
            className="overflow-hidden rounded-2xl border border-paper/10 bg-[#111114] shadow-[0_40px_120px_-40px_rgba(43,70,255,0.55)]"
            onClick={() => input.current?.focus({ preventScroll: true })}
          >
            <div className="flex items-center gap-2 border-b border-paper/10 px-4 py-3">
              <span className="h-3 w-3 rounded-full bg-[#ff5f57]" />
              <span className="h-3 w-3 rounded-full bg-[#febc2e]" />
              <span className="h-3 w-3 rounded-full bg-[#28c840]" />
              <span className="ml-3 font-mono text-[0.7rem] text-paper/40">codesite — zsh</span>
            </div>

            <div
              ref={body}
              className="h-[320px] overflow-y-auto px-5 py-4 font-mono text-[0.82rem] leading-relaxed md:h-[360px]"
              aria-live="polite"
            >
              {lines.map((l) => (
                <div key={l.id} className="mb-1.5">
                  {l.kind === "in" ? (
                    <span>
                      <span className="text-[#5ee39a]">{PROMPT}</span> <span className="text-paper">{l.content}</span>
                    </span>
                  ) : (
                    <div className={l.kind === "err" ? "text-[#ff8a80]" : "text-paper/80"}>{l.content}</div>
                  )}
                </div>
              ))}

              <form onSubmit={onSubmit} className="flex items-center gap-2">
                <label htmlFor="terminal-input" className="shrink-0 text-[#5ee39a]">
                  {PROMPT}
                </label>
                <input
                  id="terminal-input"
                  ref={input}
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
                  onKeyDown={onKeyDown}
                  autoComplete="off"
                  autoCapitalize="off"
                  spellCheck={false}
                  enterKeyHint="send"
                  className="min-w-0 flex-1 bg-transparent text-paper caret-[#8fa0ff] outline-none"
                  aria-label="Digite um comando"
                />
              </form>
            </div>

            <div className="flex flex-wrap gap-2 border-t border-paper/10 px-4 py-3">
              {SHORTCUTS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    exec(c);
                  }}
                  className="rounded-full border border-paper/15 px-3 py-1.5 font-mono text-[0.7rem] text-paper/70 transition-colors hover:border-brand hover:bg-brand hover:text-paper"
                >
                  {c}
                </button>
              ))}
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
