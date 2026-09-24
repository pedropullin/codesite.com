"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";
import { cart, useCart } from "@/lib/client/cart-store";
import { getLenis } from "./smooth-scroll";
import { cn } from "@/lib/utils";

export type HeaderProps = {
  brandName: string;
  logoUrl?: string;
  announcement?: string;
  instagram?: string;
  whatsapp?: string;
  email?: string;
};

const NAV = [
  { href: "/#collection", label: "Collection" },
  { href: "/shop", label: "Shop" },
  { href: "/#categories", label: "Categories" },
  { href: "/shop?category=exclusives", label: "Exclusives" },
];

export function Wordmark({ name, className }: { name: string; className?: string }) {
  const [first, ...rest] = name.toUpperCase().split(" ");
  return (
    <span className={cn("font-display text-[13px] leading-none tracking-[0.22em] whitespace-nowrap", className)}>
      {first}
      {rest.length > 0 && <span className="ml-[0.5em] opacity-60">{rest.join(" ")}</span>}
    </span>
  );
}

export function Header({ brandName, logoUrl, announcement, instagram, whatsapp, email }: HeaderProps) {
  const { count } = useCart();
  const [menu, setMenu] = useState(false);
  const pathname = usePathname();

  const [lastPath, setLastPath] = useState(pathname);
  if (lastPath !== pathname) {
    setLastPath(pathname);
    setMenu(false);
  }

  useEffect(() => {
    const l = getLenis();
    if (menu) l?.stop();
    else l?.start();
    document.documentElement.style.overflow = menu ? "hidden" : "";
  }, [menu]);

  return (
    <>
      <header
        className="fixed inset-x-0 top-0 z-[90] text-white mix-blend-difference"
        style={{ viewTransitionName: "site-header" }}
      >
        <div className="flex h-16 items-center justify-between px-5 md:h-[76px] md:px-10">
          <Link href="/" aria-label={`${brandName} — início`} className="relative z-10 flex items-center">
            {logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={logoUrl} alt={brandName} className="h-6 w-auto invert" />
            ) : (
              <Wordmark name={brandName} />
            )}
          </Link>

          <nav aria-label="Principal" className="absolute left-1/2 hidden -translate-x-1/2 items-center gap-9 lg:flex">
            {NAV.map((n) => (
              <Link key={n.href} href={n.href} className="group label relative py-2 opacity-80 transition-opacity hover:opacity-100">
                {n.label}
                <span className="absolute bottom-0 left-0 h-px w-full origin-right scale-x-0 bg-current transition-transform duration-500 ease-[var(--ease-vault)] group-hover:origin-left group-hover:scale-x-100" />
              </Link>
            ))}
          </nav>

          <div className="relative z-10 flex items-center gap-6">
            {announcement && <span className="label-sm hidden max-w-[240px] truncate opacity-50 2xl:block">{announcement}</span>}
            <Link href="/shop" className="label hidden opacity-80 transition-opacity hover:opacity-100 md:block">
              Search
            </Link>
            <button type="button" onClick={() => cart.open()} className="label flex items-center gap-2 opacity-90 transition-opacity hover:opacity-100" aria-label={`Abrir carrinho (${count} itens)`}>
              Cart
              <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full border border-current px-1 text-[10px] tabular-nums">
                {count}
              </span>
            </button>
            <button
              type="button"
              className="label flex h-8 items-center gap-2 lg:hidden"
              aria-expanded={menu}
              aria-controls="mobile-menu"
              onClick={() => setMenu((m) => !m)}
            >
              <span className="relative block h-2.5 w-5">
                <span className={cn("absolute left-0 top-0 h-px w-full bg-current transition-transform duration-500", menu && "translate-y-[5px] rotate-45")} />
                <span className={cn("absolute bottom-0 left-0 h-px w-full bg-current transition-transform duration-500", menu && "-translate-y-[4px] -rotate-45")} />
              </span>
              <span className="sr-only">Menu</span>
            </button>
          </div>
        </div>
      </header>

      <AnimatePresence>
        {menu && (
          <motion.div
            id="mobile-menu"
            className="fixed inset-0 z-[80] flex flex-col justify-between bg-ink px-5 pb-10 pt-28 text-bone"
            initial={{ clipPath: "inset(0 0 100% 0)" }}
            animate={{ clipPath: "inset(0 0 0% 0)" }}
            exit={{ clipPath: "inset(0 0 100% 0)" }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            data-lenis-prevent
          >
            <nav className="flex flex-col gap-2" aria-label="Menu">
              {[...NAV, { href: "/checkout", label: "Checkout" }].map((n, i) => (
                <motion.div
                  key={n.href}
                  initial={{ y: 40, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.15 + i * 0.06, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                >
                  <Link href={n.href} className="flex items-baseline justify-between border-b border-white/10 py-4" onClick={() => setMenu(false)}>
                    <span className="display-md">{n.label}</span>
                    <span className="label-sm text-steel">0{i + 1}</span>
                  </Link>
                </motion.div>
              ))}
            </nav>
            <div className="grid grid-cols-2 gap-4 text-steel">
              {instagram && (
                <a href={`https://instagram.com/${instagram}`} target="_blank" rel="noreferrer" className="label">
                  Instagram
                </a>
              )}
              {whatsapp && (
                <a href={`https://wa.me/${whatsapp}`} target="_blank" rel="noreferrer" className="label">
                  WhatsApp
                </a>
              )}
              {email && (
                <a href={`mailto:${email}`} className="label col-span-2">
                  {email}
                </a>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
