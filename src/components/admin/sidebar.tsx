"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import {
  ChartColumn,
  ExternalLink,
  LayoutDashboard,
  LogOut,
  Menu,
  Package,
  Settings,
  ShoppingBag,
  Tags,
  Users,
  X,
} from "lucide-react";
import { logoutAction } from "@/app/admin/auth-actions";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { href: "/admin/orders", label: "Pedidos", icon: ShoppingBag },
  { href: "/admin/products", label: "Produtos", icon: Package },
  { href: "/admin/categories", label: "Categorias", icon: Tags },
  { href: "/admin/customers", label: "Clientes", icon: Users },
  { href: "/admin/analytics", label: "Analytics", icon: ChartColumn },
  { href: "/admin/settings", label: "Configurações", icon: Settings },
];

type Props = { user: { name: string; email: string }; newOrders: number };

function NavList({ pathname, newOrders, onNavigate }: { pathname: string; newOrders: number; onNavigate?: () => void }) {
  return (
    <nav className="flex flex-col gap-0.5" aria-label="Administração">
      {NAV.map((n) => {
        const active = n.exact ? pathname === n.href : pathname.startsWith(n.href);
        const Icon = n.icon;
        return (
          <Link
            key={n.href}
            href={n.href}
            onClick={onNavigate}
            aria-current={active ? "page" : undefined}
            className={cn(
              "group relative flex items-center gap-3 rounded-md px-3 py-2 text-[13px] transition-colors",
              active ? "bg-white/10 text-white" : "text-white/55 hover:bg-white/5 hover:text-white",
            )}
          >
            {active && <span className="absolute inset-y-2 left-0 w-0.5 rounded-full bg-white" />}
            <Icon className="h-4 w-4" strokeWidth={1.6} />
            {n.label}
            {n.href === "/admin/orders" && newOrders > 0 && (
              <span className="ml-auto rounded-full bg-white px-1.5 text-[10px] font-semibold text-black tabular-nums">{newOrders}</span>
            )}
          </Link>
        );
      })}
    </nav>
  );
}

function Brand() {
  return (
    <Link href="/admin" className="block px-3">
      <span className="font-display text-[12px] tracking-[0.22em] text-white">VAULT <span className="text-white/45">ASSOCIATION</span></span>
      <span className="label-sm mt-1.5 block text-white/35">Admin console</span>
    </Link>
  );
}

function UserBlock({ user }: { user: Props["user"] }) {
  return (
    <div className="space-y-1 border-t border-white/10 pt-4">
      <Link href="/" target="_blank" className="flex items-center gap-3 rounded-md px-3 py-2 text-[13px] text-white/55 hover:bg-white/5 hover:text-white">
        <ExternalLink className="h-4 w-4" strokeWidth={1.6} /> Ver loja
      </Link>
      <form action={logoutAction}>
        <button type="submit" className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-[13px] text-white/55 hover:bg-white/5 hover:text-white">
          <LogOut className="h-4 w-4" strokeWidth={1.6} /> Sair
        </button>
      </form>
      <div className="flex items-center gap-3 px-3 pt-3">
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-xs font-semibold text-white">
          {user.name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase()}
        </span>
        <div className="min-w-0">
          <p className="truncate text-xs font-medium text-white">{user.name}</p>
          <p className="truncate text-[11px] text-white/45">{user.email}</p>
        </div>
      </div>
    </div>
  );
}

export function AdminSidebar({ user, newOrders }: Props) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [lastPath, setLastPath] = useState(pathname);
  if (lastPath !== pathname) {
    setLastPath(pathname);
    setOpen(false);
  }

  return (
    <>
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-60 flex-col justify-between bg-neutral-950 px-3 py-6 lg:flex">
        <div className="space-y-8">
          <Brand />
          <NavList pathname={pathname} newOrders={newOrders} />
        </div>
        <UserBlock user={user} />
      </aside>

      <header className="sticky top-0 z-40 flex h-14 items-center justify-between bg-neutral-950 px-4 text-white lg:hidden">
        <span className="font-display text-[11px] tracking-[0.22em]">VAULT <span className="text-white/45">ADMIN</span></span>
        <button type="button" onClick={() => setOpen(true)} aria-label="Abrir menu" className="rounded-md p-2 hover:bg-white/10">
          <Menu className="h-5 w-5" />
        </button>
      </header>
      <AnimatePresence>
        {open && (
          <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="Menu">
            <motion.div className="absolute inset-0 bg-black/50" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setOpen(false)} />
            <motion.aside
              className="absolute inset-y-0 left-0 flex w-72 flex-col justify-between bg-neutral-950 px-3 py-6"
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            >
              <div className="space-y-8">
                <div className="flex items-start justify-between">
                  <Brand />
                  <button type="button" onClick={() => setOpen(false)} aria-label="Fechar menu" className="rounded-md p-1.5 text-white/70 hover:bg-white/10">
                    <X className="h-5 w-5" />
                  </button>
                </div>
                <NavList pathname={pathname} newOrders={newOrders} onNavigate={() => setOpen(false)} />
              </div>
              <UserBlock user={user} />
            </motion.aside>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
