import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft, MessageCircle } from "lucide-react";
import { requireAdmin } from "@/lib/auth/session";
import { getCustomerDetail } from "@/lib/data/customers";
import { formatCep, formatDate, formatDateTime, formatPhone, formatPrice } from "@/lib/format";
import { Card, CardHeader, EmptyState, PageHeader, StatusBadge, buttonClass } from "@/components/admin/ui";
import { StatTile } from "@/components/admin/blocks";

export const metadata = { title: "Cliente" };

export default async function CustomerPage(props: PageProps<"/admin/customers/[id]">) {
  await requireAdmin();
  const { id } = await props.params;
  const data = await getCustomerDetail(Number(id));
  if (!data) notFound();
  const { customer: c, orders, stats } = data;
  const phone = c.phone.replace(/\D/g, "");

  return (
    <div className="space-y-6">
      <Link href="/admin/customers" className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"><ChevronLeft className="h-3.5 w-3.5" /> Clientes</Link>
      <PageHeader
        eyebrow={`Cliente desde ${formatDate(c.createdAt)}`}
        title={c.name}
        description={`${c.email} · ${formatPhone(c.phone)}`}
        actions={
          phone ? (
            <a href={`https://wa.me/${phone.length <= 11 ? `55${phone}` : phone}`} target="_blank" rel="noreferrer" className={buttonClass({ variant: "outline" })}>
              <MessageCircle /> WhatsApp
            </a>
          ) : null
        }
      />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatTile hero label="Total gasto" value={formatPrice(stats.spent)} hint="Exclui pedidos cancelados" />
        <StatTile label="Pedidos" value={String(stats.orderCount)} hint={stats.orderCount > 1 ? "Cliente recorrente" : "Primeira compra"} />
        <StatTile label="Ticket médio" value={formatPrice(stats.avgTicket)} />
        <StatTile label="Última compra" value={stats.lastOrder ? formatDate(stats.lastOrder, { day: "2-digit", month: "short" }) : "—"} hint={stats.firstOrder ? `Primeira em ${formatDate(stats.firstOrder)}` : undefined} />
      </div>
      <div className="grid gap-4 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader title="Histórico de pedidos" description={`${orders.length} ${orders.length === 1 ? "pedido" : "pedidos"}`} />
          {orders.length === 0 ? (
            <EmptyState title="Sem pedidos" />
          ) : (
            <ul className="divide-y divide-border">
              {orders.map((o) => (
                <li key={o.id}>
                  <Link href={`/admin/orders?open=${o.id}`} className="flex flex-col gap-2 px-5 py-4 transition-colors hover:bg-muted/40 sm:flex-row sm:items-center">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-medium">#{o.number}</p>
                        <StatusBadge status={o.status} />
                      </div>
                      <p className="mt-1 truncate text-sm text-muted-foreground">{o.items.map((i) => `${i.quantity}× ${i.productName}${i.size ? ` (${i.size})` : ""}`).join(", ")}</p>
                    </div>
                    <div className="text-left sm:text-right">
                      <p className="font-semibold tabular-nums">{formatPrice(o.total)}</p>
                      <p className="text-xs text-muted-foreground">{formatDateTime(o.createdAt)}</p>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>
        <div className="space-y-4">
          <Card>
            <CardHeader title="Endereço" />
            <p className="px-5 py-4 text-sm leading-relaxed">
              {c.address ? (
                <>
                  {c.address}, {c.number}{c.complement ? ` — ${c.complement}` : ""}<br />
                  {c.district && <>{c.district}<br /></>}
                  {c.city}/{c.state}<br />
                  {c.cep && `CEP ${formatCep(c.cep)}`}
                </>
              ) : (
                <span className="text-muted-foreground">Não informado</span>
              )}
            </p>
          </Card>
          <Card>
            <CardHeader title="Produtos favoritos" description="Mais unidades compradas" />
            <ul className="space-y-2 px-5 py-4 text-sm">
              {stats.favorite.length ? stats.favorite.map(([name, qty]) => (
                <li key={name} className="flex justify-between gap-3"><span className="truncate">{name}</span><span className="tabular-nums text-muted-foreground">{qty} un.</span></li>
              )) : <li className="text-muted-foreground">—</li>}
            </ul>
          </Card>
        </div>
      </div>
    </div>
  );
}
