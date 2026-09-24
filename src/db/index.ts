import "server-only";
import { createDatabase, runMigrations, type Database } from "./client";
import { isDatabaseEmpty, seedDatabase } from "./seed";

export * as schema from "./schema";

type State = { db: Database; ready: Promise<void> };
const globalForDb = globalThis as unknown as { __vaultDb?: State };

function init(): State {
  const { db, client } = createDatabase();
  const ready = (async () => {
    await runMigrations(db, client);
    if (await isDatabaseEmpty(db)) {
      await seedDatabase(db, {
        demo: process.env.SEED_DEMO_DATA !== "false",
      });
    }
  })();
  return { db, ready };
}

/**
 * Returns the database, running migrations (and the first-run seed) once per
 * process. Safe to call from any server component, action or route handler.
 */
export async function getDb(): Promise<Database> {
  globalForDb.__vaultDb ??= init();
  try {
    await globalForDb.__vaultDb.ready;
  } catch (error) {
    globalForDb.__vaultDb = undefined;
    throw error;
  }
  return globalForDb.__vaultDb.db;
}
