"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { useEffect } from "react";
import { cart, useCart } from "@/lib/client/cart-store";
import { track } from "@/lib/client/analytics";
import { formatPrice } from "@/lib/format";
import { getLenis } from "./smooth-scroll";
import { VaultButton } from "./vault-button";

export function CartDrawer({ shippingNote }: { shippingNote?: string }) {
  const { items, open, subtotal, count } = useCart();
  const router = useRouter();

  useEffect(() => {
    const l = getLenis();
    if (open) l?.stop();
    else l?.start();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && cart.close();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[120]" role="dialog" aria-modal="true" aria-label="Carrinho">
          <motion.button
            type="button"
            aria-label="Fechar carrinho"
            className="absolute inset-0 bg-black/55 backdrop-blur-[3px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            onClick={() => cart.close()}
            data-cursor="hide"
          />
          <motion.aside
            className="absolute right-0 top-0 flex h-full w-full max-w-[480px] flex-col bg-graphite text-bone shadow-[0_0_80px_rgba(0,0,0,0.6)]"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ duration: 0.75, ease: [0.22, 1, 0.36, 1] }}
            data-lenis-prevent
          >
            <div className="flex items-center justify-between border-b border-white/10 px-6 py-6 md:px-8">
              <div className="flex items-baseline gap-3">
                <h2 className="font-display text-sm uppercase tracking-[0.2em]">Your Vault</h2>
                <span className="label-sm text-steel">{String(count).padStart(2, "0")} items</span>
              </div>
              <button type="button" onClick={() => cart.close()} className="label text-steel transition-colors hover:text-bone">
                Close
              </button>
            </div>

            {items.length === 0 ? (
              <div className="flex flex-1 flex-col items-center justify-center gap-8 px-8 text-center">
                <div className="relative h-24 w-32 border border-white/10">
                  <div className="absolute inset-x-3 top-3 h-px bg-white/15" />
                  <div className="absolute left-1/2 top-1/2 h-4 w-8 -translate-x-1/2 -translate-y-1/2 border border-white/25" />
                </div>
                <div>
                  <p className="display-md text-[1.6rem]">The vault is empty</p>
                  <p className="mt-3 text-sm text-steel">Nenhuma peça guardada ainda. Explore o arquivo atual.</p>
                </div>
                <VaultButton
                  variant="outline"
                  arrow
                  onClick={() => {
                    cart.close();
                    router.push("/shop");
                  }}
                >
                  Explore the collection
                </VaultButton>
              </div>
            ) : (
              <>
                <ul className="flex-1 divide-y divide-white/10 overflow-y-auto px-6 md:px-8">
                  <AnimatePresence initial={false}>
                    {items.map((item) => (
                      <motion.li
                        key={item.key}
                        layout
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, x: 40, transition: { duration: 0.3 } }}
                        className="flex gap-5 py-6"
                      >
                        <Link href={`/product/${item.slug}`} onClick={() => cart.close()} className="relative h-[120px] w-24 shrink-0 bg-bone-3">
                          {item.image && <Image src={item.image} alt={item.name} fill sizes="96px" className="object-contain p-1.5" />}
                        </Link>
                        <div className="flex min-w-0 flex-1 flex-col">
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <Link href={`/product/${item.slug}`} onClick={() => cart.close()} className="block truncate text-sm uppercase tracking-[0.08em]">
                                {item.name}
                              </Link>
                              <p className="label-sm mt-1.5 text-steel">{[item.color, item.size].filter(Boolean).join(" · ")}</p>
                            </div>
                            <p className="text-sm tabular-nums">{formatPrice(item.unitPrice * item.quantity)}</p>
                          </div>
                          <div className="mt-auto flex items-center justify-between pt-4">
                            <div className="flex h-9 items-center border border-white/15">
                              <button
                                type="button"
                                aria-label="Diminuir quantidade"
                                className="h-full w-9 text-steel transition-colors hover:text-bone"
                                onClick={() => cart.setQuantity(item.key, item.quantity - 1)}
                              >
                                −
                              </button>
                              <span className="w-8 text-center text-xs tabular-nums">{item.quantity}</span>
                              <button
                                type="button"
                                aria-label="Aumentar quantidade"
                                className="h-full w-9 text-steel transition-colors hover:text-bone disabled:opacity-30"
                                disabled={item.quantity >= item.maxStock}
                                onClick={() => cart.setQuantity(item.key, item.quantity + 1)}
                              >
                                +
                              </button>
                            </div>
                            <button type="button" className="label-sm text-steel underline-offset-4 transition-colors hover:text-bone hover:underline" onClick={() => cart.remove(item.key)}>
                              Remove
                            </button>
                          </div>
                          {item.quantity >= item.maxStock && <p className="label-sm mt-2 text-silver/70">Máximo disponível em estoque</p>}
                        </div>
                      </motion.li>
                    ))}
                  </AnimatePresence>
                </ul>
                <div className="border-t border-white/10 px-6 py-6 md:px-8">
                  <dl className="space-y-2 text-sm">
                    <div className="flex justify-between text-steel">
                      <dt>Subtotal</dt>
                      <dd className="tabular-nums">{formatPrice(subtotal)}</dd>
                    </div>
                    <div className="flex justify-between text-steel">
                      <dt>Frete</dt>
                      <dd>A combinar</dd>
                    </div>
                    <div className="flex justify-between pt-2 text-base">
                      <dt className="uppercase tracking-[0.12em]">Total</dt>
                      <dd className="tabular-nums">{formatPrice(subtotal)}</dd>
                    </div>
                  </dl>
                  {shippingNote && <p className="mt-3 text-xs text-steel">{shippingNote}</p>}
                  <div className="mt-6 grid gap-3">
                    <VaultButton
                      variant="solid"
                      arrow
                      className="w-full"
                      onClick={() => {
                        track({ type: "checkout_start", value: subtotal });
                        cart.close();
                        router.push("/checkout");
                      }}
                    >
                      Finalizar pedido
                    </VaultButton>
                    <VaultButton variant="outline" className="w-full" onClick={() => cart.close()}>
                      Continuar comprando
                    </VaultButton>
                  </div>
                </div>
              </>
            )}
          </motion.aside>
        </div>
      )}
    </AnimatePresence>
  );
}
