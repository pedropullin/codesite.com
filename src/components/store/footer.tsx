import Link from "next/link";
import type { StoreSettings } from "@/lib/settings-schema";
import { Reveal } from "./reveal";

type Category = { name: string; slug: string };

export function Footer({ settings, categories }: { settings: StoreSettings; categories: Category[] }) {
  const { brand, contact, texts } = settings;
  const socials = [
    contact.instagram && { label: "Instagram", href: `https://instagram.com/${contact.instagram.replace(/^@/, "")}` },
    contact.whatsapp && { label: "WhatsApp", href: `https://wa.me/${contact.whatsapp.replace(/\D/g, "")}` },
    contact.tiktok && { label: "TikTok", href: `https://tiktok.com/@${contact.tiktok.replace(/^@/, "")}` },
    contact.youtube && { label: "YouTube", href: contact.youtube },
    contact.x && { label: "X", href: `https://x.com/${contact.x.replace(/^@/, "")}` },
    contact.pinterest && { label: "Pinterest", href: contact.pinterest },
  ].filter(Boolean) as { label: string; href: string }[];
  const [first, ...rest] = brand.name.toUpperCase().split(" ");

  return (
    <footer className="relative overflow-hidden bg-ink text-bone">
      <div className="mx-auto grid max-w-[1600px] gap-14 px-5 pb-10 pt-24 md:grid-cols-12 md:px-10 md:pt-32">
        <Reveal className="md:col-span-5">
          <p className="label text-steel">{brand.shortName} / Association</p>
          <p className="mt-6 max-w-md text-balance text-lg leading-relaxed text-bone/80">{texts.footerNote}</p>
          {contact.whatsapp && (
            <a
              href={`https://wa.me/${contact.whatsapp.replace(/\D/g, "")}`}
              target="_blank"
              rel="noreferrer"
              className="group mt-10 inline-flex items-center gap-4"
            >
              <span className="display-md text-[1.5rem] md:text-[2rem]">Talk to the concierge</span>
              <span className="transition-transform duration-500 group-hover:translate-x-2">→</span>
            </a>
          )}
        </Reveal>
        <div className="grid grid-cols-2 gap-10 md:col-span-7 md:grid-cols-3">
          <div>
            <p className="label-sm text-steel">Shop</p>
            <ul className="mt-5 space-y-3 text-sm">
              <li><Link href="/shop" className="opacity-80 hover:opacity-100">Todos os produtos</Link></li>
              {categories.map((c) => (
                <li key={c.slug}>
                  <Link href={`/shop?category=${c.slug}`} className="opacity-80 hover:opacity-100">{c.name}</Link>
                </li>
              ))}
              <li><Link href="/shop?filter=new" className="opacity-80 hover:opacity-100">Novidades</Link></li>
            </ul>
          </div>
          <div>
            <p className="label-sm text-steel">Contato</p>
            <ul className="mt-5 space-y-3 text-sm">
              {contact.email && <li><a href={`mailto:${contact.email}`} className="break-all opacity-80 hover:opacity-100">{contact.email}</a></li>}
              {contact.phone && <li className="opacity-80">{contact.phone}</li>}
              {contact.address && <li className="opacity-60">{contact.address}</li>}
              {contact.hours && <li className="opacity-60">{contact.hours}</li>}
            </ul>
          </div>
          <div>
            <p className="label-sm text-steel">Social</p>
            <ul className="mt-5 space-y-3 text-sm">
              {socials.map((s) => (
                <li key={s.label}>
                  <a href={s.href} target="_blank" rel="noreferrer" className="opacity-80 hover:opacity-100">{s.label}</a>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-[1600px] px-5 md:px-10">
        <div className="h-px w-full bg-white/10" />
        <div className="flex flex-col gap-3 py-6 text-steel md:flex-row md:items-center md:justify-between">
          <p className="label-sm">© {new Date().getFullYear()} {brand.name}. {brand.location}.</p>
          <p className="label-sm">
            Experience developed by{" "}
            <a href="https://codesite.com" target="_blank" rel="noreferrer" className="text-bone/80 hover:text-bone">CodeSite</a>
          </p>
        </div>
      </div>

      <div aria-hidden className="pointer-events-none select-none px-3 pb-3 md:px-6">
        <p className="font-display whitespace-nowrap text-center uppercase leading-[0.78] tracking-[-0.04em] text-bone" style={{ fontSize: "clamp(3rem, 12.4vw, 15rem)" }}>
          {first}
          <span className="text-graphite-3"> {rest.join(" ")}</span>
        </p>
      </div>
    </footer>
  );
}
