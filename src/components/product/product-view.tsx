"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useMemo, useRef, useState, ViewTransition } from "react";
import type { ProductDetail } from "@/lib/types";
import { cart } from "@/lib/client/cart-store";
import { track } from "@/lib/client/analytics";
import { toast } from "@/lib/client/toast-store";
import { formatPrice } from "@/lib/format";
import { buildProductMessage } from "@/lib/whatsapp";
import { StatusBadge } from "@/components/store/product-card";
import { VaultButton } from "@/components/store/vault-button";
import { cn } from "@/lib/utils";
import { useClientValue } from "@/lib/client/use-client-value";

export function ProductView({ product, whatsapp, shippingNote }: { product: ProductDetail; whatsapp: string; shippingNote: string }) {
  const router = useRouter();
  const hasColors = product.colors.length > 0;
  const hasSizes = product.sizes.length > 0 && !(product.sizes.length === 1 && product.sizes[0] === "Único");

  const firstAvailable = product.variants.find((v) => v.stock > 0) ?? product.variants[0];
  const [color, setColor] = useState<string | null>(firstAvailable?.color ?? product.colors[0]?.name ?? null);
  const [size, setSize] = useState<string | null>(hasSizes ? null : (firstAvailable?.size ?? product.sizes[0] ?? null));
  const [qty, setQty] = useState(1);
  const [imageIndex, setImageIndex] = useState(0);
  const [sizeError, setSizeError] = useState(false);

  const variant = useMemo(
    () => product.variants.find((v) => (!hasColors || v.color === color) && (!hasSizes || v.size === size)),
    [product.variants, color, size, hasColors, hasSizes],
  );
  const stockFor = (s: string | null, c: string | null) =>
    product.variants.filter((v) => (!hasColors || v.color === c) && (s == null || v.size === s)).reduce((a, v) => a + v.stock, 0);
  const selectedStock = variant ? variant.stock : stockFor(size, color);
  const unitPrice = variant?.price ?? product.effectivePrice;

  useEffect(() => {
    track({ type: "product_view", productId: product.id });
  }, [product.id]);

  const selectColor = (name: string) => {
    setColor(name);
    // Colour → matching image
    const c = product.colors.find((x) => x.name === name);
    const idx = c?.image ? product.images.indexOf(c.image) : -1;
    if (idx >= 0) setImageIndex(idx);
  };
  // Quantity never exceeds the stock of the selected variation.
  const quantity = Math.max(1, Math.min(qty, Math.max(1, selectedStock)));

  const addToCart = () => {
    if (hasSizes && !size) {
      setSizeError(true);
      document.getElementById("size-picker")?.scrollIntoView({ behavior: "smooth", block: "center" });
      return false;
    }
    if (!variant || variant.stock <= 0) return false;
    cart.add(
      {
        productId: product.id,
        variantId: variant.id,
        slug: product.slug,
        name: product.name,
        image: product.colors.find((c) => c.name === color)?.image ?? product.image,
        size: variant.size,
        color: variant.color,
        unitPrice,
        maxStock: variant.stock,
      },
      quantity,
    );
    track({ type: "add_to_cart", productId: product.id, value: unitPrice * quantity });
    return true;
  };

  const origin = useClientValue(() => window.location.origin, "");
  const whatsappHref = useMemo(() => {
    if (!whatsapp) return null;
    const url = `${origin}/product/${product.slug}`;
    const text = buildProductMessage({ name: product.name, price: formatPrice(unitPrice), url, size, color: hasColors ? color : null });
    return `https://wa.me/${whatsapp.replace(/\D/g, "")}?text=${encodeURIComponent(text)}`;
  }, [whatsapp, origin, product.slug, product.name, unitPrice, size, color, hasColors]);

  const soldOut = product.stock <= 0;
  const canBuy = !soldOut && (!variant || variant.stock > 0);

  return (
    <div className="grid gap-10 md:grid-cols-12 md:gap-8">
      <Gallery product={product} index={imageIndex} onIndex={setImageIndex} />

      <div className="md:col-span-5 md:col-start-8">
        <div className="md:sticky md:top-28">
          <nav aria-label="Breadcrumb" className="label-sm flex flex-wrap items-center gap-2 text-bone/50">
            <Link href="/shop" className="hover:text-bone">Shop</Link>
            <span>/</span>
            {product.category && (
              <>
                <Link href={`/shop?category=${product.category.slug}`} className="hover:text-bone">{product.category.name}</Link>
                <span>/</span>
              </>
            )}
            <span className="text-bone/80">{product.sku}</span>
          </nav>

          <div className="mt-8 flex items-center gap-3">
            {product.label && <span className="label-sm bg-bone px-2 py-1 text-ink">{product.label}</span>}
            <StatusBadge status={product.status} className="text-bone/70" />
          </div>
          <h1 className="display-lg mt-5 text-[clamp(2rem,4.2vw,4rem)]">{product.name}</h1>
          <p className="mt-6 flex items-baseline gap-3 text-xl tabular-nums">
            {formatPrice(unitPrice)}
            {product.salePrice && !variant?.price && <span className="text-sm text-steel line-through">{formatPrice(product.price)}</span>}
            {product.salePrice && !variant?.price && (
              <span className="label-sm border border-white/25 px-2 py-1 text-bone/80">
                −{Math.round((1 - product.salePrice / product.price) * 100)}%
              </span>
            )}
          </p>
          <p className="mt-8 max-w-md text-sm leading-relaxed text-bone/65">{product.description}</p>

          {hasColors && (
            <div className="mt-10">
              <p className="label-sm text-steel">
                Cor — <span className="text-bone">{color}</span>
              </p>
              <div className="mt-4 flex flex-wrap gap-3">
                {product.colors.map((c) => {
                  const available = stockFor(size, c.name) > 0;
                  return (
                    <button
                      key={c.name}
                      type="button"
                      aria-pressed={color === c.name}
                      aria-label={`${c.name}${available ? "" : " (esgotado)"}`}
                      onClick={() => selectColor(c.name)}
                      className={cn("group relative flex h-11 items-center gap-3 border px-3 transition-colors", color === c.name ? "border-bone" : "border-white/15 hover:border-white/40", !available && "opacity-45")}
                    >
                      <span className="h-5 w-5 rounded-full border border-white/20" style={{ background: c.hex }} />
                      <span className="label">{c.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {hasSizes && (
            <div id="size-picker" className="mt-8">
              <div className="flex items-center justify-between">
                <p className="label-sm text-steel">
                  Tamanho {size && <>— <span className="text-bone">{size}</span></>}
                </p>
                {sizeError && !size && <p className="label-sm text-red-300">Selecione um tamanho</p>}
              </div>
              <div className="mt-4 grid grid-cols-4 gap-2 sm:grid-cols-5">
                {product.sizes.map((s) => {
                  const st = stockFor(s, color);
                  return (
                    <button
                      key={s}
                      type="button"
                      disabled={st <= 0}
                      aria-pressed={size === s}
                      onClick={() => {
                        setSize(s);
                        setSizeError(false);
                      }}
                      className={cn(
                        "label relative h-12 border transition-colors disabled:cursor-not-allowed",
                        size === s ? "border-bone bg-bone text-ink" : "border-white/15 hover:border-white/50",
                        st <= 0 && "text-bone/25 line-through",
                      )}
                    >
                      {s}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <div className="mt-8 flex items-center justify-between gap-6">
            <div className="flex h-12 items-center border border-white/15">
              <button type="button" aria-label="Diminuir quantidade" className="h-full w-11 text-steel hover:text-bone" onClick={() => setQty(Math.max(1, quantity - 1))}>−</button>
              <span className="w-8 text-center text-sm tabular-nums" aria-live="polite">{quantity}</span>
              <button type="button" aria-label="Aumentar quantidade" className="h-full w-11 text-steel hover:text-bone disabled:opacity-30" disabled={quantity >= selectedStock} onClick={() => setQty(Math.min(selectedStock, quantity + 1))}>+</button>
            </div>
            <p className="label-sm text-right text-steel">
              {soldOut
                ? "Esgotado"
                : hasSizes && !size
                  ? `${product.stock} unidades no total`
                  : selectedStock <= 0
                    ? "Indisponível nesta variação"
                    : selectedStock <= 3
                      ? `Últimas ${selectedStock} unidades`
                      : `${selectedStock} em estoque`}
            </p>
          </div>

          <div className="mt-6 grid gap-3">
            <VaultButton
              variant="solid"
              className="w-full"
              arrow
              disabled={!canBuy}
              onClick={() => {
                if (addToCart()) {
                  toast({
                    title: "Adicionado ao carrinho",
                    description: [product.name, [variant?.color, variant?.size].filter(Boolean).join(" · ")].filter(Boolean).join(" — "),
                    image: product.colors.find((c) => c.name === color)?.image ?? product.image,
                    action: { label: "Ver", onClick: () => cart.open() },
                  });
                }
              }}
            >
              {soldOut ? "Sold out" : "Add to cart"}
            </VaultButton>
            <VaultButton
              variant="outline"
              className="w-full"
              disabled={!canBuy}
              onClick={() => {
                if (addToCart()) {
                  track({ type: "checkout_start", value: unitPrice * quantity });
                  router.push("/checkout");
                }
              }}
            >
              Buy now
            </VaultButton>
            {whatsappHref && (
              <a href={whatsappHref} target="_blank" rel="noreferrer" className="label flex h-12 items-center justify-center gap-3 text-bone/75 transition-colors hover:text-bone">
                <WhatsAppIcon /> Contact via WhatsApp
              </a>
            )}
          </div>

          <Accordion
            items={[
              { title: "Detalhes", content: <ul className="space-y-2">{product.details.map((d) => <li key={d} className="flex gap-3"><span className="mt-2 h-px w-3 shrink-0 bg-bone/40" />{d}</li>)}</ul> },
              { title: "Envio e trocas", content: <p>{shippingNote} Trocas em até 7 dias após o recebimento, com a peça sem uso e na embalagem Vault original.</p> },
              { title: "Autenticidade", content: <p>Cada peça acompanha cartão de autenticidade numerado e é registrada no arquivo da associação.</p> },
            ]}
          />
          <p className="label-sm mt-6 text-steel">SKU {variant?.sku ?? product.sku}</p>
        </div>
      </div>

      {/* Mobile sticky purchase bar */}
      <div className="fixed inset-x-0 bottom-0 z-40 flex items-center justify-between gap-4 border-t border-white/10 bg-ink/90 px-5 py-3 backdrop-blur-xl md:hidden">
        <div className="min-w-0">
          <p className="truncate text-xs uppercase tracking-[0.08em]">{product.name}</p>
          <p className="text-sm tabular-nums text-bone/70">{formatPrice(unitPrice)}</p>
        </div>
        <button
          type="button"
          disabled={!canBuy}
          className="label h-11 shrink-0 bg-bone px-5 text-ink disabled:opacity-40"
          onClick={() => {
            if (addToCart()) toast({ title: "Adicionado ao carrinho", description: product.name, image: product.image, action: { label: "Ver", onClick: () => cart.open() } });
          }}
        >
          {soldOut ? "Sold out" : "Add to cart"}
        </button>
      </div>
    </div>
  );
}

function Gallery({ product, index, onIndex }: { product: ProductDetail; index: number; onIndex: (i: number) => void }) {
  const zoom = useRef<HTMLDivElement>(null);
  const images = product.images.length ? product.images : [];
  const current = images[index] ?? product.image;

  return (
    <div className="md:col-span-7">
      <div className="flex flex-col-reverse gap-3 md:flex-row">
        {images.length > 1 && (
          <div className="no-scrollbar flex gap-2 overflow-x-auto md:w-20 md:flex-col">
            {images.map((src, i) => (
              <button
                key={src}
                type="button"
                aria-label={`Imagem ${i + 1}`}
                aria-current={i === index}
                onClick={() => onIndex(i)}
                className={cn("relative aspect-[4/5] w-16 shrink-0 bg-bone-2 transition-opacity md:w-full", i === index ? "opacity-100 ring-1 ring-bone/60" : "opacity-50 hover:opacity-90")}
              >
                <Image src={src} alt="" fill sizes="80px" className="object-contain p-1" />
              </button>
            ))}
          </div>
        )}
        <ViewTransition name={`product-${product.slug}`} share="morph" default="none">
          <div
            className="relative aspect-[4/5] flex-1 overflow-hidden bg-bone-2"
            data-cursor="view"
            data-cursor-label="Zoom"
            onPointerMove={(e) => {
              if (e.pointerType !== "mouse" || !zoom.current) return;
              const r = e.currentTarget.getBoundingClientRect();
              zoom.current.style.transformOrigin = `${((e.clientX - r.left) / r.width) * 100}% ${((e.clientY - r.top) / r.height) * 100}%`;
              zoom.current.style.transform = "scale(1.7)";
            }}
            onPointerLeave={() => {
              if (zoom.current) zoom.current.style.transform = "scale(1)";
            }}
          >
            <div ref={zoom} className="absolute inset-0 transition-transform duration-500 ease-[var(--ease-vault)]">
              <AnimatePresence mode="popLayout" initial={false}>
                {current && (
                  <motion.div
                    key={current}
                    className="absolute inset-0"
                    initial={{ opacity: 0, filter: "blur(10px)", scale: 1.02 }}
                    animate={{ opacity: 1, filter: "blur(0px)", scale: 1 }}
                    exit={{ opacity: 0, filter: "blur(6px)" }}
                    transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
                  >
                    <Image src={current} alt={product.name} fill priority sizes="(max-width: 768px) 100vw, 58vw" className="object-contain p-[6%]" />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            <span className="label-sm absolute bottom-4 left-4 text-ink/50">
              {String(index + 1).padStart(2, "0")} / {String(Math.max(1, images.length)).padStart(2, "0")}
            </span>
          </div>
        </ViewTransition>
      </div>
    </div>
  );
}

function Accordion({ items }: { items: { title: string; content: React.ReactNode }[] }) {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <div className="mt-10 border-t border-white/10">
      {items.map((it, i) => (
        <div key={it.title} className="border-b border-white/10">
          <button type="button" aria-expanded={open === i} className="flex w-full items-center justify-between py-5 text-left" onClick={() => setOpen(open === i ? null : i)}>
            <span className="label">{it.title}</span>
            <span className={cn("text-steel transition-transform duration-500", open === i && "rotate-45")}>+</span>
          </button>
          <AnimatePresence initial={false}>
            {open === i && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }} className="overflow-hidden">
                <div className="pb-6 text-sm leading-relaxed text-bone/65">{it.content}</div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      ))}
    </div>
  );
}

export function WhatsAppIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className={className} fill="currentColor">
      <path d="M12.04 2a9.9 9.9 0 0 0-8.5 14.98L2 22l5.15-1.5A9.93 9.93 0 1 0 12.04 2Zm0 18.13a8.2 8.2 0 0 1-4.18-1.14l-.3-.18-3.06.89.9-2.98-.2-.31a8.2 8.2 0 1 1 6.84 3.72Zm4.5-6.14c-.25-.12-1.46-.72-1.69-.8-.23-.09-.39-.13-.55.12-.17.24-.64.8-.78.96-.14.17-.29.19-.53.07a6.7 6.7 0 0 1-3.34-2.92c-.25-.43.25-.4.72-1.33.08-.16.04-.3-.02-.43-.06-.12-.55-1.33-.76-1.82-.2-.48-.4-.41-.55-.42h-.47a.9.9 0 0 0-.65.3 2.73 2.73 0 0 0-.85 2.03 4.74 4.74 0 0 0 1 2.52 10.84 10.84 0 0 0 4.15 3.67c1.55.67 2.16.72 2.93.61.47-.07 1.46-.6 1.66-1.18.21-.58.21-1.07.15-1.18-.06-.1-.22-.16-.47-.28Z" />
    </svg>
  );
}
