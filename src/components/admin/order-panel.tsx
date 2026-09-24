"use client";

import { MessageCircle } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useState, useTransition } from "react";
import { ORDER_STATUSES, type Order, type OrderItem, type OrderStatus } from "@/db/schema";
import { ORDER_STATUS_LABEL } from "@/lib/types";
import { formatCep, formatDateTime, formatPhone, formatPrice } from "@/lib/format";
import { toast } from "@/lib/client/toast-store";
import { updateOrderStatusAction } from "@/app/admin/(panel)/actions";
import { Modal } from "./modal";
import { Button, Field, Select, StatusBadge, Textarea } from "./ui";

type Detail = {
  order: Order;
  items: OrderItem[];
  history: { id: number; status: OrderStatus; note: string | null; createdAt: Date }[];
};

export function OrderPanel({ detail }: { detail: Detail | null }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [status, setStatus] = useState<OrderStatus>(detail?.order.status ?? "NOVO");
  const [note, setNote] = useState("");
  const [pending, startTransition] = useTransition();

  const close = () => {
    const next = new URLSearchParams(params.toString());
    next.delete("open");
    router.replace(`${pathname}${next.size ? `?${next}` : ""}`, { scroll: false });
  };

  if (!detail) return null;
  const { order, items, history } = detail;
  const phone = order.customerPhone.replace(/\D/g, "");
  const wa = `https://wa.me/${phone.length <= 11 ? `55${phone}` : phone}?text=${encodeURIComponent(`Olá, ${order.customerName.split(" ")[0]}! Aqui é a Vault Association sobre o seu pedido #${order.number}.`)}`;

  return (
    <Modal open onClose={close} side title={`Pedido #${order.number}`} description={`${formatDateTime(order.createdAt)} · via ${order.channel === "whatsapp" ? "WhatsApp" : "site"}`}>
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <StatusBadge status={order.status} />
          <a href={wa} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground">
            <MessageCircle className="h-4 w-4" /> Falar com o cliente
          </a>
        </div>

        <section>
          <h3 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Itens</h3>
          <ul className="mt-3 divide-y divide-border rounded-lg border border-border">
            {items.map((it) => (
              <li key={it.id} className="flex items-center gap-3 p-3">
                <span className="relative h-12 w-10 shrink-0 overflow-hidden rounded-md bg-[#ecebe6]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  {it.image && <img src={it.image} alt="" className="h-full w-full object-contain p-0.5" />}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{it.productName}</p>
                  <p className="text-xs text-muted-foreground">{[it.color, it.size].filter(Boolean).join(" · ")} · {it.sku}</p>
                </div>
                <div className="text-right text-sm tabular-nums">
                  <p>{formatPrice(it.lineTotal)}</p>
                  <p className="text-xs text-muted-foreground">{it.quantity} × {formatPrice(it.unitPrice)}</p>
                </div>
              </li>
            ))}
          </ul>
          <dl className="mt-3 space-y-1 text-sm">
            <div className="flex justify-between text-muted-foreground"><dt>Subtotal</dt><dd className="tabular-nums">{formatPrice(order.subtotal)}</dd></div>
            <div className="flex justify-between text-muted-foreground"><dt>Frete</dt><dd>{order.shipping ? formatPrice(order.shipping) : "A combinar"}</dd></div>
            <div className="flex justify-between font-semibold"><dt>Total</dt><dd className="tabular-nums">{formatPrice(order.total)}</dd></div>
          </dl>
        </section>

        <section className="grid gap-6 sm:grid-cols-2">
          <div>
            <h3 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Cliente</h3>
            <p className="mt-2 text-sm font-medium">{order.customerName}</p>
            <p className="text-sm text-muted-foreground">{order.customerEmail}</p>
            <p className="text-sm text-muted-foreground">{formatPhone(order.customerPhone)}</p>
            {order.customerId && (
              <a href={`/admin/customers/${order.customerId}`} className="mt-1 inline-block text-xs underline underline-offset-4">Ver perfil</a>
            )}
          </div>
          <div>
            <h3 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Entrega</h3>
            <p className="mt-2 text-sm leading-relaxed">
              {order.address}, {order.addressNumber}{order.complement ? ` — ${order.complement}` : ""}
              <br />
              {order.district && <>{order.district} · </>}
              {order.city}/{order.state}
              <br />
              CEP {formatCep(order.cep)}
            </p>
          </div>
          {order.notes && (
            <div className="sm:col-span-2">
              <h3 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Observações</h3>
              <p className="mt-2 rounded-md bg-muted p-3 text-sm">{order.notes}</p>
            </div>
          )}
        </section>

        <section className="rounded-lg border border-border p-4">
          <h3 className="text-sm font-semibold">Alterar status</h3>
          <div className="mt-3 grid gap-3">
            <Select value={status} onChange={(e) => setStatus(e.target.value as OrderStatus)} aria-label="Novo status">
              {ORDER_STATUSES.map((s) => <option key={s} value={s}>{ORDER_STATUS_LABEL[s]}</option>)}
            </Select>
            <Field label="Nota interna (opcional)" htmlFor="status-note">
              <Textarea id="status-note" rows={2} value={note} onChange={(e) => setNote(e.target.value)} placeholder="Ex.: código de rastreio, forma de pagamento…" className="min-h-0" />
            </Field>
            {status === "CANCELADO" && order.status !== "CANCELADO" && (
              <p className="rounded-md bg-amber-50 px-3 py-2 text-xs text-amber-800">Cancelar devolve os itens ao estoque automaticamente.</p>
            )}
            <Button
              disabled={status === order.status}
              loading={pending}
              onClick={() =>
                startTransition(async () => {
                  const res = await updateOrderStatusAction(order.id, status, note);
                  toast({ title: res.ok ? res.message ?? "Atualizado" : res.error, tone: res.ok ? "success" : "error" });
                  if (res.ok) {
                    setNote("");
                    router.refresh();
                  }
                })
              }
            >
              Salvar status
            </Button>
          </div>
        </section>

        <section>
          <h3 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Histórico</h3>
          <ol className="mt-3 space-y-4 border-l border-border pl-5">
            {history.map((h) => (
              <li key={h.id} className="relative">
                <span className="absolute -left-[25px] top-1 h-2.5 w-2.5 rounded-full border-2 border-card bg-foreground" />
                <div className="flex items-center gap-2">
                  <StatusBadge status={h.status} />
                  <span className="text-xs text-muted-foreground">{formatDateTime(h.createdAt)}</span>
                </div>
                {h.note && <p className="mt-1 text-sm text-muted-foreground">{h.note}</p>}
              </li>
            ))}
          </ol>
        </section>
      </div>
    </Modal>
  );
}
