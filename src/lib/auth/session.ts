import "server-only";
import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { SignJWT, jwtVerify } from "jose";
import { getDb, schema } from "@/db";
import { getSessionSecretFromDb } from "@/lib/data/settings";

export const SESSION_COOKIE = "vault_session";
const MAX_AGE = 60 * 60 * 24 * 7; // 7 days

let cachedKey: Uint8Array | null = null;

/** SESSION_SECRET env var, or a random secret generated at seed time and kept in the DB. */
async function getKey() {
  if (cachedKey) return cachedKey;
  const secret = process.env.SESSION_SECRET || (await getSessionSecretFromDb());
  if (!secret) throw new Error("Missing session secret");
  cachedKey = new TextEncoder().encode(secret);
  return cachedKey;
}

export type SessionPayload = { userId: number; role: string };

export async function createSession(userId: number, role: string) {
  const token = await new SignJWT({ userId, role })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${MAX_AGE}s`)
    .sign(await getKey());
  const store = await cookies();
  store.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: MAX_AGE,
  });
}

export async function destroySession() {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
}

export const getSession = cache(async (): Promise<SessionPayload | null> => {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, await getKey(), { algorithms: ["HS256"] });
    if (typeof payload.userId !== "number") return null;
    return { userId: payload.userId, role: String(payload.role ?? "admin") };
  } catch {
    return null;
  }
});

/** Verifies the session against the database. Use in every admin page and action. */
export const getCurrentAdmin = cache(async () => {
  const session = await getSession();
  if (!session) return null;
  const db = await getDb();
  const [user] = await db
    .select({ id: schema.users.id, name: schema.users.name, email: schema.users.email, role: schema.users.role })
    .from(schema.users)
    .where(eq(schema.users.id, session.userId));
  return user ?? null;
});

export async function requireAdmin() {
  const user = await getCurrentAdmin();
  if (!user) redirect("/admin/login");
  return user;
}
