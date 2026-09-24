import Link from "next/link";
import { requireAdmin } from "@/lib/auth/session";
import { listCustomers, type CustomerSort } from "@/lib/data/customers";
import { formatDate, formatPhone, formatPrice } from "@/lib/format";
import { Badge, Card, EmptyState, Input, PageHeader, Select, buttonClass } from "@/components/admin/ui";
import { cn } from "@/lib/utils";

export const metadata = { title: "Clientes" };

export default async function CustomersPage(props: PageProps<"/admin/customers">) {
  await requireAdmin();
  const sp = await props.searchParams;
  const q = typeof sp.q === "string" ? sp.q : "";
  const sort = (["recent", "spent", "orders", "name"].includes(String(sp.sort)) ? sp.sort : "recent") as CustomerSort;
  const page = Math.max(1, Number(sp.page) || 1);
  const data = await listCustomers({ q, sort, page, pageSize: 25 });
  const pages = Math.max(1, Math.ceil(data.total / data.pageSize));
  const href = (p: number) => `/admin/customers?${new URLSearchParams({ ...(q ? { q } : {}), sort, page: String(p) })}`;

  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Relacionamento" title="Clientes" description={`${data.total} clientes cadastrados a partir dos pedidos feitos na loja.`} />
      <Card>
        <form className="flex flex-col gap-2 border-b border-border p-4 sm:flex-row" action="/admin/customers">
          <Input name="q" defaultValue={q} placeholder="Buscar por nome, e-mail ou telefone" className="sm:w-80" aria-label="Buscar clientes" />
          <Select name="sort" defaultValue={sort} aria-label="Ordenar" className="sm:w-48">
            <option value="recent">Compra mais recente</option>
            <option value="spent">Maior valor gasto</option>
            <option value="orders">Mais pedidos</option>
            <option value="name">Nome A–Z</option>
          </Select>
          <button type="submit" className={buttonClass({ variant: "outline" })}>Aplicar</button>
        </form>
        {data.rows.length === 0 ? (
          <EmptyState title="Nenhum cliente encontrado" description={q ? "Tente outro termo de busca." : "Clientes são criados automaticamente no primeiro pedido."} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[860px] text-sm">
              <thead className="border-b border-border text-left text-xs text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 font-medium">Nome</th>
                  <th className="px-4 py-3 font-medium">Contato</th>
                  <th className="px-4 py-3 text-right font-medium">Pedidos</th>
                  <th className="px-4 py-3 text-right font-medium">Total gasto</th>
                  <th className="px-4 py-3 font-medium">Última compra</th>
                  <th className="px-4 py-3 font-medium">Cadastro</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {data.rows.map((c) => (
                  <tr key={c.id} className="relative transition-colors hover:bg-muted/40">
                    <td className="px-4 py-3">
                      <Link href={`/admin/customers/${c.id}`} className="font-medium after:absolute after:inset-0">{c.name}</Link>
                      <p className="text-xs text-muted-foreground">{[c.city, c.state].filter(Boolean).join("/") || "—"}</p>
                    </td>
                    <td className="px-4 py-3">
                      <p>{c.email}</p>
                      <p className="text-xs text-muted-foreground">{formatPhone(c.phone)}</p>
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums">
                      {c.orderCount}
                      {c.orderCount > 1 && <Badge className="ml-2" tone="outline">Recorrente</Badge>}
                    </td>
                    <td className="px-4 py-3 text-right font-medium tabular-nums">{formatPrice(c.spent)}</td>
                    <td className="px-4 py-3 text-muted-foreground">{c.lastOrder ? formatDate(c.lastOrder) : "—"}</td>
                    <td className="px-4 py-3 text-muted-foreground">{formatDate(c.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {pages > 1 && (
          <div className="flex items-center justify-between border-t border-border px-4 py-3 text-xs text-muted-foreground">
            <span>Página {page} de {pages}</span>
            <div className="flex gap-2">
              <Link href={href(Math.max(1, page - 1))} className={cn(buttonClass({ variant: "outline", size: "sm" }), page <= 1 && "pointer-events-none opacity-40")}>Anterior</Link>
              <Link href={href(Math.min(pages, page + 1))} className={cn(buttonClass({ variant: "outline", size: "sm" }), page >= pages && "pointer-events-none opacity-40")}>Próxima</Link>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
