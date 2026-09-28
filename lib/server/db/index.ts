/**
 * Database connection (server-only).
 *
 * - With DATABASE_URL set (production / Vercel): connects to that Postgres
 *   database. Run `npm run db:migrate` (done automatically by `npm run build`)
 *   to create tables and seed demo content.
 * - Without DATABASE_URL (local development): uses PGlite, an embedded
 *   Postgres stored in ./.data/pglite, migrated and seeded on first use.
 */
import { mkdirSync } from "node:fs";
import path from "node:path";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import * as schema from "./schema";

export type DB = NodePgDatabase<typeof schema>;

const MIGRATIONS = path.join(process.cwd(), "drizzle");

declare global {
  var __chitralDb: Promise<DB> | undefined;
}

async function connect(): Promise<DB> {
  const url = process.env.DATABASE_URL?.trim();
  if (url) {
    const { drizzle } = await import("drizzle-orm/node-postgres");
    const { Pool } = await import("pg");
    const pool = new Pool({
      connectionString: url,
      max: 5,
      ssl: /localhost|127\.0\.0\.1/.test(url) ? undefined : { rejectUnauthorized: false },
    });
    return drizzle(pool, { schema, casing: "snake_case" });
  }

  const { PGlite } = await import("@electric-sql/pglite");
  const { drizzle } = await import("drizzle-orm/pglite");
  const { migrate } = await import("drizzle-orm/pglite/migrator");
  const dir = process.env.PGLITE_DIR || path.join(process.cwd(), ".data", "pglite");
  mkdirSync(dir, { recursive: true });
  const client = new PGlite(dir);
  const db = drizzle(client, { schema, casing: "snake_case" });
  await migrate(db, { migrationsFolder: MIGRATIONS });
  const { seedIfEmpty } = await import("./seed");
  await seedIfEmpty(db as unknown as DB);
  return db as unknown as DB;
}

export function getDb(): Promise<DB> {
  globalThis.__chitralDb ??= connect().catch((err) => {
    globalThis.__chitralDb = undefined;
    throw err;
  });
  return globalThis.__chitralDb;
}

export { schema };
