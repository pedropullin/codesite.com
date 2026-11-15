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
      <header className="fixed inset-x-0 top-0 z-50 px-4 pt-4 md:pt-5">
        <nav
          className={`mx-auto flex max-w-[920px] items-center justify-between gap-4 rounded-full border border-white/10 py-2 pr-2 pl-4 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.07),0_10px_30px_rgba(0,0,0,0.35)] backdrop-blur-[16px] transition-colors duration-300 md:pl-5 ${
            scrolled || open ? "bg-[rgba(10,11,13,0.86)]" : "bg-[rgba(14,15,18,0.55)]"
          }`}
        >
          <a href="#topo" className="flex items-center gap-2.5" aria-label={`${site.name}, início`}>
            <CodeSiteMark className="h-7 w-7" />
            <span className="text-[0.95rem] font-semibold tracking-tight">{site.name}</span>
          </a>

          <ul className="hidden items-center gap-7 md:flex">
            {navLinks.map((l) => (
              <li key={l.href}>
                <a
                  href={l.href}
                  className="text-sm font-medium text-[#9c9c9d] transition-colors hover:text-white"
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
              className="hidden items-center gap-2 rounded-full bg-[#e6e6e6] px-4 py-2 text-[0.875rem] font-medium text-[#2f3031] transition-[background-color,transform] duration-200 hover:bg-white active:scale-[0.97] sm:inline-flex"
            >
              <WhatsAppIcon className="h-3.5 w-3.5" />
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
                className="flex items-baseline gap-4 py-3 font-display text-5xl font-semibold tracking-[-0.03em]"
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
