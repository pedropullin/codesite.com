import { z } from "zod";
import { trackEvent } from "@/lib/data/analytics";
import { rateLimit } from "@/lib/auth/rate-limit";

const schema = z.object({
  type: z.enum(["page_view", "product_view", "add_to_cart", "checkout_start"]),
  sessionId: z.string().min(1).max(64),
  path: z.string().max(300).optional(),
  productId: z.number().int().positive().optional(),
  value: z.number().int().nonnegative().optional(),
});

const BOT = /bot|crawler|spider|crawling|headless|lighthouse/i;

export async function POST(request: Request) {
  if (BOT.test(request.headers.get("user-agent") ?? "")) return new Response(null, { status: 204 });
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local";
  if (!rateLimit(`track:${ip}`, 240, 60_000).ok) return new Response(null, { status: 429 });
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return new Response(null, { status: 400 });
  }
  const parsed = schema.safeParse(body);
  if (!parsed.success) return new Response(null, { status: 400 });
  if (parsed.data.path?.startsWith("/admin")) return new Response(null, { status: 204 });
  try {
    await trackEvent(parsed.data);
  } catch (e) {
    console.error("[track]", e);
    return new Response(null, { status: 500 });
  }
  return new Response(null, { status: 204 });
}
