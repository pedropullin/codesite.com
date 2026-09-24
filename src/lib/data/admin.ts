import "server-only";
import { and, asc, desc, eq, inArray, like, ne, or, sql } from "drizzle-orm";
import { getDb, schema } from "@/db";
import type { ProductColor } from "@/db/schema";
import { slugify } from "@/lib/format";
import { productStatus } from "./catalog";

const { products, productVariants, categories, orderItems, orders, media } = schema;

/* ----------------------------------------------------------------- products */

export async function listAdminProducts({ q, category, status }: { q?: string; category?: string; status?: string } = {}) {
  const db = await getDb();
  const where = [];
  if (q) {
    const term = `%${q.toLowerCase()}%`;
    where.push(or(like(sql`lower(${products.name})`, term), like(sql`lower(${products.sku})`, term)));
  }
  if (category) where.push(eq(categories.slug, category));
  if (status === "active") where.push(eq(products.active, true));
  if (status === "inactive") where.push(eq(products.active, false));
  if (status === "featured") where.push(eq(products.featured, true));
  if (status === "new") where.push(eq(products.isNew, true));
  const rows = await db
    .select({ p: products, categoryName: categories.name, categorySlug: categories.slug })
    .from(products)
    .leftJoin(categories, eq(products.categoryId, categories.id))
    .where(where.length ? and(...where) : undefined)
    .orderBy(asc(products.sortOrder), desc(products.createdAt));
  const ids = rows.map((r) => r.p.id);
  const variants = ids.length
    ? await db.select().from(productVariants).where(inArray(productVariants.productId, ids)).orderBy(asc(productVariants.id))
    : [];
  const sales = ids.length
    ? await db
        .select({ productId: orderItems.productId, units: sql<number>`sum(${orderItems.quantity})` })
        .from(orderItems)
        .innerJoin(orders, eq(orders.id, orderItems.orderId))
        .where(and(inArray(orderItems.productId, ids), ne(orders.status, "CANCELADO")))
        .groupBy(orderItems.productId)
    : [];
  const salesMap = new Map(sales.map((s) => [s.productId, Number(s.units)]));
  let list = rows.map((r) => {
    const vs = variants.filter((v) => v.productId === r.p.id);
    const stock = vs.reduce((a, v) => a + v.stock, 0);
    return {
      ...r.p,
      categoryName: r.categoryName,
      variants: vs,
      stock,
      sold: salesMap.get(r.p.id) ?? 0,
      status: productStatus({ stock, isNew: r.p.isNew, categorySlug: r.categorySlug }),
    };
  });
  if (status === "low-stock") list = list.filter((p) => p.variants.some((v) => v.stock <= 3));
  if (status === "sold-out") list = list.filter((p) => p.stock <= 0);
  return list;
}

export type AdminProduct = Awaited<ReturnType<typeof listAdminProducts>>[number];

export type ProductInput = {
  id?: number;
  name: string;
  slug?: string;
  sku: string;
  categoryId: number | null;
  price: number;
  salePrice: number | null;
  description: string;
  details: string[];
  images: string[];
  sizes: string[];
  colors: ProductColor[];
  label: string | null;
  active: boolean;
  featured: boolean;
  isNew: boolean;
  variants: { size: string | null; color: string | null; stock: number; sku?: string; price?: number | null }[];
};

async function uniqueSlug(base: string, excludeId?: number) {
  const db = await getDb();
  let slug = slugify(base) || "produto";
  for (let i = 2; ; i++) {
    const rows = await db
      .select({ id: products.id })
      .from(products)
      .where(excludeId ? and(eq(products.slug, slug), ne(products.id, excludeId)) : eq(products.slug, slug));
    if (!rows.length) return slug;
    slug = `${slugify(base)}-${i}`;
  }
}

function variantSku(base: string, size: string | null, color: string | null) {
  const part = (v: string | null) => (v ? v.normalize("NFD").replace(/[^a-zA-Z0-9]/g, "").slice(0, 3).toUpperCase() : "");
  return [base, part(color), part(size)].filter(Boolean).join("-");
}

export async function skuTaken(sku: string, excludeId?: number) {
  const db = await getDb();
  const rows = await db
    .select({ id: products.id })
    .from(products)
    .where(excludeId ? and(eq(products.sku, sku), ne(products.id, excludeId)) : eq(products.sku, sku));
  return rows.length > 0;
}

export async function saveProduct(input: ProductInput) {
  const db = await getDb();
  const slug = await uniqueSlug(input.slug || input.name, input.id);
  const values = {
    name: input.name,
    slug,
    sku: input.sku,
    categoryId: input.categoryId,
    price: input.price,
    salePrice: input.salePrice,
    description: input.description,
    details: input.details,
    images: input.images,
    sizes: input.sizes,
    colors: input.colors,
    label: input.label,
    active: input.active,
    featured: input.featured,
    isNew: input.isNew,
    updatedAt: new Date(),
  };
  return db.transaction(async (tx) => {
    let id = input.id;
    if (id) {
      await tx.update(products).set(values).where(eq(products.id, id));
    } else {
      const [maxSort] = await tx.select({ m: sql<number>`coalesce(max(${products.sortOrder}), 0)` }).from(products);
      const [row] = await tx.insert(products).values({ ...values, sortOrder: Number(maxSort.m) + 1 }).returning({ id: products.id });
      id = row.id;
    }
    // Sync variants by (size, color).
    const existing = await tx.select().from(productVariants).where(eq(productVariants.productId, id));
    const keyOf = (s: string | null, c: string | null) => `${s ?? ""}::${c ?? ""}`;
    const existingMap = new Map(existing.map((v) => [keyOf(v.size, v.color), v]));
    const keep = new Set<number>();
    const usedSkus = new Set<string>();
    for (const v of input.variants) {
      const key = keyOf(v.size, v.color);
      const found = existingMap.get(key);
      let sku = (v.sku || variantSku(input.sku, v.size, input.colors.length > 1 ? v.color : null)).toUpperCase();
      while (usedSkus.has(sku)) sku = `${sku}-X`;
      // Avoid collisions with other products' variant SKUs.
      const clash = await tx
        .select({ id: productVariants.id })
        .from(productVariants)
        .where(and(eq(productVariants.sku, sku), ne(productVariants.productId, id)));
      if (clash.length) sku = `${sku}-${id}`;
      usedSkus.add(sku);
      if (found) {
        keep.add(found.id);
        await tx
          .update(productVariants)
          .set({ stock: Math.max(0, Math.floor(v.stock)), sku, price: v.price ?? null, updatedAt: new Date() })
          .where(eq(productVariants.id, found.id));
      } else {
        const [row] = await tx
          .insert(productVariants)
          .values({ productId: id, size: v.size, color: v.color, stock: Math.max(0, Math.floor(v.stock)), sku, price: v.price ?? null })
          .returning({ id: productVariants.id });
        keep.add(row.id);
      }
    }
    const remove = existing.filter((v) => !keep.has(v.id)).map((v) => v.id);
    if (remove.length) await tx.delete(productVariants).where(inArray(productVariants.id, remove));
    return { id, slug };
  });
}

export async function duplicateProduct(id: number) {
  const db = await getDb();
  const [p] = await db.select().from(products).where(eq(products.id, id));
  if (!p) throw new Error("Produto não encontrado");
  const variants = await db.select().from(productVariants).where(eq(productVariants.productId, id));
  let sku = `${p.sku}-COPY`;
  for (let i = 2; await skuTaken(sku); i++) sku = `${p.sku}-COPY${i}`;
  return saveProduct({
    name: `${p.name} (cópia)`,
    sku,
    categoryId: p.categoryId,
    price: p.price,
    salePrice: p.salePrice,
    description: p.description,
    details: p.details,
    images: p.images,
    sizes: p.sizes,
    colors: p.colors,
    label: p.label,
    active: false,
    featured: false,
    isNew: p.isNew,
    variants: variants.map((v) => ({ size: v.size, color: v.color, stock: 0, price: v.price })),
  });
}

export async function deleteProduct(id: number) {
  const db = await getDb();
  await db.delete(products).where(eq(products.id, id));
}

export async function setProductFlag(id: number, field: "active" | "featured" | "isNew", value: boolean) {
  const db = await getDb();
  await db.update(products).set({ [field]: value, updatedAt: new Date() }).where(eq(products.id, id));
}

export async function setVariantStock(variantId: number, stock: number) {
  const db = await getDb();
  await db
    .update(productVariants)
    .set({ stock: Math.max(0, Math.floor(stock)), updatedAt: new Date() })
    .where(eq(productVariants.id, variantId));
}

/* --------------------------------------------------------------- categories */

export async function saveCategory(input: { id?: number; name: string; slug?: string; description: string; image: string | null; active: boolean; sortOrder: number }) {
  const db = await getDb();
  const slug = slugify(input.slug || input.name);
  const clash = await db
    .select({ id: categories.id })
    .from(categories)
    .where(input.id ? and(eq(categories.slug, slug), ne(categories.id, input.id)) : eq(categories.slug, slug));
  if (clash.length) throw new Error("Já existe uma categoria com este slug.");
  const values = { name: input.name, slug, description: input.description, image: input.image, active: input.active, sortOrder: input.sortOrder, updatedAt: new Date() };
  if (input.id) {
    await db.update(categories).set(values).where(eq(categories.id, input.id));
    return input.id;
  }
  const [row] = await db.insert(categories).values(values).returning({ id: categories.id });
  return row.id;
}

export async function deleteCategory(id: number) {
  const db = await getDb();
  await db.delete(categories).where(eq(categories.id, id));
}

/* -------------------------------------------------------------------- media */

export async function saveMedia(data: Buffer, mime: string, width?: number, height?: number) {
  const db = await getDb();
  const [row] = await db
    .insert(media)
    .values({ data, mime, width: width ?? null, height: height ?? null, size: data.byteLength })
    .returning({ id: media.id });
  return row.id;
}

export async function getMedia(id: number) {
  const db = await getDb();
  const [row] = await db.select().from(media).where(eq(media.id, id));
  return row ?? null;
}

/* ---------------------------------------------------------------- utilities */

export async function clearTransactionalData() {
  const db = await getDb();
  await db.transaction(async (tx) => {
    await tx.delete(schema.analyticsEvents);
    await tx.delete(schema.orderStatusHistory);
    await tx.delete(schema.orderItems);
    await tx.delete(schema.orders);
    await tx.delete(schema.customers);
  });
}

