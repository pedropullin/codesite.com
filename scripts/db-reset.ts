/**
 * Resets the local database and seeds it again.
 *   npm run db:reset            → catalog + demo history
 *   npm run db:reset -- --clean → catalog only (no demo orders/analytics)
 */
import fs from "node:fs";
import { createDatabase, resolveDatabaseUrl, runMigrations } from "../src/db/client";
import { seedDatabase } from "../src/db/seed";

async function main() {
  const url = resolveDatabaseUrl();
  if (url.startsWith("file:")) {
    const file = url.slice("file:".length);
    for (const suffix of ["", "-wal", "-shm"]) fs.rmSync(file + suffix, { force: true });
    console.log(`Removed ${file}`);
  } else {
    console.error("Refusing to reset a remote database. Drop its tables manually first.");
    process.exit(1);
  }
  const { db, client } = createDatabase();
  await runMigrations(db, client);
  const demo = !process.argv.includes("--clean");
  const t = Date.now();
  await seedDatabase(db, { demo });
  console.log(`Seeded (${demo ? "with" : "without"} demo activity) in ${Date.now() - t}ms`);
  client.close();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
