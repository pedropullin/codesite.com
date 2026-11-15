"use client";

import { useMemo, useRef, useState } from "react";
import { CodeSiteMark } from "./icons";
import { whatsappLink } from "@/lib/site";

type Command = {
  label: string;
  arg: string;
  href: string;
  external?: boolean;
  keywords: string;
  icon: "chat" | "folder" | "grid" | "terminal";
};

const COMMANDS: Command[] = [
  {
    label: "Pedir orçamento",
    arg: "whatsapp --agora",
    href: whatsappLink(),
    external: true,
    keywords: "orcamento preco valor whatsapp contato falar",
    icon: "chat",
  },
  {
    label: "Ver projetos no ar",
    arg: "cd ~/trabalhos",
    href: "#trabalhos",
    keywords: "projetos trabalhos portfolio saint ami prospecta brasa",
    icon: "folder",
  },
  {
    label: "Ver serviços",
    arg: "ls ~/servicos",
    href: "#servicos",
    keywords: "servicos site landing ecommerce loja sistema app 3d",
    icon: "grid",
  },
  {
    label: "Abrir o terminal",
    arg: "./fale-com-a-gente",
    href: "#terminal",
    keywords: "terminal codigo comando shell",
    icon: "terminal",
  },
];

const norm = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "");

function Icon({ name }: { name: Command["icon"] }) {
  const common = {
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 2,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    className: "h-[15px] w-[15px]",
    "aria-hidden": true,
  };
  switch (name) {
    case "chat":
      return (
        <svg {...common}>
          <path d="M21 12a8 8 0 0 1-11.8 7L4 20l1.1-4.6A8 8 0 1 1 21 12Z" />
        </svg>
      );
    case "folder":
      return (
        <svg {...common}>
          <path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2Z" />
        </svg>
      );
    case "grid":
      return (
        <svg {...common}>
          <rect x="4" y="4" width="6.5" height="6.5" rx="1.5" />
          <rect x="13.5" y="4" width="6.5" height="6.5" rx="1.5" />
          <rect x="4" y="13.5" width="6.5" height="6.5" rx="1.5" />
          <rect x="13.5" y="13.5" width="6.5" height="6.5" rx="1.5" />
        </svg>
      );
    case "terminal":
      return (
        <svg {...common}>
          <path d="m5 8 4 4-4 4M12 17h7" />
        </svg>
      );
  }
}

/**
 * A working command bar: type to filter, arrows to move, Enter to open.
 * Anything that matches nothing becomes a WhatsApp message.
 */
export default function CommandBar() {
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const [focused, setFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const results = useMemo<Command[]>(() => {
    const q = norm(query.trim());
    if (!q) return COMMANDS;
    const hits = COMMANDS.filter((c) => norm(`${c.label} ${c.arg} ${c.keywords}`).includes(q));
    if (hits.length) return hits;
    return [
      {
        label: `Mandar “${query.trim()}”`,
        arg: "no WhatsApp",
        href: whatsappLink(`Olá! Vim pelo site da CODE SITE. ${query.trim()}`),
        external: true,
        keywords: "",
        icon: "chat",
      },
    ];
  }, [query]);

  const current = Math.min(active, results.length - 1);

  function open(c: Command) {
    if (c.external) window.open(c.href, "_blank", "noopener,noreferrer");
    else window.location.hash = c.href;
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((current + 1) % results.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((current - 1 + results.length) % results.length);
    } else if (e.key === "Enter") {
      e.preventDefault();
      open(results[current]);
    } else if (e.key === "Escape") {
      setQuery("");
      setActive(0);
    }
  }

  return (
    <div className="w-full max-w-[720px] overflow-hidden rounded-[14px] border border-white/10 bg-[rgba(18,19,22,0.62)] text-left shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_30px_80px_-20px_rgba(43,70,255,0.38),0_20px_50px_rgba(0,0,0,0.55)] backdrop-blur-[22px]">
      <label
        htmlFor="command-input"
        className="flex cursor-text items-center gap-3 border-b border-white/10 px-[18px] py-4"
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          className="h-[17px] w-[17px] shrink-0 text-[#9c9c9d]"
          aria-hidden
        >
          <circle cx="11" cy="11" r="7" />
          <path d="m20 20-3.5-3.5" />
        </svg>
        <span className="relative min-w-0 flex-1">
          <input
            ref={inputRef}
            id="command-input"
            type="text"
            autoComplete="off"
            spellCheck={false}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setActive(0);
            }}
            onKeyDown={onKeyDown}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            role="combobox"
            aria-expanded="true"
            aria-controls="command-results"
            aria-activedescendant={`command-${current}`}
            aria-label="O que você precisa?"
            className="w-full bg-transparent text-base text-white caret-[#6f97ff] outline-none placeholder:text-transparent"
            placeholder="O que você precisa?"
          />
          {!query && (
            <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center text-base text-white/45">
              {!focused && (
                <span className="caret mr-1 inline-block h-[1.1em] w-0.5 bg-[#6f97ff] shadow-[0_0_8px_#4f86ff]" />
              )}
              O que você precisa?
            </span>
          )}
        </span>
        <span className="shrink-0 rounded-md border border-white/10 bg-white/5 px-2.5 py-1 text-xs font-medium text-white/70">
          Comando
        </span>
      </label>

      <ul id="command-results" role="listbox" aria-label="Comandos" className="px-2 py-2">
        {results.map((c, i) => {
          const on = i === current;
          return (
            <li key={c.label} id={`command-${i}`} role="option" aria-selected={on}>
              <a
                href={c.href}
                target={c.external ? "_blank" : undefined}
                rel={c.external ? "noopener noreferrer" : undefined}
                tabIndex={-1}
                onMouseEnter={() => setActive(i)}
                className={`flex items-center gap-3 rounded-[9px] px-2.5 py-2.5 text-sm transition-colors ${
                  on
                    ? "bg-[linear-gradient(90deg,rgba(43,70,255,0.26),rgba(79,134,255,0.12)_55%,rgba(159,210,255,0.04))] text-white shadow-[inset_0_0_0_1px_rgba(79,134,255,0.35)]"
                    : "text-white/72"
                }`}
              >
                <span
                  className={`grid h-7 w-7 shrink-0 place-items-center rounded-[7px] border ${
                    on ? "border-[#4f86ff]/40 bg-[#2b46ff]/20 text-[#9fd2ff]" : "border-white/10 bg-white/5"
                  }`}
                >
                  <Icon name={c.icon} />
                </span>
                <span className="flex min-w-0 flex-1 items-baseline gap-2.5 overflow-hidden">
                  <span className="truncate">{c.label}</span>
                  <span
                    className={`hidden truncate font-mono text-[12.5px] sm:inline ${on ? "text-[#bcd8ff]/80" : "text-[#9c9c9d]"}`}
                  >
                    {c.arg}
                  </span>
                </span>
                {on && (
                  <kbd className="shrink-0 rounded-[5px] border border-b-2 border-white/10 bg-white/5 px-1.5 py-0.5 font-mono text-[11.5px] text-white/75">
                    ↵
                  </kbd>
                )}
              </a>
            </li>
          );
        })}
      </ul>

      <div className="flex items-center justify-between gap-3 border-t border-white/10 bg-black/20 px-[18px] py-[11px] font-mono text-[11.5px] text-[#9c9c9d]">
        <span className="hidden sm:inline">↑↓ navegar · ↵ abrir · esc limpar</span>
        <span className="sm:hidden">Toque numa opção</span>
        <span className="flex items-center gap-2 font-sans text-[12.5px] font-semibold text-white/75">
          <CodeSiteMark className="h-4 w-4" inverted />
          CODE SITE
        </span>
      </div>
    </div>
  );
}
