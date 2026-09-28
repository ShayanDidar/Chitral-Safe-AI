/**
 * Creates/updates database tables and seeds demo content.
 *   npm run db:migrate
 * Runs automatically during `npm run build` when DATABASE_URL is set (e.g. on Vercel).
 * Without DATABASE_URL it targets the local PGlite database in ./.data/pglite.
 */
import { mkdirSync } from "node:fs";
import path from "node:path";
import { seedIfEmpty } from "../lib/server/db/seed";
import type { DB } from "../lib/server/db";
import * as schema from "../lib/server/db/schema";

const migrationsFolder = path.join(process.cwd(), "drizzle");

async function main() {
  const url = process.env.DATABASE_URL?.trim();
  if (url) {
    const { drizzle } = await import("drizzle-orm/node-postgres");
    const { migrate } = await import("drizzle-orm/node-postgres/migrator");
    const { Pool } = await import("pg");
    const pool = new Pool({
      connectionString: url,
      ssl: /localhost|127\.0\.0\.1/.test(url) ? undefined : { rejectUnauthorized: false },
    });
    const db = drizzle(pool, { schema, casing: "snake_case" });
    await migrate(db, { migrationsFolder });
    await seedIfEmpty(db as unknown as DB);
    await pool.end();
    console.log("✓ Postgres migrated and seeded");
    return;
  }
  if (process.env.VERCEL) {
    console.warn(
      "⚠ DATABASE_URL is not set. Reports, accounts and the admin portal need a Postgres database on Vercel — " +
        "add DATABASE_URL in Project Settings → Environment Variables and redeploy.",
    );
    return;
  }
  const { PGlite } = await import("@electric-sql/pglite");
  const { drizzle } = await import("drizzle-orm/pglite");
  const { migrate } = await import("drizzle-orm/pglite/migrator");
  const dir = process.env.PGLITE_DIR || path.join(process.cwd(), ".data", "pglite");
  mkdirSync(dir, { recursive: true });
  const client = new PGlite(dir);
  const db = drizzle(client, { schema, casing: "snake_case" });
  await migrate(db, { migrationsFolder });
  await seedIfEmpty(db as unknown as DB);
  await client.close();
  console.log("✓ Local PGlite database migrated and seeded (.data/pglite)");
}

main().catch((err) => {
  console.error("Database migration failed:", err);
  process.exit(1);
});
