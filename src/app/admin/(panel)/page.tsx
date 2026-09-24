import Link from "next/link";
import { ArrowUpRight, TriangleAlert } from "lucide-react";
import { requireAdmin } from "@/lib/auth/session";
import { resolveRange } from "@/lib/analytics-range";
import { getCatalogCounts, getKpis, getLowStock, getRecentOrders, getSeries, getTopProducts } from "@/lib/data/analytics";
import { formatDate, formatDateTime, formatNumber, formatPercent, formatPrice, } from "@/lib/format";
import { Badge, Card, CardHeader, EmptyState, PageHeader, StatusBadge, buttonClass } from "@/components/admin/ui";
import { AreaChart, BarList, ColumnChart } from "@/components/admin/charts";
import { RangeTabs, StatTile } from "@/components/admin/blocks";

export const metadata = { title: "Dashboard" };

export default async function DashboardPage(props: PageProps<"/admin">) {
  const user = await requireAdmin();
  const sp = await props.searchParams;
  const range = resolveRange(typeof sp.range === "string" ? sp.range : "30d");
  const [kpis, series, top, low, recent, counts] = await Promise.all([
    getKpis(range),
    getSeries(range),
    getTopProducts(range, 6),
    getLowStock(3, 8),
    getRecentOrders(7),
    getCatalogCounts(),
  ]);
  const { current: c, deltas: d } = kpis;
  const label = (iso: string) => formatDate(`${iso}T12:00:00-03:00`, { day: "2-digit", month: "short" }).replace(".", "");
  const points = series.points.map((p) => ({ key: p.date, label: label(p.date), value: p.revenue }));
  const orderPoints = series.points.map((p) => ({ key: p.date, label: label(p.date), value: p.orders }));
  const hour = Number(new Intl.DateTimeFormat("pt-BR", { hour: "numeric", hour12: false, timeZone: "America/Sao_Paulo" }).format(new Date()));
  const greeting = hour < 12 ? "Bom dia" : hour < 18 ? "Boa tarde" : "Boa noite";

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow={formatDate(new Date(), { weekday: "long", day: "2-digit", month: "long" })}
        title={`${greeting}, ${user.name.split(" ")[0]}`}
        description="Visão geral da loja no período selecionado, comparada ao período anterior de mesma duração."
        actions={<RangeTabs current={range.preset} basePath="/admin" />}
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatTile hero label="Faturamento" value={formatPrice(c.revenue)} delta={d.revenue} hint={`${formatNumber(c.validOrders)} pedidos válidos`} />
        <StatTile label="Pedidos" value={formatNumber(c.validOrders)} delta={d.orders} hint={c.cancelled ? `${c.cancelled} cancelados` : "Nenhum cancelado"} spark={orderPoints.map((p) => p.value)} />
        <StatTile label="Ticket médio" value={formatPrice(c.avgTicket)} delta={d.avgTicket} hint="Faturamento ÷ pedidos válidos" />
        <StatTile label="Conversão" value={formatPercent(c.conversion)} delta={d.conversion} hint={`${formatNumber(c.sessions)} sessões`} spark={series.points.map((p) => p.sessions)} />
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        <StatTile label="Clientes" value={formatNumber(counts.customers)} hint={`${c.newCustomers} novos no período`} delta={d.newCustomers} />
        <StatTile label="Produtos ativos" value={`${counts.activeProducts} / ${counts.products}`} hint={counts.soldOut ? `${counts.soldOut} esgotados` : "Nenhum esgotado"} />
        <StatTile label="Compradores no período" value={formatNumber(c.buyers)} hint="Clientes com pedido no período" />
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader title="Faturamento" description={`${series.bucket === "week" ? "Por semana" : "Por dia"} · exclui pedidos cancelados`} action={<Link href={`/admin/analytics?range=${range.preset}`} className={buttonClass({ variant: "ghost", size: "sm" })}>Analytics <ArrowUpRight /></Link>} />
          <div className="pt-4">
            <AreaChart data={points} format="price" axisFormat="priceCompact" valueLabel="Faturamento" />
          </div>
        </Card>
        <Card>
          <CardHeader title="Pedidos" description={series.bucket === "week" ? "Por semana" : "Por dia"} />
          <div className="pt-4">
            <ColumnChart data={orderPoints} format="orders" valueLabel="Pedidos" height={240} />
          </div>
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <Card>
          <CardHeader title="Mais vendidos" description="Unidades no período" />
          <BarList
            items={top.map((t) => ({ key: String(t.productId ?? t.name), label: t.name, value: t.units, sub: formatPrice(t.revenue), image: t.image }))}
            format="units"
          />
        </Card>
        <Card>
          <CardHeader
            title="Estoque baixo"
            description="Variações com 3 unidades ou menos"
            action={<Link href="/admin/products?status=low-stock" className={buttonClass({ variant: "ghost", size: "sm" })}>Ver todos</Link>}
          />
          {low.length === 0 ? (
            <EmptyState title="Estoque saudável" description="Nenhuma variação abaixo do limite." />
          ) : (
            <ul className="divide-y divide-border">
              {low.map((l) => (
                <li key={l.sku} className="flex items-center gap-3 px-5 py-3">
                  <span className="relative h-9 w-9 shrink-0 overflow-hidden rounded-md bg-[#ecebe6]">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    {l.image && <img src={l.image} alt="" className="h-full w-full object-contain p-0.5" />}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13px]">{l.name}</p>
                    <p className="text-[11px] text-muted-foreground">{l.variant || "Único"} · {l.sku}</p>
                  </div>
                  {l.stock <= 0 ? (
                    <Badge tone="danger"><TriangleAlert className="h-3 w-3" /> Esgotado</Badge>
                  ) : (
                    <Badge tone="warning">{l.stock} un.</Badge>
                  )}
                </li>
              ))}
            </ul>
          )}
        </Card>
        <Card>
          <CardHeader title="Pedidos recentes" action={<Link href="/admin/orders" className={buttonClass({ variant: "ghost", size: "sm" })}>Ver todos</Link>} />
          {recent.length === 0 ? (
            <EmptyState title="Nenhum pedido ainda" description="Os pedidos feitos no site aparecem aqui automaticamente." />
          ) : (
            <ul className="divide-y divide-border">
              {recent.map((o) => (
                <li key={o.id}>
                  <Link href={`/admin/orders?open=${o.id}`} className="flex items-center gap-3 px-5 py-3 transition-colors hover:bg-muted/50">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[13px] font-medium">#{o.number} · {o.customerName}</p>
                      <p className="text-[11px] text-muted-foreground">{formatDateTime(o.createdAt)} · {o.itemCount} {o.itemCount === 1 ? "item" : "itens"}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[13px] font-semibold tabular-nums">{formatPrice(o.total)}</p>
                      <StatusBadge status={o.status} className="mt-1" />
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  );
}
