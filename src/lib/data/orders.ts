import "server-only";
import { randomBytes } from "node:crypto";
import { and, asc, desc, eq, gte, inArray, lte, sql, type SQL } from "drizzle-orm";
import { getDb, schema } from "@/db";
import type { OrderStatus } from "@/db/schema";

const { orders, orderItems, orderStatusHistory, customers, productVariants, products, analyticsEvents } = schema;

export class OrderError extends Error {
  constructor(message: string, public details: string[] = []) {
    super(message);
  }
}

export type PlaceOrderInput = {
  customer: { name: string; email: string; phone: string };
  address: {
    cep: string;
    address: string;
    number: string;
    complement?: string;
    district?: string;
    city: string;
    state: string;
  };
  notes?: string;
  channel: "site" | "whatsapp";
  items: { variantId: number; quantity: number }[];
  sessionId?: string;
};

export async function placeOrder(input: PlaceOrderInput) {
  const db = await getDb();
  const variantIds = [...new Set(input.items.map((i) => i.variantId))];
  if (!variantIds.length) throw new OrderError("Seu carrinho está vazio.");

  return db.transaction(async (tx) => {
    const rows = await tx
      .select({ v: productVariants, p: products })
      .from(productVariants)
      .innerJoin(products, eq(productVariants.productId, products.id))
      .where(inArray(productVariants.id, variantIds));
    const byId = new Map(rows.map((r) => [r.v.id, r]));

    const problems: string[] = [];
    const lines = input.items.map((item) => {
      const row = byId.get(item.variantId);
      if (!row || !row.p.active) {
        problems.push("Um dos produtos do carrinho não está mais disponível.");
        return null;
      }
      const qty = Math.max(1, Math.min(20, Math.floor(item.quantity)));
      if (row.v.stock < qty) {
        const variant = [row.v.color, row.v.size].filter(Boolean).join(" / ");
        problems.push(
          row.v.stock <= 0
            ? `${row.p.name}${variant ? ` (${variant})` : ""} esgotou.`
            : `${row.p.name}${variant ? ` (${variant})` : ""}: apenas ${row.v.stock} em estoque.`,
        );
        return null;
      }
      const base = row.p.salePrice && row.p.salePrice < row.p.price ? row.p.salePrice : row.p.price;
      const unitPrice = row.v.price ?? base;
      return { row, qty, unitPrice, lineTotal: unitPrice * qty };
    });
    if (problems.length) throw new OrderError("Não foi possível finalizar o pedido.", problems);
    const valid = lines.filter((l): l is NonNullable<typeof l> => l !== null);

    const subtotal = valid.reduce((a, l) => a + l.lineTotal, 0);
    const shipping = 0;
    const total = subtotal + shipping;
    const email = input.customer.email.trim().toLowerCase();

    // Upsert customer by e-mail.
    const addr = {
      cep: input.address.cep,
      address: input.address.address,
      number: input.address.number,
      complement: input.address.complement || null,
      district: input.address.district || null,
      city: input.address.city,
      state: input.address.state,
    };
    const [existing] = await tx.select({ id: customers.id }).from(customers).where(eq(customers.email, email));
    let customerId: number;
    if (existing) {
      customerId = existing.id;
      await tx
        .update(customers)
        .set({ name: input.customer.name, phone: input.customer.phone, ...addr, updatedAt: new Date() })
        .where(eq(customers.id, customerId));
    } else {
      const [c] = await tx
        .insert(customers)
        .values({ name: input.customer.name, email, phone: input.customer.phone, ...addr })
        .returning({ id: customers.id });
      customerId = c.id;
    }

    const [{ next }] = await tx
      .select({ next: sql<number>`coalesce(max(${orders.number}), 1000) + 1` })
      .from(orders);
    const accessToken = randomBytes(16).toString("hex");
    const [order] = await tx
      .insert(orders)
      .values({
        number: Number(next),
        accessToken,
        customerId,
        status: "NOVO",
        channel: input.channel,
        subtotal,
        shipping,
        total,
        customerName: input.customer.name,
        customerEmail: email,
        customerPhone: input.customer.phone,
        cep: addr.cep,
        address: addr.address,
        addressNumber: addr.number,
        complement: addr.complement,
        district: addr.district,
        city: addr.city,
        state: addr.state,
        notes: input.notes || null,
      })
      .returning();

    await tx.insert(orderItems).values(
      valid.map((l) => ({
        orderId: order.id,
        productId: l.row.p.id,
        variantId: l.row.v.id,
        categoryId: l.row.p.categoryId,
        productName: l.row.p.name,
        sku: l.row.v.sku,
        size: l.row.v.size,
        color: l.row.v.color,
        image:
          l.row.p.colors.find((c) => c.name === l.row.v.color)?.image ?? l.row.p.images[0] ?? null,
        unitPrice: l.unitPrice,
        quantity: l.qty,
        lineTotal: l.lineTotal,
      })),
    );
    await tx.insert(orderStatusHistory).values({ orderId: order.id, status: "NOVO", note: `Pedido criado via ${input.channel === "whatsapp" ? "WhatsApp" : "site"}` });

    // Decrement stock atomically; abort if a concurrent order took the last unit.
    for (const l of valid) {
      const res = await tx
        .update(productVariants)
        .set({ stock: sql`${productVariants.stock} - ${l.qty}`, updatedAt: new Date() })
        .where(and(eq(productVariants.id, l.row.v.id), gte(productVariants.stock, l.qty)));
      if (res.rowsAffected !== 1) {
        throw new OrderError("Não foi possível finalizar o pedido.", [`${l.row.p.name} acabou de esgotar.`]);
      }
    }

    await tx.insert(analyticsEvents).values({
      type: "purchase",
      sessionId: input.sessionId || `order-${order.id}`,
      orderId: order.id,
      value: total,
    });

    return {
      order,
      items: valid.map((l) => ({
        name: l.row.p.name,
        sku: l.row.v.sku,
        size: l.row.v.size,
        color: l.row.v.color,
        quantity: l.qty,
        unitPrice: l.unitPrice,
        lineTotal: l.lineTotal,
      })),
    };
  });
}

export async function getOrderForCustomer(number: number, token: string) {
  const db = await getDb();
  const [order] = await db
    .select()
    .from(orders)
    .where(and(eq(orders.number, number), eq(orders.accessToken, token)));
  if (!order) return null;
  const items = await db.select().from(orderItems).where(eq(orderItems.orderId, order.id));
  return { order, items };
}

/* ------------------------------------------------------------------ admin */

export type OrderListFilter = {
  status?: OrderStatus | "ALL";
  q?: string;
  from?: Date;
  to?: Date;
  page?: number;
  pageSize?: number;
};

export async function listOrders(filter: OrderListFilter = {}) {
  const db = await getDb();
  const where: SQL[] = [];
  if (filter.status && filter.status !== "ALL") where.push(eq(orders.status, filter.status));
  if (filter.from) where.push(gte(orders.createdAt, filter.from));
  if (filter.to) where.push(lte(orders.createdAt, filter.to));
  if (filter.q) {
    const q = `%${filter.q.toLowerCase().trim()}%`;
    where.push(
      sql`(lower(${orders.customerName}) like ${q} or lower(${orders.customerEmail}) like ${q} or cast(${orders.number} as text) like ${q})`,
    );
  }
  const pageSize = filter.pageSize ?? 20;
  const page = Math.max(1, filter.page ?? 1);
  const cond = where.length ? and(...where) : undefined;
  const [{ count }] = await db.select({ count: sql<number>`count(*)` }).from(orders).where(cond);
  const rows = await db
    .select()
    .from(orders)
    .where(cond)
    .orderBy(desc(orders.createdAt))
    .limit(pageSize)
    .offset((page - 1) * pageSize);
  const items = rows.length
    ? await db.select().from(orderItems).where(inArray(orderItems.orderId, rows.map((r) => r.id)))
    : [];
  const byOrder = new Map<number, typeof items>();
  items.forEach((it) => byOrder.set(it.orderId, [...(byOrder.get(it.orderId) ?? []), it]));
  const statusCounts = await db
    .select({ status: orders.status, count: sql<number>`count(*)` })
    .from(orders)
    .groupBy(orders.status);
  return {
    rows: rows.map((r) => ({ ...r, items: byOrder.get(r.id) ?? [] })),
    total: Number(count),
    page,
    pageSize,
    statusCounts: Object.fromEntries(statusCounts.map((s) => [s.status, Number(s.count)])) as Partial<Record<OrderStatus, number>>,
  };
}

export async function getOrderDetail(id: number) {
  const db = await getDb();
  const [order] = await db.select().from(orders).where(eq(orders.id, id));
  if (!order) return null;
  const [items, history] = await Promise.all([
    db.select().from(orderItems).where(eq(orderItems.orderId, id)),
    db.select().from(orderStatusHistory).where(eq(orderStatusHistory.orderId, id)).orderBy(asc(orderStatusHistory.createdAt)),
  ]);
  return { order, items, history };
}

/**
 * Changes an order status. Cancelling restocks the items; re-activating a
 * cancelled order takes them from stock again.
 */
export async function updateOrderStatus(id: number, status: OrderStatus, note?: string) {
  const db = await getDb();
  return db.transaction(async (tx) => {
    const [order] = await tx.select().from(orders).where(eq(orders.id, id));
    if (!order) throw new OrderError("Pedido não encontrado.");
    if (order.status === status) return order;
    const items = await tx.select().from(orderItems).where(eq(orderItems.orderId, id));
    if (status === "CANCELADO" && order.status !== "CANCELADO") {
      for (const it of items) {
        if (!it.variantId) continue;
        await tx
          .update(productVariants)
          .set({ stock: sql`${productVariants.stock} + ${it.quantity}` })
          .where(eq(productVariants.id, it.variantId));
      }
    } else if (order.status === "CANCELADO" && status !== "CANCELADO") {
      for (const it of items) {
        if (!it.variantId) continue;
        const res = await tx
          .update(productVariants)
          .set({ stock: sql`${productVariants.stock} - ${it.quantity}` })
          .where(and(eq(productVariants.id, it.variantId), gte(productVariants.stock, it.quantity)));
        if (res.rowsAffected !== 1) {
          throw new OrderError(`Estoque insuficiente para reativar o pedido (${it.productName}).`);
        }
      }
    }
    const [updated] = await tx
      .update(orders)
      .set({ status, updatedAt: new Date() })
      .where(eq(orders.id, id))
      .returning();
    await tx.insert(orderStatusHistory).values({ orderId: id, status, note: note || null });
    return updated;
  });
}
