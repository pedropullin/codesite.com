import "server-only";
import { createHash, randomBytes } from "node:crypto";
import { and, eq, gt } from "drizzle-orm";
import { getDb, schema } from "@/db";
import { hashPassword } from "./password";

const TTL_MS = 30 * 60 * 1000;
const sha256 = (s: string) => createHash("sha256").update(s).digest("hex");

/**
 * Creates a reset token and delivers the link. With RESEND_API_KEY configured
 * the link is e-mailed; otherwise it is written to the server log (and shown
 * on screen in development only).
 */
export async function requestPasswordReset(email: string, origin: string) {
  const db = await getDb();
  const [user] = await db.select().from(schema.users).where(eq(schema.users.email, email.toLowerCase().trim()));
  if (!user) return { delivered: false as const, devLink: null };
  const token = randomBytes(32).toString("hex");
  await db
    .update(schema.users)
    .set({ resetTokenHash: sha256(token), resetTokenExpiresAt: new Date(Date.now() + TTL_MS) })
    .where(eq(schema.users.id, user.id));
  const link = `${origin}/admin/reset-password?token=${token}`;

  if (process.env.RESEND_API_KEY && process.env.RESET_EMAIL_FROM) {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: process.env.RESET_EMAIL_FROM,
        to: user.email,
        subject: "Vault Association — redefinição de senha",
        text: `Olá, ${user.name}.\n\nPara criar uma nova senha acesse o link abaixo (válido por 30 minutos):\n${link}\n\nSe você não solicitou, ignore este e-mail.`,
      }),
    });
    if (res.ok) return { delivered: true as const, devLink: null };
    console.error("[auth] Failed to send reset e-mail", res.status, await res.text());
  }
  console.info(`[auth] Password reset link for ${user.email}: ${link}`);
  return { delivered: false as const, devLink: process.env.NODE_ENV !== "production" ? link : null };
}

export async function validateResetToken(token: string) {
  if (!/^[a-f0-9]{64}$/.test(token)) return null;
  const db = await getDb();
  const [user] = await db
    .select({ id: schema.users.id, email: schema.users.email })
    .from(schema.users)
    .where(and(eq(schema.users.resetTokenHash, sha256(token)), gt(schema.users.resetTokenExpiresAt, new Date())));
  return user ?? null;
}

export async function resetPassword(token: string, password: string) {
  const user = await validateResetToken(token);
  if (!user) return false;
  const db = await getDb();
  await db
    .update(schema.users)
    .set({ passwordHash: await hashPassword(password), resetTokenHash: null, resetTokenExpiresAt: null, updatedAt: new Date() })
    .where(eq(schema.users.id, user.id));
  return true;
}
