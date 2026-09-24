import "server-only";
import { and, desc, eq, gte, inArray, lte, ne, sql } from "drizzle-orm";
import { getDb, schema } from "@/db";
import type { AnalyticsEventType } from "@/db/schema";
import { TZ_OFFSET_MS } from "@/lib/analytics-range";

const { orders, orderItems, analyticsEvents, customers, products, productVariants, categories } = schema;

export async function trackEvent(e: {
  type: AnalyticsEventType;
  sessionId: string;
  path?: string | null;
  productId?: number | null;
  value?: number | null;
}) {
  const db = await getDb();
  await db.insert(analyticsEvents).values({
    type: e.type,
    sessionId: e.sessionId.slice(0, 64),
    path: e.path?.slice(0, 300) ?? null,
    productId: e.productId ?? null,
    value: e.value ?? null,
  });
}

const dayExpr = (col: typeof orders.createdAt | typeof analyticsEvents.createdAt | typeof customers.createdAt) =>
  sql<string>`strftime('%Y-%m-%d', (${col} - ${TZ_OFFSET_MS}) / 1000, 'unixepoch')`;

export type Range = { start: Date; end: Date };

function previous(r: Range): Range {
  const span = r.end.getTime() - r.start.getTime() + 1;
  return { start: new Date(r.start.getTime() - span), end: new Date(r.start.getTime() - 1) };
}

async function kpisFor(r: Range) {
  const db = await getDb();
  const inRange = and(gte(orders.createdAt, r.start), lte(orders.createdAt, r.end));
  const [o] = await db
    .select({
      revenue: sql<number>`coalesce(sum(case when ${orders.status} != 'CANCELADO' then ${orders.total} end), 0)`,
      orders: sql<number>`count(*)`,
      valid: sql<number>`sum(case when ${orders.status} != 'CANCELADO' then 1 else 0 end)`,
      cancelled: sql<number>`sum(case when ${orders.status} = 'CANCELADO' then 1 else 0 end)`,
      buyers: sql<number>`count(distinct ${orders.customerId})`,
    })
    .from(orders)
    .where(inRange);
  const [{ sessions }] = await db
    .select({ sessions: sql<number>`count(distinct ${analyticsEvents.sessionId})` })
    .from(analyticsEvents)
    .where(and(eq(analyticsEvents.type, "page_view"), gte(analyticsEvents.createdAt, r.start), lte(analyticsEvents.createdAt, r.end)));
  const [{ newCustomers }] = await db
    .select({ newCustomers: sql<number>`count(*)` })
    .from(customers)
    .where(and(gte(customers.createdAt, r.start), lte(customers.createdAt, r.end)));
  const revenue = Number(o.revenue);
  const valid = Number(o.valid ?? 0);
  return {
    revenue,
    orders: Number(o.orders),
    validOrders: valid,
    cancelled: Number(o.cancelled ?? 0),
    avgTicket: valid ? Math.round(revenue / valid) : 0,
    buyers: Number(o.buyers),
    sessions: Number(sessions),
    conversion: Number(sessions) ? valid / Number(sessions) : 0,
    newCustomers: Number(newCustomers),
  };
}

export async function getKpis(r: Range) {
  const [current, prev] = await Promise.all([kpisFor(r), kpisFor(previous(r))]);
  const delta = (a: number, b: number) => (b === 0 ? (a > 0 ? 1 : 0) : (a - b) / b);
  return {
    current,
    previous: prev,
    deltas: {
      revenue: delta(current.revenue, prev.revenue),
      orders: delta(current.validOrders, prev.validOrders),
      avgTicket: delta(current.avgTicket, prev.avgTicket),
      sessions: delta(current.sessions, prev.sessions),
      conversion: delta(current.conversion, prev.conversion),
      newCustomers: delta(current.newCustomers, prev.newCustomers),
    },
  };
}

export type SeriesPoint = { date: string; revenue: number; orders: number; sessions: number };

/** Daily series (weekly buckets when the range is longer than 120 days). */
export async function getSeries(r: Range): Promise<{ bucket: "day" | "week"; points: SeriesPoint[] }> {
  const db = await getDb();
  const days = Math.ceil((r.end.getTime() - r.start.getTime()) / 86400000);
  const bucket = days > 120 ? "week" : "day";
  const ord = await db
    .select({
      day: dayExpr(orders.createdAt),
      revenue: sql<number>`coalesce(sum(case when ${orders.status} != 'CANCELADO' then ${orders.total} end), 0)`,
      orders: sql<number>`sum(case when ${orders.status} != 'CANCELADO' then 1 else 0 end)`,
    })
    .from(orders)
    .where(and(gte(orders.createdAt, r.start), lte(orders.createdAt, r.end)))
    .groupBy(sql`1`);
  const ses = await db
    .select({
      day: dayExpr(analyticsEvents.createdAt),
      sessions: sql<number>`count(distinct ${analyticsEvents.sessionId})`,
    })
    .from(analyticsEvents)
    .where(and(eq(analyticsEvents.type, "page_view"), gte(analyticsEvents.createdAt, r.start), lte(analyticsEvents.createdAt, r.end)))
    .groupBy(sql`1`);
  const map = new Map<string, SeriesPoint>();
  for (let t = r.start.getTime(); t <= r.end.getTime(); t += 86400000) {
    const d = new Date(t - TZ_OFFSET_MS).toISOString().slice(0, 10);
    map.set(d, { date: d, revenue: 0, orders: 0, sessions: 0 });
  }
  ord.forEach((o) => {
    const p = map.get(o.day);
    if (p) {
      p.revenue = Number(o.revenue);
      p.orders = Number(o.orders);
    }
  });
  ses.forEach((s) => {
    const p = map.get(s.day);
    if (p) p.sessions = Number(s.sessions);
  });
  let points = [...map.values()];
  if (bucket === "week") {
    const weeks: SeriesPoint[] = [];
    for (let i = 0; i < points.length; i += 7) {
      const chunk = points.slice(i, i + 7);
      weeks.push({
        date: chunk[0].date,
        revenue: chunk.reduce((a, p) => a + p.revenue, 0),
        orders: chunk.reduce((a, p) => a + p.orders, 0),
        sessions: chunk.reduce((a, p) => a + p.sessions, 0),
      });
    }
    points = weeks;
  }
  return { bucket, points };
}

export async function getTopProducts(r: Range, limit = 6) {
  const db = await getDb();
  const rows = await db
    .select({
      productId: orderItems.productId,
      name: orderItems.productName,
      image: sql<string | null>`max(${orderItems.image})`,
      units: sql<number>`sum(${orderItems.quantity})`,
      revenue: sql<number>`sum(${orderItems.lineTotal})`,
    })
    .from(orderItems)
    .innerJoin(orders, eq(orderItems.orderId, orders.id))
    .where(and(gte(orders.createdAt, r.start), lte(orders.createdAt, r.end), ne(orders.status, "CANCELADO")))
    .groupBy(orderItems.productId, orderItems.productName)
    .orderBy(desc(sql`sum(${orderItems.quantity})`), desc(sql`sum(${orderItems.lineTotal})`))
    .limit(limit);
  return rows.map((r) => ({ ...r, units: Number(r.units), revenue: Number(r.revenue) }));
}

export async function getMostViewed(r: Range, limit = 6) {
  const db = await getDb();
  const rows = await db
    .select({
      productId: analyticsEvents.productId,
      name: products.name,
      image: sql<string | null>`json_extract(${products.images}, '$[0]')`,
      views: sql<number>`count(*)`,
    })
    .from(analyticsEvents)
    .innerJoin(products, eq(analyticsEvents.productId, products.id))
    .where(and(eq(analyticsEvents.type, "product_view"), gte(analyticsEvents.createdAt, r.start), lte(analyticsEvents.createdAt, r.end)))
    .groupBy(analyticsEvents.productId)
    .orderBy(desc(sql`count(*)`))
    .limit(limit);
  return rows.map((r) => ({ ...r, views: Number(r.views) }));
}

export async function getTopCategories(r: Range) {
  const db = await getDb();
  const rows = await db
    .select({
      name: sql<string>`coalesce(${categories.name}, 'Sem categoria')`,
      units: sql<number>`sum(${orderItems.quantity})`,
      revenue: sql<number>`sum(${orderItems.lineTotal})`,
    })
    .from(orderItems)
    .innerJoin(orders, eq(orderItems.orderId, orders.id))
    .leftJoin(categories, eq(orderItems.categoryId, categories.id))
    .where(and(gte(orders.createdAt, r.start), lte(orders.createdAt, r.end), ne(orders.status, "CANCELADO")))
    .groupBy(sql`1`)
    .orderBy(desc(sql`sum(${orderItems.lineTotal})`));
  return rows.map((r) => ({ ...r, units: Number(r.units), revenue: Number(r.revenue) }));
}

/** New buyers = first-ever order inside the range; recurring = ordered in range with an earlier order. */
export async function getCustomerMix(r: Range) {
  const db = await getDb();
  const firsts = db
    .select({ customerId: orders.customerId, first: sql<number>`min(${orders.createdAt})`.as("first_at") })
    .from(orders)
    .groupBy(orders.customerId)
    .as("firsts");
  const [row] = await db
    .select({
      newBuyers: sql<number>`count(distinct case when ${firsts.first} >= ${r.start.getTime()} then ${orders.customerId} end)`,
      recurring: sql<number>`count(distinct case when ${firsts.first} < ${r.start.getTime()} then ${orders.customerId} end)`,
    })
    .from(orders)
    .innerJoin(firsts, eq(firsts.customerId, orders.customerId))
    .where(and(gte(orders.createdAt, r.start), lte(orders.createdAt, r.end), ne(orders.status, "CANCELADO")));
  return { newBuyers: Number(row?.newBuyers ?? 0), recurring: Number(row?.recurring ?? 0) };
}

export async function getFunnel(r: Range) {
  const db = await getDb();
  const rows = await db
    .select({ type: analyticsEvents.type, sessions: sql<number>`count(distinct ${analyticsEvents.sessionId})` })
    .from(analyticsEvents)
    .where(and(gte(analyticsEvents.createdAt, r.start), lte(analyticsEvents.createdAt, r.end)))
    .groupBy(analyticsEvents.type);
  const m = Object.fromEntries(rows.map((r) => [r.type, Number(r.sessions)]));
  return [
    { step: "Visitas", value: m.page_view ?? 0 },
    { step: "Viram produto", value: m.product_view ?? 0 },
    { step: "Adicionaram ao carrinho", value: m.add_to_cart ?? 0 },
    { step: "Compraram", value: m.purchase ?? 0 },
  ];
}

export async function getLowStock(threshold = 3, limit = 8) {
  const db = await getDb();
  const rows = await db
    .select({
      productId: products.id,
      name: products.name,
      slug: products.slug,
      image: sql<string | null>`json_extract(${products.images}, '$[0]')`,
      variant: sql<string>`trim(coalesce(${productVariants.color}, '') || ' ' || coalesce(${productVariants.size}, ''))`,
      sku: productVariants.sku,
      stock: productVariants.stock,
    })
    .from(productVariants)
    .innerJoin(products, eq(productVariants.productId, products.id))
    .where(and(lte(productVariants.stock, threshold), eq(products.active, true)))
    .orderBy(productVariants.stock, products.name)
    .limit(limit);
  return rows;
}

export async function getRecentOrders(limit = 6) {
  const db = await getDb();
  const rows = await db.select().from(orders).orderBy(desc(orders.createdAt)).limit(limit);
  const items = rows.length
    ? await db
        .select({ orderId: orderItems.orderId, quantity: orderItems.quantity })
        .from(orderItems)
        .where(inArray(orderItems.orderId, rows.map((r) => r.id)))
    : [];
  return rows.map((r) => ({
    ...r,
    itemCount: items.filter((i) => i.orderId === r.id).reduce((a, i) => a + i.quantity, 0),
  }));
}

export async function getCatalogCounts() {
  const db = await getDb();
  const [p] = await db
    .select({
      total: sql<number>`count(*)`,
      active: sql<number>`sum(case when ${products.active} = 1 then 1 else 0 end)`,
    })
    .from(products);
  const [c] = await db.select({ total: sql<number>`count(*)` }).from(customers);
  const [soldOut] = await db
    .select({ n: sql<number>`count(*)` })
    .from(
      db
        .select({ id: productVariants.productId, s: sql<number>`sum(${productVariants.stock})`.as("s") })
        .from(productVariants)
        .groupBy(productVariants.productId)
        .as("t"),
    )
    .where(sql`s <= 0`);
  return {
    products: Number(p.total),
    activeProducts: Number(p.active ?? 0),
    customers: Number(c.total),
    soldOut: Number(soldOut.n),
  };
}
