import { getCurrentAdmin } from "@/lib/auth/session";
import { saveMedia } from "@/lib/data/admin";

const ALLOWED = new Set(["image/webp", "image/jpeg", "image/png", "image/avif", "image/svg+xml"]);
const MAX_BYTES = 6 * 1024 * 1024;

/** Stores an uploaded image (compressed client-side) and returns its public URL. */
export async function POST(request: Request) {
  const admin = await getCurrentAdmin();
  if (!admin) return Response.json({ error: "Não autorizado" }, { status: 401 });
  const form = await request.formData();
  const file = form.get("file");
  if (!(file instanceof File)) return Response.json({ error: "Arquivo ausente" }, { status: 400 });
  if (!ALLOWED.has(file.type)) return Response.json({ error: "Formato não suportado (use WEBP, JPG, PNG, AVIF ou SVG)" }, { status: 415 });
  if (file.size > MAX_BYTES) return Response.json({ error: "Imagem acima de 6 MB" }, { status: 413 });
  const buf = Buffer.from(await file.arrayBuffer());
  if (file.type === "image/svg+xml" && /<script|on\w+=/i.test(buf.toString("utf8"))) {
    return Response.json({ error: "SVG inválido" }, { status: 400 });
  }
  const width = Number(form.get("width")) || undefined;
  const height = Number(form.get("height")) || undefined;
  const id = await saveMedia(buf, file.type, width, height);
  const ext = file.type === "image/svg+xml" ? "svg" : file.type.split("/")[1];
  return Response.json({ url: `/media/${id}.${ext}` });
}
