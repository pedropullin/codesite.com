import "server-only";
import { asc, desc, eq, inArray, sql } from "drizzle-orm";
import { getDb, schema } from "@/db";

const { customers, orders, orderItems } = schema;

export type CustomerSort = "recent" | "spent" | "orders" | "name";

export async function listCustomers({ q, sort = "recent", page = 1, pageSize = 25 }: { q?: string; sort?: CustomerSort; page?: number; pageSize?: number } = {}) {
  const db = await getDb();
  const agg = db
    .select({
      customerId: orders.customerId,
      orderCount: sql<number>`count(*)`.as("order_count"),
      spent: sql<number>`coalesce(sum(case when ${orders.status} != 'CANCELADO' then ${orders.total} else 0 end), 0)`.as("spent"),
      lastOrder: sql<number>`max(${orders.createdAt})`.as("last_order"),
    })
    .from(orders)
    .groupBy(orders.customerId)
    .as("agg");
  const where = q
    ? sql`(lower(${customers.name}) like ${`%${q.toLowerCase()}%`} or lower(${customers.email}) like ${`%${q.toLowerCase()}%`} or ${customers.phone} like ${`%${q.replace(/\D/g, "") || q}%`})`
    : undefined;
  const order = (() => {
    switch (sort) {
      case "spent":
        return [desc(sql`coalesce(${agg.spent}, 0)`)];
      case "orders":
        return [desc(sql`coalesce(${agg.orderCount}, 0)`)];
      case "name":
        return [asc(customers.name)];
      default:
        return [desc(sql`coalesce(${agg.lastOrder}, 0)`), desc(customers.createdAt)];
    }
  })();
  const [{ count }] = await db.select({ count: sql<number>`count(*)` }).from(customers).where(where);
  const rows = await db
    .select({
      id: customers.id,
      name: customers.name,
      email: customers.email,
      phone: customers.phone,
      city: customers.city,
      state: customers.state,
      createdAt: customers.createdAt,
      orderCount: sql<number>`coalesce(${agg.orderCount}, 0)`,
      spent: sql<number>`coalesce(${agg.spent}, 0)`,
      lastOrder: agg.lastOrder,
    })
    .from(customers)
    .leftJoin(agg, eq(agg.customerId, customers.id))
    .where(where)
    .orderBy(...order)
    .limit(pageSize)
    .offset((Math.max(1, page) - 1) * pageSize);
  return {
    rows: rows.map((r) => ({
      ...r,
      orderCount: Number(r.orderCount),
      spent: Number(r.spent),
      lastOrder: r.lastOrder ? new Date(Number(r.lastOrder)) : null,
    })),
    total: Number(count),
    page,
    pageSize,
  };
}

export async function getCustomerDetail(id: number) {
  const db = await getDb();
  const [customer] = await db.select().from(customers).where(eq(customers.id, id));
  if (!customer) return null;
  const list = await db.select().from(orders).where(eq(orders.customerId, id)).orderBy(desc(orders.createdAt));
  const items = list.length
    ? await db.select().from(orderItems).where(inArray(orderItems.orderId, list.map((o) => o.id)))
    : [];
  const byOrder = new Map<number, typeof items>();
  items.forEach((it) => byOrder.set(it.orderId, [...(byOrder.get(it.orderId) ?? []), it]));
  const valid = list.filter((o) => o.status !== "CANCELADO");
  const spent = valid.reduce((a, o) => a + o.total, 0);
  const favorite = new Map<string, number>();
  items.forEach((it) => favorite.set(it.productName, (favorite.get(it.productName) ?? 0) + it.quantity));
  return {
    customer,
    orders: list.map((o) => ({ ...o, items: byOrder.get(o.id) ?? [] })),
    stats: {
      orderCount: list.length,
      spent,
      avgTicket: valid.length ? Math.round(spent / valid.length) : 0,
      lastOrder: list[0]?.createdAt ?? null,
      firstOrder: list[list.length - 1]?.createdAt ?? null,
      favorite: [...favorite.entries()].sort((a, b) => b[1] - a[1]).slice(0, 3),
    },
  };
}
