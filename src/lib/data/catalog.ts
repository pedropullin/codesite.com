import "server-only";
import { cache } from "react";
import { and, asc, desc, eq, inArray, ne, sql } from "drizzle-orm";
import { getDb, schema } from "@/db";
import type { Product, ProductVariant } from "@/db/schema";
import type { ProductCardData, ProductDetail, ProductStatusCode } from "@/lib/types";

const { products, productVariants, categories } = schema;

export type CatalogSort = "featured" | "newest" | "price-asc" | "price-desc" | "name";

export type CatalogFilter = {
  q?: string;
  category?: string;
  sort?: CatalogSort;
  minPrice?: number;
  maxPrice?: number;
  availability?: "in-stock" | "sold-out";
  featured?: boolean;
  isNew?: boolean;
  onSale?: boolean;
  size?: string;
  color?: string;
  includeInactive?: boolean;
  limit?: number;
};

export function productStatus(p: { stock: number; isNew: boolean; categorySlug?: string | null }): {
  code: ProductStatusCode;
  label: string;
} {
  if (p.stock <= 0) return { code: "sold-out", label: "Sold out" };
  if (p.stock <= 3) return { code: "last-units", label: "Last units" };
  if (p.isNew) return { code: "new", label: "New" };
  if (p.categorySlug === "exclusives") return { code: "limited", label: "Limited" };
  return { code: "available", label: "Available" };
}

function toCard(
  p: Product,
  category: { name: string; slug: string } | null,
  stock: number,
): ProductCardData {
  const effectivePrice = p.salePrice && p.salePrice < p.price ? p.salePrice : p.price;
  return {
    id: p.id,
    slug: p.slug,
    name: p.name,
    sku: p.sku,
    price: p.price,
    salePrice: p.salePrice && p.salePrice < p.price ? p.salePrice : null,
    effectivePrice,
    image: p.images[0] ?? null,
    images: p.images,
    category,
    stock,
    status: productStatus({ stock, isNew: p.isNew, categorySlug: category?.slug }),
    label: p.label,
    isNew: p.isNew,
    featured: p.featured,
    colors: p.colors,
    sizes: p.sizes,
    createdAt: p.createdAt.getTime(),
  };
}

async function loadStock(ids: number[]) {
  if (!ids.length) return new Map<number, number>();
  const db = await getDb();
  const rows = await db
    .select({
      productId: productVariants.productId,
      stock: sql<number>`coalesce(sum(${productVariants.stock}), 0)`,
    })
    .from(productVariants)
    .where(inArray(productVariants.productId, ids))
    .groupBy(productVariants.productId);
  return new Map(rows.map((r) => [r.productId, Number(r.stock)]));
}

export const getCategories = cache(async (opts: { includeInactive?: boolean } = {}) => {
  const db = await getDb();
  const rows = await db
    .select({
      id: categories.id,
      name: categories.name,
      slug: categories.slug,
      description: categories.description,
      image: categories.image,
      sortOrder: categories.sortOrder,
      active: categories.active,
      productCount: sql<number>`(select count(*) from "products" p where p."category_id" = "categories"."id" and p."active" = 1)`,
    })
    .from(categories)
    .where(opts.includeInactive ? undefined : eq(categories.active, true))
    .orderBy(asc(categories.sortOrder), asc(categories.name));
  return rows.map((r) => ({ ...r, productCount: Number(r.productCount) }));
});

export async function getProducts(filter: CatalogFilter = {}): Promise<ProductCardData[]> {
  const db = await getDb();
  const where = [];
  if (!filter.includeInactive) where.push(eq(products.active, true));
  if (filter.category) where.push(eq(categories.slug, filter.category));
  if (filter.featured) where.push(eq(products.featured, true));
  if (filter.isNew) where.push(eq(products.isNew, true));
  if (filter.onSale) where.push(sql`${products.salePrice} is not null and ${products.salePrice} < ${products.price}`);
  const effective = sql<number>`coalesce(${products.salePrice}, ${products.price})`;
  if (filter.minPrice != null) where.push(sql`${effective} >= ${filter.minPrice}`);
  if (filter.maxPrice != null) where.push(sql`${effective} <= ${filter.maxPrice}`);
  if (filter.q) {
    const q = `%${filter.q.toLowerCase().trim()}%`;
    where.push(
      sql`(lower(${products.name}) like ${q} or lower(${products.sku}) like ${q} or lower(${products.description}) like ${q} or lower(coalesce(${categories.name}, '')) like ${q})`,
    );
  }
  if (filter.size) where.push(sql`exists (select 1 from json_each(${products.sizes}) where value = ${filter.size})`);
  if (filter.color) where.push(sql`exists (select 1 from json_each(${products.colors}) where json_extract(value, '$.name') = ${filter.color})`);

  const orderBy = (() => {
    switch (filter.sort) {
      case "newest":
        return [desc(products.createdAt)];
      case "price-asc":
        return [asc(effective)];
      case "price-desc":
        return [desc(effective)];
      case "name":
        return [asc(products.name)];
      default:
        return [desc(products.featured), asc(products.sortOrder), desc(products.createdAt)];
    }
  })();

  const rows = await db
    .select({ p: products, c: { name: categories.name, slug: categories.slug } })
    .from(products)
    .leftJoin(categories, eq(products.categoryId, categories.id))
    .where(where.length ? and(...where) : undefined)
    .orderBy(...orderBy);

  const stock = await loadStock(rows.map((r) => r.p.id));
  let cards = rows.map((r) => toCard(r.p, r.c?.slug ? r.c : null, stock.get(r.p.id) ?? 0));
  if (filter.availability === "in-stock") cards = cards.filter((c) => c.stock > 0);
  if (filter.availability === "sold-out") cards = cards.filter((c) => c.stock <= 0);
  if (filter.limit) cards = cards.slice(0, filter.limit);
  return cards;
}

export const getProductBySlug = cache(async (slug: string): Promise<ProductDetail | null> => {
  const db = await getDb();
  const [row] = await db
    .select({ p: products, c: { name: categories.name, slug: categories.slug } })
    .from(products)
    .leftJoin(categories, eq(products.categoryId, categories.id))
    .where(and(eq(products.slug, slug), eq(products.active, true)));
  if (!row) return null;
  const variants = await db
    .select()
    .from(productVariants)
    .where(eq(productVariants.productId, row.p.id))
    .orderBy(asc(productVariants.id));
  const stock = variants.reduce((a, v) => a + v.stock, 0);
  return {
    ...toCard(row.p, row.c?.slug ? row.c : null, stock),
    description: row.p.description,
    details: row.p.details,
    variants: variants.map((v: ProductVariant) => ({
      id: v.id,
      sku: v.sku,
      size: v.size,
      color: v.color,
      stock: v.stock,
      price: v.price,
    })),
  };
});

export async function getRelatedProducts(product: ProductDetail, limit = 4) {
  const all = await getProducts();
  const sameCategory = all.filter((p) => p.id !== product.id && p.category?.slug === product.category?.slug);
  const others = all.filter((p) => p.id !== product.id && p.category?.slug !== product.category?.slug);
  const inStockFirst = (a: ProductCardData, b: ProductCardData) => Number(b.stock > 0) - Number(a.stock > 0);
  return [...sameCategory.sort(inStockFirst), ...others.sort(inStockFirst)].slice(0, limit);
}

export async function getCatalogFacets() {
  const db = await getDb();
  const rows = await db
    .select({ sizes: products.sizes, colors: products.colors, price: products.price, salePrice: products.salePrice })
    .from(products)
    .where(eq(products.active, true));
  const sizes = new Set<string>();
  const colors = new Map<string, string>();
  let min = Infinity;
  let max = 0;
  for (const r of rows) {
    r.sizes.forEach((s) => sizes.add(s));
    r.colors.forEach((c) => colors.set(c.name, c.hex));
    const eff = r.salePrice && r.salePrice < r.price ? r.salePrice : r.price;
    min = Math.min(min, eff);
    max = Math.max(max, eff);
  }
  const sizeOrder = ["P", "M", "G", "GG", "Único"];
  return {
    sizes: [...sizes].sort((a, b) => {
      const ia = sizeOrder.indexOf(a);
      const ib = sizeOrder.indexOf(b);
      if (ia >= 0 || ib >= 0) return (ia < 0 ? 99 : ia) - (ib < 0 ? 99 : ib);
      return parseFloat(a) - parseFloat(b) || a.localeCompare(b);
    }),
    colors: [...colors.entries()].map(([name, hex]) => ({ name, hex })),
    priceRange: { min: Number.isFinite(min) ? min : 0, max },
  };
}

export async function getSpotlightProduct(slug: string) {
  const bySlug = slug ? await getProductBySlug(slug) : null;
  if (bySlug) return bySlug;
  const [first] = await getProducts({ featured: true, limit: 1 });
  return first ? getProductBySlug(first.slug) : null;
}

export async function productExists(slug: string, excludeId?: number) {
  const db = await getDb();
  const rows = await db
    .select({ id: products.id })
    .from(products)
    .where(excludeId ? and(eq(products.slug, slug), ne(products.id, excludeId)) : eq(products.slug, slug));
  return rows.length > 0;
}
