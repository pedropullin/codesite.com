import { randomBytes } from "node:crypto";
import { sql } from "drizzle-orm";
import type { Database } from "./client";
import * as s from "./schema";
import { seedCategories, seedProducts } from "./seed-data";
import { defaultSettings } from "../lib/settings-schema";
import { hashPassword } from "../lib/auth/password";

export const DEFAULT_ADMIN_EMAIL = "admin@vaultassociation.com";
export const DEFAULT_ADMIN_PASSWORD = "vault-admin";

/** Deterministic PRNG so demo data is reproducible. */
function mulberry32(seed: number) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function variantSku(base: string, size: string | null, color: string | null) {
  const part = (v: string | null) =>
    v
      ? v
          .normalize("NFD")
          .replace(/[^a-zA-Z0-9]/g, "")
          .slice(0, 3)
          .toUpperCase()
      : "";
  return [base, part(color), part(size)].filter(Boolean).join("-");
}

export async function isDatabaseEmpty(db: Database) {
  const rows = await db
    .select({ count: sql<number>`count(*)` })
    .from(s.categories);
  return (rows[0]?.count ?? 0) === 0;
}

export async function seedDatabase(
  db: Database,
  options: { demo?: boolean } = {},
) {
  const demo = options.demo ?? true;

  /* Settings ---------------------------------------------------------- */
  for (const [key, value] of Object.entries(defaultSettings)) {
    await db
      .insert(s.storeSettings)
      .values({ key, value })
      .onConflictDoNothing();
  }
  await db
    .insert(s.storeSettings)
    .values({ key: "_session_secret", value: randomBytes(48).toString("base64") })
    .onConflictDoNothing();

  /* Admin ------------------------------------------------------------- */
  const adminEmail = (
    process.env.ADMIN_EMAIL || DEFAULT_ADMIN_EMAIL
  ).toLowerCase();
  await db
    .insert(s.users)
    .values({
      name: "Vault Admin",
      email: adminEmail,
      role: "owner",
      passwordHash: await hashPassword(
        process.env.ADMIN_PASSWORD || DEFAULT_ADMIN_PASSWORD,
      ),
    })
    .onConflictDoNothing();

  /* Categories -------------------------------------------------------- */
  const categoryIds = new Map<string, number>();
  for (const [i, c] of seedCategories.entries()) {
    const [row] = await db
      .insert(s.categories)
      .values({ ...c, sortOrder: i })
      .returning({ id: s.categories.id });
    categoryIds.set(c.slug, row.id);
  }

  /* Products & variants ---------------------------------------------- */
  const now = Date.now();
  const productRows: {
    id: number;
    slug: string;
    categoryId: number;
    price: number;
    name: string;
    sku: string;
    image: string;
    variants: { id: number; size: string | null; color: string | null; sku: string }[];
  }[] = [];

  for (const [i, p] of seedProducts.entries()) {
    const categoryId = categoryIds.get(p.category)!;
    const [row] = await db
      .insert(s.products)
      .values({
        name: p.name,
        slug: p.slug,
        sku: p.sku,
        categoryId,
        price: p.price,
        salePrice: p.salePrice ?? null,
        description: p.description,
        details: p.details,
        images: p.images,
        sizes: p.sizes,
        colors: p.colors,
        label: p.label ?? null,
        featured: p.featured ?? false,
        isNew: p.isNew ?? false,
        sortOrder: i,
        // Stagger creation dates so "newest" sorting is meaningful.
        createdAt: new Date(now - (seedProducts.length - i) * 86400000 * 3),
      })
      .returning({ id: s.products.id });

    const sizes = p.sizes.length ? p.sizes : [null];
    const colors = p.colors.length ? p.colors.map((c) => c.name) : [null];
    const variants: (typeof productRows)[number]["variants"] = [];
    for (const color of colors) {
      for (const size of sizes) {
        const sku = variantSku(p.sku, size, colors.length > 1 ? color : null);
        const stock = typeof p.stock === "function" ? p.stock(size, color) : p.stock;
        const [v] = await db
          .insert(s.productVariants)
          .values({ productId: row.id, sku, size, color, stock })
          .returning({ id: s.productVariants.id });
        variants.push({ id: v.id, size, color, sku });
      }
    }
    productRows.push({
      id: row.id,
      slug: p.slug,
      categoryId,
      price: p.salePrice ?? p.price,
      name: p.name,
      sku: p.sku,
      image: p.images[0],
      variants,
    });
  }

  if (demo) await seedDemoActivity(db, productRows);
}

/* -------------------------------------------------------------------- */
/* Demo activity: customers, orders and analytics events spread over     */
/* the last ~200 days, so the dashboard has history on first launch.     */
/* -------------------------------------------------------------------- */

const FIRST = [
  "Ana", "Bruno", "Camila", "Diego", "Eduarda", "Felipe", "Gabriela", "Henrique",
  "Isabela", "João", "Karina", "Lucas", "Mariana", "Nicolas", "Olívia", "Pedro",
  "Rafaela", "Samuel", "Tainá", "Vitor", "Beatriz", "Caio", "Helena", "Igor",
  "Júlia", "Leonardo", "Manuela", "Otávio", "Paula", "Renan", "Sofia", "Thiago",
];
const LAST = [
  "Almeida", "Barbosa", "Cardoso", "Duarte", "Esteves", "Ferraz", "Guimarães",
  "Hoffmann", "Lacerda", "Macedo", "Nogueira", "Pacheco", "Queiroz", "Rezende",
  "Sampaio", "Tavares", "Vasconcelos", "Moraes", "Azevedo", "Prado",
];
const CITIES: [string, string, string][] = [
  ["São Paulo", "SP", "01310-100"],
  ["Rio de Janeiro", "RJ", "22021-001"],
  ["Belo Horizonte", "MG", "30130-010"],
  ["Curitiba", "PR", "80020-000"],
  ["Porto Alegre", "RS", "90010-150"],
  ["Florianópolis", "SC", "88010-400"],
  ["Brasília", "DF", "70040-010"],
  ["Recife", "PE", "50030-230"],
  ["Salvador", "BA", "40020-000"],
  ["Campinas", "SP", "13010-050"],
];
const STREETS = [
  "Rua Augusta", "Av. Paulista", "Rua Oscar Freire", "Rua dos Pinheiros",
  "Av. Atlântica", "Rua da Bahia", "Rua XV de Novembro", "Av. Independência",
  "Rua Haddock Lobo", "Alameda Lorena",
];

async function seedDemoActivity(
  db: Database,
  products: {
    id: number;
    slug: string;
    categoryId: number;
    price: number;
    name: string;
    sku: string;
    image: string;
    variants: { id: number; size: string | null; color: string | null; sku: string }[];
  }[],
) {
  const rand = mulberry32(20260923);
  const pick = <T,>(arr: T[]) => arr[Math.floor(rand() * arr.length)];
  const DAY = 86400000;
  const now = Date.now();
  const DAYS = 200;

  // Popularity weights: accessories & tees sell more units, exclusives rarely.
  const weights = products.map((p) =>
    p.price > 300000 ? 0.35 : p.price > 150000 ? 0.8 : p.price > 80000 ? 1.4 : 2.2,
  );
  const totalWeight = weights.reduce((a, b) => a + b, 0);
  const weightedProduct = () => {
    let x = rand() * totalWeight;
    for (let i = 0; i < products.length; i++) {
      x -= weights[i];
      if (x <= 0) return products[i];
    }
    return products[products.length - 1];
  };

  /* Customers */
  const customerPool: { id: number; name: string; email: string; phone: string; city: [string, string, string]; createdAt: number }[] = [];
  const CUSTOMER_COUNT = 96;
  for (let i = 0; i < CUSTOMER_COUNT; i++) {
    const first = pick(FIRST);
    const last = pick(LAST);
    const name = `${first} ${last}`;
    const email = `${first}.${last}${i}`
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .toLowerCase()
      .concat("@example.com");
    const phone = `119${String(Math.floor(10000000 + rand() * 89999999))}`;
    const city = pick(CITIES);
    // Skew customer sign-ups towards recent months (growth).
    const age = Math.floor(Math.pow(rand(), 1.6) * DAYS);
    const createdAt = now - age * DAY - Math.floor(rand() * DAY);
    const [row] = await db
      .insert(s.customers)
      .values({
        name,
        email,
        phone,
        cep: city[2],
        address: pick(STREETS),
        number: String(10 + Math.floor(rand() * 1900)),
        city: city[0],
        state: city[1],
        district: "Centro",
        createdAt: new Date(createdAt),
        updatedAt: new Date(createdAt),
      })
      .returning({ id: s.customers.id });
    customerPool.push({ id: row.id, name, email, phone, city, createdAt });
  }

  /* Orders */
  let orderNumber = 1001;
  const orderRows: { id: number; createdAt: number; total: number; items: { productId: number }[] }[] = [];
  const customersByDate = [...customerPool].sort((a, b) => a.createdAt - b.createdAt);

  for (const customer of customersByDate) {
    // 1–4 orders per customer; ~35% of customers are recurring.
    const orderCount = rand() < 0.65 ? 1 : 2 + Math.floor(rand() * 3);
    let t = customer.createdAt + Math.floor(rand() * DAY * 0.5);
    for (let o = 0; o < orderCount && t < now; o++) {
      const itemCount = 1 + Math.floor(Math.pow(rand(), 2) * 3);
      const items: (typeof s.orderItems.$inferInsert)[] = [];
      let subtotal = 0;
      const used = new Set<number>();
      for (let k = 0; k < itemCount; k++) {
        const p = weightedProduct();
        if (used.has(p.id)) continue;
        used.add(p.id);
        const v = pick(p.variants);
        const qty = rand() < 0.85 ? 1 : 2;
        subtotal += p.price * qty;
        items.push({
          orderId: 0,
          productId: p.id,
          variantId: v.id,
          categoryId: p.categoryId,
          productName: p.name,
          sku: v.sku,
          size: v.size,
          color: v.color,
          image: p.image,
          unitPrice: p.price,
          quantity: qty,
          lineTotal: p.price * qty,
        });
      }
      const ageDays = (now - t) / DAY;
      const status: s.OrderStatus =
        rand() < 0.06
          ? "CANCELADO"
          : ageDays > 14
            ? "ENTREGUE"
            : ageDays > 8
              ? pick(["ENVIADO", "ENTREGUE"] as const)
              : ageDays > 4
                ? pick(["PAGO", "EM_PREPARACAO", "ENVIADO"] as const)
                : ageDays > 1
                  ? pick(["AGUARDANDO_PAGAMENTO", "PAGO", "EM_PREPARACAO"] as const)
                  : pick(["NOVO", "AGUARDANDO_PAGAMENTO"] as const);

      const [order] = await db
        .insert(s.orders)
        .values({
          number: orderNumber++,
          accessToken: randomBytes(12).toString("hex"),
          customerId: customer.id,
          status,
          channel: rand() < 0.55 ? "whatsapp" : "site",
          subtotal,
          total: subtotal,
          customerName: customer.name,
          customerEmail: customer.email,
          customerPhone: customer.phone,
          cep: customer.city[2],
          address: pick(STREETS),
          addressNumber: String(10 + Math.floor(rand() * 1900)),
          city: customer.city[0],
          state: customer.city[1],
          district: "Centro",
          createdAt: new Date(t),
          updatedAt: new Date(t),
        })
        .returning({ id: s.orders.id });

      await db
        .insert(s.orderItems)
        .values(items.map((it) => ({ ...it, orderId: order.id })));
      await db.insert(s.orderStatusHistory).values([
        { orderId: order.id, status: "NOVO", createdAt: new Date(t) },
        ...(status !== "NOVO"
          ? [{ orderId: order.id, status, createdAt: new Date(Math.min(now, t + DAY * 2)) }]
          : []),
      ]);
      orderRows.push({
        id: order.id,
        createdAt: t,
        total: subtotal,
        items: items.map((i) => ({ productId: i.productId! })),
      });
      t += DAY * (6 + Math.floor(rand() * 40));
    }
  }

  /* Analytics events: sessions → page views → product views → carts. */
  const events: (typeof s.analyticsEvents.$inferInsert)[] = [];
  for (let d = DAYS; d >= 0; d--) {
    const dayStart = now - d * DAY;
    const growth = 0.45 + (1 - d / DAYS) * 0.9;
    const weekday = new Date(dayStart).getDay();
    const weekend = weekday === 0 || weekday === 6 ? 1.25 : 1;
    const sessions = Math.round((22 + rand() * 18) * growth * weekend);
    for (let k = 0; k < sessions; k++) {
      const sessionId = `demo-${d}-${k}`;
      const ts = dayStart - Math.floor(rand() * DAY);
      if (ts > now) continue;
      events.push({ type: "page_view", sessionId, path: "/", createdAt: new Date(ts) });
      const views = Math.floor(rand() * 4);
      for (let v = 0; v < views; v++) {
        const p = weightedProduct();
        const vt = ts + (v + 1) * 45000;
        events.push({ type: "page_view", sessionId, path: `/product/${p.slug}`, createdAt: new Date(vt) });
        events.push({ type: "product_view", sessionId, productId: p.id, createdAt: new Date(vt) });
        if (rand() < 0.12) {
          events.push({ type: "add_to_cart", sessionId, productId: p.id, value: p.price, createdAt: new Date(vt + 20000) });
        }
      }
    }
  }
  for (const o of orderRows) {
    events.push({
      type: "purchase",
      sessionId: `demo-order-${o.id}`,
      orderId: o.id,
      value: o.total,
      createdAt: new Date(o.createdAt),
    });
  }
  for (let i = 0; i < events.length; i += 500) {
    await db.insert(s.analyticsEvents).values(events.slice(i, i + 500));
  }
}
