"use server";

import { inArray, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getDb, schema } from "@/db";
import { OrderError, placeOrder } from "@/lib/data/orders";
import { getSettings, whatsappLink } from "@/lib/data/settings";
import { rateLimit } from "@/lib/auth/rate-limit";
import { buildOrderMessage } from "@/lib/whatsapp";
import { onlyDigits } from "@/lib/format";
import { headers } from "next/headers";

const UF = ["AC","AL","AP","AM","BA","CE","DF","ES","GO","MA","MT","MS","MG","PA","PB","PR","PE","PI","RJ","RN","RS","RO","RR","SC","SP","SE","TO"] as const;

const checkoutSchema = z.object({
  name: z.string().trim().min(3, "Informe seu nome completo").max(120),
  email: z.string().trim().email("E-mail inválido").max(160),
  phone: z.string().transform(onlyDigits).pipe(z.string().min(10, "Telefone inválido").max(13)),
  cep: z.string().transform(onlyDigits).pipe(z.string().length(8, "CEP inválido")),
  address: z.string().trim().min(3, "Informe o endereço").max(160),
  number: z.string().trim().min(1, "Informe o número").max(20),
  complement: z.string().trim().max(80).optional().default(""),
  district: z.string().trim().max(80).optional().default(""),
  city: z.string().trim().min(2, "Informe a cidade").max(80),
  state: z.enum(UF, { message: "Selecione o estado" }),
  notes: z.string().trim().max(600).optional().default(""),
  channel: z.enum(["site", "whatsapp"]),
  sessionId: z.string().max(64).optional(),
  items: z
    .array(z.object({ variantId: z.number().int().positive(), quantity: z.number().int().min(1).max(20) }))
    .min(1, "Seu carrinho está vazio")
    .max(50),
});

export type CheckoutInput = Omit<z.input<typeof checkoutSchema>, "state"> & { state: string };

export type CheckoutResult =
  | { ok: true; number: number; token: string; whatsappUrl: string }
  | { ok: false; error: string; details?: string[]; fieldErrors?: Record<string, string> };

export async function placeOrderAction(input: CheckoutInput): Promise<CheckoutResult> {
  const h = await headers();
  const ip = h.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local";
  if (!rateLimit(`checkout:${ip}`, 12, 10 * 60_000).ok) {
    return { ok: false, error: "Muitas tentativas. Aguarde alguns minutos e tente novamente." };
  }
  const parsed = checkoutSchema.safeParse(input);
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = String(issue.path[0] ?? "form");
      fieldErrors[key] ??= issue.message;
    }
    return { ok: false, error: "Revise os campos destacados.", fieldErrors };
  }
  const d = parsed.data;
  try {
    const { order, items } = await placeOrder({
      customer: { name: d.name, email: d.email, phone: d.phone },
      address: { cep: d.cep, address: d.address, number: d.number, complement: d.complement, district: d.district, city: d.city, state: d.state },
      notes: d.notes,
      channel: d.channel,
      items: d.items,
      sessionId: d.sessionId,
    });
    const settings = await getSettings();
    const message = buildOrderMessage({
      number: order.number,
      brand: settings.brand.name,
      customer: { name: order.customerName, email: order.customerEmail, phone: order.customerPhone },
      address: { cep: order.cep, address: order.address, number: order.addressNumber, complement: order.complement, district: order.district, city: order.city, state: order.state },
      items,
      subtotal: order.subtotal,
      shipping: order.shipping,
      total: order.total,
      notes: order.notes,
      shippingNote: settings.texts.shippingNote,
    });
    revalidatePath("/", "layout");
    return { ok: true, number: order.number, token: order.accessToken, whatsappUrl: whatsappLink(settings.contact.whatsapp, message) };
  } catch (e) {
    if (e instanceof OrderError) return { ok: false, error: e.message, details: e.details };
    console.error("[checkout]", e);
    return { ok: false, error: "Não foi possível finalizar o pedido agora. Tente novamente em instantes." };
  }
}

/** Returns live stock and prices for the variants in the cart. */
export async function refreshCartAction(variantIds: number[]) {
  const ids = variantIds.filter((n) => Number.isInteger(n) && n > 0).slice(0, 50);
  if (!ids.length) return [];
  const db = await getDb();
  const rows = await db
    .select({ v: schema.productVariants, p: schema.products })
    .from(schema.productVariants)
    .innerJoin(schema.products, eq(schema.productVariants.productId, schema.products.id))
    .where(inArray(schema.productVariants.id, ids));
  return rows.map(({ v, p }) => {
    const base = p.salePrice && p.salePrice < p.price ? p.salePrice : p.price;
    return {
      variantId: v.id,
      available: p.active,
      stock: v.stock,
      unitPrice: v.price ?? base,
      name: p.name,
    };
  });
}
