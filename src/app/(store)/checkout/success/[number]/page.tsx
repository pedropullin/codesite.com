import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { getOrderForCustomer } from "@/lib/data/orders";
import { getSettings, whatsappLink } from "@/lib/data/settings";
import { buildOrderMessage } from "@/lib/whatsapp";
import { formatCep, formatDateTime, formatPhone, formatPrice } from "@/lib/format";
import { ORDER_STATUS_LABEL } from "@/lib/types";
import { VaultLink } from "@/components/store/vault-button";
import { TextReveal } from "@/components/store/reveal";
import { AutoOpen } from "./auto-open";

export const metadata: Metadata = { title: "Pedido recebido", robots: { index: false } };
export const dynamic = "force-dynamic";

export default async function SuccessPage(props: PageProps<"/checkout/success/[number]">) {
  const { number } = await props.params;
  const sp = await props.searchParams;
  const token = typeof sp.t === "string" ? sp.t : "";
  const data = await getOrderForCustomer(Number(number), token);
  if (!data) notFound();
  const { order, items } = data;
  const settings = await getSettings();
  const message = buildOrderMessage({
    number: order.number,
    brand: settings.brand.name,
    customer: { name: order.customerName, email: order.customerEmail, phone: order.customerPhone },
    address: { cep: order.cep, address: order.address, number: order.addressNumber, complement: order.complement, district: order.district, city: order.city, state: order.state },
    items: items.map((i) => ({ name: i.productName, size: i.size, color: i.color, quantity: i.quantity, unitPrice: i.unitPrice, lineTotal: i.lineTotal, sku: i.sku })),
    subtotal: order.subtotal,
    shipping: order.shipping,
    total: order.total,
    notes: order.notes,
    shippingNote: settings.texts.shippingNote,
  });
  const wa = whatsappLink(settings.contact.whatsapp, message);

  return (
    <div className="min-h-dvh bg-ink text-bone">
      {sp.wa === "1" && <AutoOpen href={wa} />}
      <div className="mx-auto max-w-[1200px] px-5 pb-28 pt-32 md:px-10 md:pt-40">
        <p className="label text-steel">Order received — {formatDateTime(order.createdAt)}</p>
        <TextReveal as="h1" text={`N° ${order.number}`} className="display-xl mt-6 block" />
        <p className="mt-8 max-w-xl text-lg leading-relaxed text-bone/75">
          Obrigado, {order.customerName.split(" ")[0]}. Seu pedido foi registrado no Vault. Nosso concierge confirmará pagamento, frete e prazo pelo WhatsApp {formatPhone(order.customerPhone)}.
        </p>
        <div className="mt-10 flex flex-wrap gap-3">
          <VaultLink href={wa} variant="solid" arrow target="_blank" rel="noreferrer">
            Enviar pedido via WhatsApp
          </VaultLink>
          <VaultLink href="/shop" variant="outline">Continuar comprando</VaultLink>
        </div>

        <div className="mt-20 grid gap-10 border-t border-white/10 pt-12 md:grid-cols-12">
          <div className="md:col-span-7">
            <p className="label-sm text-steel">Itens</p>
            <ul className="mt-6 divide-y divide-white/10">
              {items.map((it) => (
                <li key={it.id} className="flex items-center gap-5 py-5">
                  <div className="relative h-24 w-20 shrink-0 bg-bone-3">
                    {it.image && <Image src={it.image} alt={it.productName} fill sizes="80px" className="object-contain p-1.5" />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm uppercase tracking-[0.08em]">{it.productName}</p>
                    <p className="label-sm mt-1.5 text-steel">{[it.color, it.size].filter(Boolean).join(" · ")} — SKU {it.sku}</p>
                    <p className="label-sm mt-1.5 text-steel">{it.quantity} × {formatPrice(it.unitPrice)}</p>
                  </div>
                  <p className="tabular-nums">{formatPrice(it.lineTotal)}</p>
                </li>
              ))}
            </ul>
          </div>
          <div className="space-y-8 md:col-span-4 md:col-start-9">
            <div>
              <p className="label-sm text-steel">Status</p>
              <p className="mt-3 inline-flex items-center gap-2 text-sm"><span className="h-1.5 w-1.5 rounded-full bg-bone" />{ORDER_STATUS_LABEL[order.status]}</p>
            </div>
            <div>
              <p className="label-sm text-steel">Entrega</p>
              <p className="mt-3 text-sm leading-relaxed text-bone/80">
                {order.address}, {order.addressNumber}{order.complement ? ` — ${order.complement}` : ""}<br />
                {order.district && <>{order.district}<br /></>}
                {order.city}/{order.state} — CEP {formatCep(order.cep)}
              </p>
            </div>
            <dl className="space-y-2 border-t border-white/10 pt-6 text-sm">
              <div className="flex justify-between text-steel"><dt>Subtotal</dt><dd className="tabular-nums">{formatPrice(order.subtotal)}</dd></div>
              <div className="flex justify-between text-steel"><dt>Frete</dt><dd>{order.shipping ? formatPrice(order.shipping) : "A combinar"}</dd></div>
              <div className="flex justify-between pt-2 text-lg"><dt className="uppercase tracking-[0.1em]">Total</dt><dd className="tabular-nums">{formatPrice(order.total)}</dd></div>
            </dl>
          </div>
        </div>
      </div>
    </div>
  );
}
