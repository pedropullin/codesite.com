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
    // Smooth scrolling (see Motion) must pause while the menu covers the page.
    const lenis = (window as unknown as { __lenis?: { stop: () => void; start: () => void } }).__lenis;
    if (open) lenis?.stop();
    else lenis?.start();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <>
      <header
        className={`fixed inset-x-0 top-0 z-50 transition-[background-color,border-color,backdrop-filter] duration-500 ease-in-out ${
          scrolled || open
            ? "border-b border-white/10 bg-[rgba(15,23,42,0.92)] backdrop-blur-[16px]"
            : "border-b border-transparent bg-transparent"
        }`}
      >
        <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-5 text-white md:h-20 md:px-10">
          <a href="#topo" className="group flex items-center gap-2.5" aria-label={`${site.name}, início`}>
            <span className="transition-transform duration-500 ease-in-out group-hover:rotate-180">
              <CodeSiteMark className="h-8 w-8" />
            </span>
            <span className="font-brand text-lg font-bold tracking-tight lowercase">codesite</span>
          </a>

          <ul className="glass-soft hidden items-center gap-1 rounded-full p-1 md:flex">
            {navLinks.map((l) => (
              <li key={l.href}>
                <a
                  href={l.href}
                  className="block rounded-full px-4 py-2 text-sm font-medium text-slate-300 transition-colors duration-300 hover:bg-white/10 hover:text-white"
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
              className="hidden items-center gap-2 rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-slate-900 shadow-[0_0_20px_rgba(255,255,255,0.2)] transition-[box-shadow,transform] duration-300 hover:shadow-[0_0_28px_rgba(255,255,255,0.35)] active:scale-[0.97] sm:inline-flex"
            >
              <WhatsAppIcon className="h-4 w-4" />
              Orçamento
            </a>
            <button
              type="button"
              onClick={() => setOpen((v) => !v)}
              className="relative flex h-10 w-10 items-center justify-center rounded-full bg-white/10 md:hidden"
              aria-expanded={open}
              aria-controls="mobile-menu"
              aria-label={open ? "Fechar menu" : "Abrir menu"}
            >
              <span
                className={`absolute h-0.5 w-5 bg-white transition-transform duration-300 ${open ? "rotate-45" : "-translate-y-1.5"}`}
              />
              <span
                className={`absolute h-0.5 w-5 bg-white transition-transform duration-300 ${open ? "-rotate-45" : "translate-y-1.5"}`}
              />
            </button>
          </div>
        </nav>
      </header>

      <div
        id="mobile-menu"
        className={`fixed inset-0 z-40 flex flex-col bg-bg px-5 pt-28 pb-10 transition-[opacity,transform,visibility] duration-300 md:hidden ${
          open ? "visible opacity-100" : "pointer-events-none invisible -translate-y-3 opacity-0"
        }`}
        aria-hidden={!open}
      >
        <ul className="flex flex-col gap-2">
          {navLinks.map((l) => (
            <li key={l.href}>
              <a
                href={l.href}
                onClick={() => setOpen(false)}
                tabIndex={open ? 0 : -1}
                className="flex items-baseline gap-4 py-3 font-display text-5xl font-medium tracking-[-0.02em]"
              >
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
                  className="flex flex-col items-center gap-2 rounded-2xl bg-bg-soft py-4 text-sm font-medium text-ink"
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
