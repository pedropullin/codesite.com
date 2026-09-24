import { requireAdmin } from "@/lib/auth/session";
import { isoDay, resolveRange } from "@/lib/analytics-range";
import { getCustomerMix, getFunnel, getKpis, getMostViewed, getSeries, getTopCategories, getTopProducts } from "@/lib/data/analytics";
import { formatDate, formatNumber, formatPercent, formatPrice, } from "@/lib/format";
import { Card, CardHeader, Input, PageHeader, buttonClass } from "@/components/admin/ui";
import { AreaChart, BarList, ColumnChart } from "@/components/admin/charts";
import { RangeTabs, StatTile } from "@/components/admin/blocks";

export const metadata = { title: "Analytics" };

export default async function AnalyticsPage(props: PageProps<"/admin/analytics">) {
  await requireAdmin();
  const sp = await props.searchParams;
  const str = (v: unknown) => (typeof v === "string" ? v : undefined);
  const range = resolveRange(str(sp.range), str(sp.from), str(sp.to));
  const [kpis, series, top, viewed, cats, mix, funnel] = await Promise.all([
    getKpis(range),
    getSeries(range),
    getTopProducts(range, 8),
    getMostViewed(range, 8),
    getTopCategories(range),
    getCustomerMix(range),
    getFunnel(range),
  ]);
  const { current: c, deltas: d } = kpis;
  const label = (iso: string) => formatDate(`${iso}T12:00:00-03:00`, { day: "2-digit", month: "short" }).replace(".", "");
  const periodLabel = `${formatDate(range.start)} — ${formatDate(range.end)}`;
  const buyers = mix.newBuyers + mix.recurring;
  const funnelTop = funnel[0]?.value || 1;

  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Dados" title="Analytics" description={`Métricas calculadas a partir das visitas, carrinhos e pedidos reais da loja · ${periodLabel}`} />

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <RangeTabs current={range.preset === "custom" || str(sp.range) === "custom" ? "custom" : range.preset} basePath="/admin/analytics" allowCustom />
        <form action="/admin/analytics" className="flex flex-wrap items-center gap-2">
          <input type="hidden" name="range" value="custom" />
          <label className="sr-only" htmlFor="from">De</label>
          <Input id="from" type="date" name="from" defaultValue={isoDay(range.start)} className="h-9 w-40 text-xs" />
          <span className="text-xs text-muted-foreground">até</span>
          <label className="sr-only" htmlFor="to">Até</label>
          <Input id="to" type="date" name="to" defaultValue={isoDay(range.end)} className="h-9 w-40 text-xs" />
          <button type="submit" className={buttonClass({ variant: "outline", size: "sm", className: "h-9" })}>Aplicar período</button>
        </form>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatTile hero label="Faturamento" value={formatPrice(c.revenue)} delta={d.revenue} hint="vs período anterior" />
        <StatTile label="Pedidos" value={formatNumber(c.validOrders)} delta={d.orders} hint={`${c.cancelled} cancelados`} />
        <StatTile label="Ticket médio" value={formatPrice(c.avgTicket)} delta={d.avgTicket} />
        <StatTile label="Taxa de conversão" value={formatPercent(c.conversion)} delta={d.conversion} hint={`${formatNumber(c.sessions)} sessões`} />
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        <StatTile label="Clientes novos" value={formatNumber(mix.newBuyers)} hint={buyers ? `${formatPercent(mix.newBuyers / buyers, 0)} dos compradores · primeira compra no período` : "Primeira compra no período"} />
        <StatTile label="Clientes recorrentes" value={formatNumber(mix.recurring)} hint={buyers ? `${formatPercent(mix.recurring / buyers, 0)} dos compradores · já haviam comprado antes` : "Já haviam comprado antes"} />
        <StatTile label="Cadastros" value={formatNumber(c.newCustomers)} delta={d.newCustomers} hint="Novos registros de cliente" />
      </div>

      <Card>
        <CardHeader title="Faturamento" description={`${series.bucket === "week" ? "Semanal" : "Diário"} · exclui cancelados`} />
        <div className="pt-4">
          <AreaChart data={series.points.map((p) => ({ key: p.date, label: label(p.date), value: p.revenue }))} format="price" axisFormat="priceCompact" valueLabel="Faturamento" height={280} />
        </div>
      </Card>

      <div className="grid gap-4 xl:grid-cols-2">
        <Card>
          <CardHeader title="Pedidos" description={series.bucket === "week" ? "Semanal" : "Diário"} />
          <div className="pt-4">
            <ColumnChart data={series.points.map((p) => ({ key: p.date, label: label(p.date), value: p.orders }))} format="orders" valueLabel="Pedidos" height={240} />
          </div>
        </Card>
        <Card>
          <CardHeader title="Sessões" description="Visitantes únicos por sessão" />
          <div className="pt-4">
            <AreaChart data={series.points.map((p) => ({ key: p.date, label: label(p.date), value: p.sessions }))} format="sessions" axisFormat="number" valueLabel="Sessões" height={240} />
          </div>
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <Card>
          <CardHeader title="Produtos mais vendidos" description="Unidades vendidas" />
          <BarList items={top.map((t) => ({ key: String(t.productId ?? t.name), label: t.name, value: t.units, sub: formatPrice(t.revenue), image: t.image }))} format="units" />
        </Card>
        <Card>
          <CardHeader title="Produtos mais visualizados" description="Visualizações da página do produto" />
          <BarList items={viewed.map((t) => ({ key: String(t.productId), label: t.name, value: t.views, image: t.image }))} format="number" />
        </Card>
        <Card>
          <CardHeader title="Categorias mais vendidas" description="Receita por categoria" />
          <BarList items={cats.map((t) => ({ key: t.name, label: t.name, value: t.revenue, sub: `${t.units} unidades` }))} format="price" />
        </Card>
      </div>

      <Card>
        <CardHeader title="Funil de conversão" description="Sessões que chegaram a cada etapa" />
        <ol className="grid gap-4 p-5 md:grid-cols-4">
          {funnel.map((f, i) => (
            <li key={f.step}>
              <p className="text-xs text-muted-foreground">{String(i + 1).padStart(2, "0")} · {f.step}</p>
              <p className="mt-1 text-2xl font-semibold">{formatNumber(f.value)}</p>
              <div className="mt-2 h-2 rounded-full bg-[#f1f0ed]">
                <div className="h-2 rounded-full bg-[#18181b]" style={{ width: `${Math.max(2, (f.value / funnelTop) * 100)}%` }} />
              </div>
              <p className="mt-1.5 text-xs text-muted-foreground">
                {i === 0 ? "100% das sessões" : `${formatPercent(f.value / funnelTop)} das sessões${funnel[i - 1].value ? ` · ${formatPercent(f.value / funnel[i - 1].value)} da etapa anterior` : ""}`}
              </p>
            </li>
          ))}
        </ol>
      </Card>
    </div>
  );
}
