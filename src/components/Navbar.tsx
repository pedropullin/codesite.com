"use client";

import { useEffect, useState } from "react";
import { CodeSiteMark, WhatsAppIcon, socialIcons } from "./icons";
import { navLinks, site, socials, whatsappLink } from "@/lib/site";

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <>
      <header
        className={`fixed inset-x-0 top-0 z-50 transition-colors duration-300 ${
          scrolled || open ? "border-b border-line bg-bg/85 backdrop-blur-md" : "border-b border-transparent"
        }`}
      >
        <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5 md:h-20 md:px-10">
          <a href="#topo" className="flex items-center gap-2.5" aria-label={`${site.name} — início`}>
            <CodeSiteMark className="h-8 w-8" />
            <span className="font-display text-lg font-bold tracking-tight">{site.name}</span>
          </a>

          <ul className="hidden items-center gap-8 md:flex">
            {navLinks.map((l) => (
              <li key={l.href}>
                <a
                  href={l.href}
                  className="font-mono text-[0.72rem] uppercase tracking-[0.16em] text-ink-soft transition-colors hover:text-ink"
                >
                  {l.label}
                </a>
              </li>
            ))}
          </ul>

          <div className="flex items-center gap-2">
            <a
              href={whatsappLink()}
              target="_blank"
              rel="noopener noreferrer"
              className="hidden items-center gap-2 rounded-full bg-ink px-5 py-2.5 font-mono text-[0.72rem] font-medium uppercase tracking-[0.14em] text-paper transition-colors hover:bg-brand sm:inline-flex"
            >
              <WhatsAppIcon className="h-4 w-4" />
              Orçamento
            </a>
            <button
              type="button"
              onClick={() => setOpen((v) => !v)}
              className="relative flex h-11 w-11 items-center justify-center rounded-full border border-line md:hidden"
              aria-expanded={open}
              aria-controls="mobile-menu"
              aria-label={open ? "Fechar menu" : "Abrir menu"}
            >
              <span
                className={`absolute h-0.5 w-5 bg-ink transition-transform duration-300 ${open ? "rotate-45" : "-translate-y-1.5"}`}
              />
              <span
                className={`absolute h-0.5 w-5 bg-ink transition-transform duration-300 ${open ? "-rotate-45" : "translate-y-1.5"}`}
              />
            </button>
          </div>
        </nav>
      </header>

      <div
        id="mobile-menu"
        className={`fixed inset-0 z-40 flex flex-col bg-bg px-5 pt-24 pb-10 transition-[opacity,transform] duration-300 md:hidden ${
          open ? "opacity-100" : "pointer-events-none -translate-y-3 opacity-0"
        }`}
        aria-hidden={!open}
      >
        <ul className="flex flex-col gap-2">
          {navLinks.map((l, i) => (
            <li key={l.href}>
              <a
                href={l.href}
                onClick={() => setOpen(false)}
                tabIndex={open ? 0 : -1}
                className="flex items-baseline gap-4 border-b border-line py-4 font-display text-4xl font-bold uppercase tracking-tight"
              >
                <span className="font-mono text-xs font-normal text-ink-faint">0{i + 1}</span>
                {l.label}
              </a>
            </li>
          ))}
        </ul>
        <div className="mt-auto grid grid-cols-3 gap-2">
          {socials
            .filter((s) => s.id !== "linkedin")
            .map((s) => {
              const Icon = socialIcons[s.id];
              return (
                <a
                  key={s.id}
                  href={s.href}
                  target={s.id === "email" ? undefined : "_blank"}
                  rel="noopener noreferrer"
                  tabIndex={open ? 0 : -1}
                  className="flex flex-col items-center gap-2 rounded-2xl border border-line py-4 font-mono text-[0.65rem] uppercase tracking-[0.12em] text-ink-soft"
                >
                  <Icon className="h-5 w-5 text-ink" />
                  {s.label}
                </a>
              );
            })}
        </div>
      </div>
    </>
  );
}
