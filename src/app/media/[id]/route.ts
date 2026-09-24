import { getMedia } from "@/lib/data/admin";

/** Serves images uploaded through the admin (stored in the MEDIA table). */
export async function GET(_req: Request, ctx: RouteContext<"/media/[id]">) {
  const { id } = await ctx.params;
  const numeric = Number(id.replace(/\.\w+$/, ""));
  if (!Number.isInteger(numeric) || numeric <= 0) return new Response("Not found", { status: 404 });
  const row = await getMedia(numeric);
  if (!row) return new Response("Not found", { status: 404 });
  return new Response(new Uint8Array(row.data), {
    headers: {
      "Content-Type": row.mime,
      "Content-Length": String(row.size),
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
