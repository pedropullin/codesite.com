"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { ORDER_STATUSES, type ProductColor } from "@/db/schema";
import { requireAdmin } from "@/lib/auth/session";
import {
  clearTransactionalData,
  deleteCategory,
  deleteProduct,
  duplicateProduct,
  saveCategory,
  saveProduct,
  setProductFlag,
  setVariantStock,
  skuTaken,
} from "@/lib/data/admin";
import { OrderError, updateOrderStatus } from "@/lib/data/orders";
import { saveSettings } from "@/lib/data/settings";
import { settingsSchemas, type SettingsKey, type StoreSettings } from "@/lib/settings-schema";

export type ActionResult<T = unknown> = { ok: true; data?: T; message?: string } | { ok: false; error: string; fieldErrors?: Record<string, string> };

/** Every storefront page reads from the database; refresh caches after writes. */
function refreshStore() {
  revalidatePath("/", "layout");
}

function fieldErrors(error: z.ZodError) {
  const out: Record<string, string> = {};
  for (const i of error.issues) out[i.path.join(".")] ??= i.message;
  return out;
}

/* ------------------------------------------------------------------ products */

const imageUrl = z.string().trim().max(500).refine((v) => v.startsWith("/") || /^https:\/\//.test(v), "URL de imagem inválida");

const productSchema = z
  .object({
    id: z.number().int().positive().optional(),
    name: z.string().trim().min(2, "Informe o nome").max(120),
    slug: z.string().trim().max(120).optional(),
    sku: z.string().trim().min(2, "Informe o SKU").max(40).regex(/^[A-Za-z0-9-_.]+$/, "Use letras, números e hífens").transform((s) => s.toUpperCase()),
    categoryId: z.number().int().positive().nullable(),
    price: z.number().int().min(1, "Informe o preço").max(100_000_000),
    salePrice: z.number().int().min(1).max(100_000_000).nullable(),
    description: z.string().trim().max(4000),
    details: z.array(z.string().trim().min(1).max(160)).max(12),
    images: z.array(imageUrl).max(12),
    sizes: z.array(z.string().trim().min(1).max(20)).max(20),
    colors: z.array(z.object({ name: z.string().trim().min(1).max(30), hex: z.string().regex(/^#[0-9a-fA-F]{6}$/, "Cor inválida"), image: z.string().max(500).optional() })).max(12),
    label: z.string().trim().max(40).nullable(),
    active: z.boolean(),
    featured: z.boolean(),
    isNew: z.boolean(),
    variants: z
      .array(z.object({ size: z.string().nullable(), color: z.string().nullable(), stock: z.number().int().min(0).max(100000), sku: z.string().max(60).optional(), price: z.number().int().positive().nullable().optional() }))
      .min(1, "Adicione ao menos uma variação")
      .max(200),
  })
  .refine((p) => p.salePrice == null || p.salePrice < p.price, { message: "O preço promocional deve ser menor que o preço", path: ["salePrice"] });

export type ProductFormInput = z.input<typeof productSchema>;

export async function saveProductAction(input: ProductFormInput): Promise<ActionResult<{ id: number; slug: string }>> {
  await requireAdmin();
  const parsed = productSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Revise os campos destacados.", fieldErrors: fieldErrors(parsed.error) };
  const p = parsed.data;
  if (await skuTaken(p.sku, p.id)) return { ok: false, error: "SKU já utilizado por outro produto.", fieldErrors: { sku: "SKU já utilizado" } };
  try {
    const saved = await saveProduct({
      ...p,
      colors: p.colors.map((c): ProductColor => ({ name: c.name, hex: c.hex, ...(c.image ? { image: c.image } : {}) })),
    });
    refreshStore();
    return { ok: true, data: saved, message: p.id ? "Produto atualizado" : "Produto criado" };
  } catch (e) {
    console.error("[admin] saveProduct", e);
    return { ok: false, error: "Não foi possível salvar o produto." };
  }
}

export async function duplicateProductAction(id: number): Promise<ActionResult<{ id: number }>> {
  await requireAdmin();
  try {
    const r = await duplicateProduct(id);
    refreshStore();
    return { ok: true, data: { id: r.id }, message: "Produto duplicado (inativo, estoque zerado)" };
  } catch {
    return { ok: false, error: "Não foi possível duplicar." };
  }
}

export async function deleteProductAction(id: number): Promise<ActionResult> {
  await requireAdmin();
  await deleteProduct(id);
  refreshStore();
  return { ok: true, message: "Produto excluído" };
}

export async function setProductFlagAction(id: number, field: "active" | "featured" | "isNew", value: boolean): Promise<ActionResult> {
  await requireAdmin();
  if (!["active", "featured", "isNew"].includes(field)) return { ok: false, error: "Campo inválido" };
  await setProductFlag(id, field, value);
  refreshStore();
  return { ok: true };
}

export async function setVariantStockAction(variantId: number, stock: number): Promise<ActionResult> {
  await requireAdmin();
  if (!Number.isInteger(stock) || stock < 0 || stock > 100000) return { ok: false, error: "Estoque inválido" };
  await setVariantStock(variantId, stock);
  refreshStore();
  return { ok: true, message: "Estoque atualizado" };
}

/* ---------------------------------------------------------------- categories */

const categorySchema = z.object({
  id: z.number().int().positive().optional(),
  name: z.string().trim().min(2, "Informe o nome").max(60),
  slug: z.string().trim().max(60).optional(),
  description: z.string().trim().max(300),
  image: imageUrl.nullable(),
  active: z.boolean(),
  sortOrder: z.number().int().min(0).max(999),
});

export async function saveCategoryAction(input: z.input<typeof categorySchema>): Promise<ActionResult> {
  await requireAdmin();
  const parsed = categorySchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Revise os campos.", fieldErrors: fieldErrors(parsed.error) };
  try {
    await saveCategory(parsed.data);
    refreshStore();
    return { ok: true, message: parsed.data.id ? "Categoria atualizada" : "Categoria criada" };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Erro ao salvar" };
  }
}

export async function deleteCategoryAction(id: number): Promise<ActionResult> {
  await requireAdmin();
  await deleteCategory(id);
  refreshStore();
  return { ok: true, message: "Categoria excluída — produtos ficaram sem categoria" };
}

/* -------------------------------------------------------------------- orders */

export async function updateOrderStatusAction(id: number, status: string, note?: string): Promise<ActionResult> {
  await requireAdmin();
  const s = z.enum(ORDER_STATUSES).safeParse(status);
  if (!s.success) return { ok: false, error: "Status inválido" };
  try {
    await updateOrderStatus(id, s.data, note?.slice(0, 300));
    refreshStore();
    return { ok: true, message: "Status atualizado" };
  } catch (e) {
    return { ok: false, error: e instanceof OrderError ? e.message : "Não foi possível atualizar o pedido." };
  }
}

/* ------------------------------------------------------------------ settings */

export async function saveSettingsAction<K extends SettingsKey>(key: K, value: StoreSettings[K]): Promise<ActionResult> {
  await requireAdmin();
  if (!(key in settingsSchemas)) return { ok: false, error: "Seção inválida" };
  const parsed = settingsSchemas[key].safeParse(value);
  if (!parsed.success) return { ok: false, error: "Revise os campos.", fieldErrors: fieldErrors(parsed.error) };
  await saveSettings(key, parsed.data as StoreSettings[K]);
  refreshStore();
  return { ok: true, message: "Configurações salvas — o site já foi atualizado" };
}

export async function clearDataAction(confirmation: string): Promise<ActionResult> {
  await requireAdmin();
  if (confirmation !== "LIMPAR") return { ok: false, error: 'Digite "LIMPAR" para confirmar.' };
  await clearTransactionalData();
  refreshStore();
  return { ok: true, message: "Pedidos, clientes e eventos de analytics removidos" };
}
