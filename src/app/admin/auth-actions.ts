"use server";

import { eq } from "drizzle-orm";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { getDb, schema } from "@/db";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { clearRateLimit, rateLimit } from "@/lib/auth/rate-limit";
import { requestPasswordReset, resetPassword } from "@/lib/auth/reset";
import { createSession, destroySession, requireAdmin } from "@/lib/auth/session";

export type AuthState = { error?: string; success?: string; devLink?: string | null } | undefined;

async function clientIp() {
  const h = await headers();
  return h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip") || "local";
}

async function origin() {
  const h = await headers();
  if (process.env.NEXT_PUBLIC_SITE_URL) return process.env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, "");
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  const proto = h.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  return `${proto}://${host}`;
}

const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email("Informe um e-mail válido"),
  password: z.string().min(1, "Informe a senha"),
  next: z.string().optional(),
});

export async function loginAction(_prev: AuthState, form: FormData): Promise<AuthState> {
  const parsed = loginSchema.safeParse(Object.fromEntries(form));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };
  const { email, password, next } = parsed.data;
  const key = `login:${await clientIp()}:${email}`;
  const limit = rateLimit(key, 8, 15 * 60_000);
  if (!limit.ok) return { error: `Muitas tentativas. Tente novamente em ${Math.ceil(limit.retryAfter / 60)} min.` };

  const db = await getDb();
  const [user] = await db.select().from(schema.users).where(eq(schema.users.email, email));
  const valid = user ? await verifyPassword(password, user.passwordHash) : await verifyPassword(password, "scrypt$AAAA$AAAA");
  if (!user || !valid) return { error: "E-mail ou senha incorretos." };

  clearRateLimit(key);
  await db.update(schema.users).set({ lastLoginAt: new Date() }).where(eq(schema.users.id, user.id));
  await createSession(user.id, user.role);
  redirect(next && next.startsWith("/admin") && !next.startsWith("//") ? next : "/admin");
}

export async function logoutAction() {
  await destroySession();
  redirect("/admin/login");
}

export async function forgotPasswordAction(_prev: AuthState, form: FormData): Promise<AuthState> {
  const email = z.string().trim().toLowerCase().email().safeParse(form.get("email"));
  if (!email.success) return { error: "Informe um e-mail válido." };
  if (!rateLimit(`forgot:${await clientIp()}`, 5, 15 * 60_000).ok) return { error: "Muitas solicitações. Aguarde alguns minutos." };
  const result = await requestPasswordReset(email.data, await origin());
  return {
    success: "Se o e-mail estiver cadastrado, você receberá um link para redefinir a senha em instantes.",
    devLink: result.devLink,
  };
}

const passwordSchema = z
  .object({
    password: z.string().min(8, "A senha deve ter ao menos 8 caracteres").max(128),
    confirm: z.string(),
  })
  .refine((d) => d.password === d.confirm, { message: "As senhas não coincidem", path: ["confirm"] });

export async function resetPasswordAction(_prev: AuthState, form: FormData): Promise<AuthState> {
  const parsed = passwordSchema.safeParse(Object.fromEntries(form));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };
  const ok = await resetPassword(String(form.get("token") ?? ""), parsed.data.password);
  if (!ok) return { error: "Link inválido ou expirado. Solicite um novo." };
  return { success: "Senha redefinida. Você já pode entrar com a nova senha." };
}

export async function changePasswordAction(_prev: AuthState, form: FormData): Promise<AuthState> {
  const admin = await requireAdmin();
  const parsed = passwordSchema.safeParse({ password: form.get("password"), confirm: form.get("confirm") });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };
  const db = await getDb();
  const [user] = await db.select().from(schema.users).where(eq(schema.users.id, admin.id));
  if (!user || !(await verifyPassword(String(form.get("current") ?? ""), user.passwordHash))) {
    return { error: "Senha atual incorreta." };
  }
  await db.update(schema.users).set({ passwordHash: await hashPassword(parsed.data.password), updatedAt: new Date() }).where(eq(schema.users.id, admin.id));
  return { success: "Senha alterada com sucesso." };
}
