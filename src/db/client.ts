import fs from "node:fs";
import path from "node:path";
import { createClient, type Client } from "@libsql/client";
import { drizzle, type LibSQLDatabase } from "drizzle-orm/libsql";
import { migrate } from "drizzle-orm/libsql/migrator";
import * as schema from "./schema";

export type Database = LibSQLDatabase<typeof schema>;

/**
 * Resolves where the database lives.
 * - DATABASE_URL (e.g. libsql://your-db.turso.io) for production.
 * - On Vercel without a DATABASE_URL we fall back to an ephemeral /tmp file
 *   so previews still work (data resets on cold starts).
 * - Locally: ./data/vault.db
 */
export function resolveDatabaseUrl() {
  if (process.env.DATABASE_URL) return process.env.DATABASE_URL;
  if (process.env.VERCEL) return "file:/tmp/vault.db";
  const dir = path.join(process.cwd(), "data");
  fs.mkdirSync(dir, { recursive: true });
  return `file:${path.join(dir, "vault.db")}`;
}

export function createDatabase(): { db: Database; client: Client } {
  const client = createClient({
    url: resolveDatabaseUrl(),
    authToken: process.env.DATABASE_AUTH_TOKEN,
  });
  const db = drizzle(client, { schema });
  return { db, client };
}

export async function runMigrations(db: Database, client: Client) {
  const url = resolveDatabaseUrl();
  if (url.startsWith("file:")) {
    await client.execute("PRAGMA journal_mode = WAL;");
    await client.execute("PRAGMA busy_timeout = 5000;");
  }
  await client.execute("PRAGMA foreign_keys = ON;");
  await migrate(db, {
    migrationsFolder: path.join(process.cwd(), "drizzle"),
  });
}
