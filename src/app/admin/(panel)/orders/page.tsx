import Link from "next/link";
import { ORDER_STATUSES, type OrderStatus } from "@/db/schema";
import { requireAdmin } from "@/lib/auth/session";
import { getOrderDetail, listOrders } from "@/lib/data/orders";
import { ORDER_STATUS_LABEL } from "@/lib/types";
import { formatDateTime, formatPrice } from "@/lib/format";
import { Card, EmptyState, Input, PageHeader, StatusBadge, buttonClass } from "@/components/admin/ui";
import { OrderPanel } from "@/components/admin/order-panel";
import { cn } from "@/lib/utils";

export const metadata = { title: "Pedidos" };

export default async function OrdersPage(props: PageProps<"/admin/orders">) {
  await requireAdmin();
  const sp = await props.searchParams;
  const status = (typeof sp.status === "string" && (ORDER_STATUSES as readonly string[]).includes(sp.status) ? sp.status : "ALL") as OrderStatus | "ALL";
  const q = typeof sp.q === "string" ? sp.q : "";
  const page = Math.max(1, Number(sp.page) || 1);
  const openId = Number(sp.open) || 0;
  const [data, detail] = await Promise.all([listOrders({ status, q, page, pageSize: 20 }), openId ? getOrderDetail(openId) : Promise.resolve(null)]);
  const pages = Math.max(1, Math.ceil(data.total / data.pageSize));
  const all = Object.values(data.statusCounts).reduce((a, b) => a + (b ?? 0), 0);
  const href = (patch: Record<string, string | number | undefined>) => {
    const p = new URLSearchParams();
    const merged = { status: status === "ALL" ? undefined : status, q: q || undefined, page: page > 1 ? page : undefined, ...patch };
    Object.entries(merged).forEach(([k, v]) => v !== undefined && v !== "" && p.set(k, String(v)));
    return `/admin/orders${p.size ? `?${p}` : ""}`;
  };

  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Vendas" title="Pedidos" description="Pedidos feitos no site aparecem aqui automaticamente. Clique em um pedido para ver detalhes e alterar o status." />

      <div className="no-scrollbar -mx-1 flex gap-1 overflow-x-auto px-1">
        {[{ v: "ALL", l: "Todos", n: all }, ...ORDER_STATUSES.map((s) => ({ v: s, l: ORDER_STATUS_LABEL[s], n: data.statusCounts[s] ?? 0 }))].map((t) => (
          <Link
            key={t.v}
            href={href({ status: t.v === "ALL" ? undefined : t.v, page: undefined })}
            className={cn("inline-flex shrink-0 items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors", status === t.v ? "border-foreground bg-foreground text-background" : "border-border bg-card text-muted-foreground hover:text-foreground")}
          >
            {t.l}
            <span className={cn("tabular-nums", status === t.v ? "text-background/70" : "text-muted-foreground/70")}>{t.n}</span>
          </Link>
        ))}
      </div>

      <Card>
        <form className="flex gap-2 border-b border-border p-4" action="/admin/orders">
          {status !== "ALL" && <input type="hidden" name="status" value={status} />}
          <Input name="q" defaultValue={q} placeholder="Buscar por nº, cliente ou e-mail" className="md:w-80" aria-label="Buscar pedidos" />
          <button type="submit" className={buttonClass({ variant: "outline" })}>Buscar</button>
        </form>
        {data.rows.length === 0 ? (
          <EmptyState title="Nenhum pedido encontrado" description={q || status !== "ALL" ? "Ajuste a busca ou o filtro de status." : "Quando um cliente finalizar uma compra, o pedido aparece aqui."} />
        ) : (
          <>
          <ul className="divide-y divide-border md:hidden">
            {data.rows.map((o) => (
              <li key={o.id}>
                <Link href={href({ open: o.id })} scroll={false} className="block px-4 py-3 active:bg-muted/60">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">#{o.number} · {o.customerName}</p>
                      <p className="mt-0.5 truncate text-xs text-muted-foreground">{o.items.map((i) => `${i.quantity}× ${i.productName}`).join(", ")}</p>
                    </div>
                    <p className="shrink-0 text-sm font-semibold tabular-nums">{formatPrice(o.total)}</p>
                  </div>
                  <div className="mt-2 flex items-center justify-between gap-3">
                    <span className="text-xs text-muted-foreground">{formatDateTime(o.createdAt)}</span>
                    <StatusBadge status={o.status} />
                  </div>
                </Link>
              </li>
            ))}
          </ul>
          <div className="hidden overflow-x-auto md:block">
            <table className="w-full min-w-[820px] text-sm">
              <thead className="border-b border-border text-left text-xs text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 font-medium">Nº</th>
                  <th className="px-4 py-3 font-medium">Cliente</th>
                  <th className="px-4 py-3 font-medium">Data</th>
                  <th className="px-4 py-3 font-medium">Produtos</th>
                  <th className="px-4 py-3 text-right font-medium">Total</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {data.rows.map((o) => (
                  <tr key={o.id} className="group transition-colors hover:bg-muted/40">
                    <td className="px-4 py-3 font-medium">
                      <Link href={href({ open: o.id })} scroll={false} className="after:absolute after:inset-0 relative">#{o.number}</Link>
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-medium">{o.customerName}</p>
                      <p className="text-xs text-muted-foreground">{o.customerEmail}</p>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{formatDateTime(o.createdAt)}</td>
                    <td className="max-w-[260px] px-4 py-3">
                      <p className="truncate">{o.items.map((i) => `${i.quantity}× ${i.productName}`).join(", ")}</p>
                      <p className="text-xs text-muted-foreground">{o.channel === "whatsapp" ? "via WhatsApp" : "via site"}</p>
                    </td>
                    <td className="px-4 py-3 text-right font-medium tabular-nums">{formatPrice(o.total)}</td>
                    <td className="px-4 py-3"><StatusBadge status={o.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          </>
        )}
        {pages > 1 && (
          <div className="flex items-center justify-between border-t border-border px-4 py-3 text-xs text-muted-foreground">
            <span>Página {page} de {pages} · {data.total} pedidos</span>
            <div className="flex gap-2">
              <Link aria-disabled={page <= 1} href={href({ page: Math.max(1, page - 1) })} className={cn(buttonClass({ variant: "outline", size: "sm" }), page <= 1 && "pointer-events-none opacity-40")}>Anterior</Link>
              <Link aria-disabled={page >= pages} href={href({ page: Math.min(pages, page + 1) })} className={cn(buttonClass({ variant: "outline", size: "sm" }), page >= pages && "pointer-events-none opacity-40")}>Próxima</Link>
            </div>
          </div>
        )}
      </Card>
      <OrderPanel key={detail ? `${detail.order.id}-${detail.order.status}-${detail.history.length}` : "none"} detail={detail} />
    </div>
  );
}
