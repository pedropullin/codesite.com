import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";

export function AuthShell({ title, subtitle, children }: { title: string; subtitle: string; children: ReactNode }) {
  return (
    <div className="grid min-h-dvh lg:grid-cols-2">
      <div className="relative hidden overflow-hidden bg-ink text-bone lg:block">
        <Image src="/renders/brand-detail.webp" alt="" fill priority sizes="50vw" className="object-cover opacity-70" />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-black/40" />
        <div className="absolute inset-x-0 top-0 flex justify-between p-10">
          <span className="font-display text-[13px] tracking-[0.22em]">VAULT <span className="opacity-60">ASSOCIATION</span></span>
          <span className="label-sm text-steel">Admin — Restricted</span>
        </div>
        <div className="absolute inset-x-0 bottom-0 p-10">
          <p className="display-lg">The vault<br />backstage</p>
          <p className="mt-4 max-w-sm text-sm text-bone/60">Pedidos, catálogo, clientes e dados da associação em um só lugar.</p>
        </div>
      </div>
      <div className="flex flex-col justify-between px-6 py-8 sm:px-12 lg:px-20">
        <div className="flex items-center justify-between lg:justify-end">
          <span className="font-display text-[12px] tracking-[0.22em] lg:hidden">VAULT <span className="opacity-50">ASSOCIATION</span></span>
          <Link href="/" className="text-xs text-muted-foreground hover:text-foreground">← Voltar à loja</Link>
        </div>
        <div className="mx-auto w-full max-w-sm py-16">
          <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
          <p className="mt-2 text-sm text-muted-foreground">{subtitle}</p>
          <div className="mt-10">{children}</div>
        </div>
        <p className="text-xs text-muted-foreground">© Vault Association · Desenvolvido por CodeSite</p>
      </div>
    </div>
  );
}
