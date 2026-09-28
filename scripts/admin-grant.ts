/**
 * Promote an existing account to admin (or demote with --revoke).
 *   npm run admin:grant -- someone@example.com
 *   npm run admin:grant -- someone@example.com --revoke
 * Uses DATABASE_URL if set, otherwise the local PGlite database.
 */
import { eq } from "drizzle-orm";
import { getDb } from "../lib/server/db";
import { users } from "../lib/server/db/schema";

async function main() {
  const email = process.argv[2]?.trim().toLowerCase();
  const revoke = process.argv.includes("--revoke");
  if (!email) throw new Error("Usage: npm run admin:grant -- <email> [--revoke]");
  const db = await getDb();
  const [row] = await db
    .update(users)
    .set({ role: revoke ? "user" : "admin", updatedAt: new Date() })
    .where(eq(users.email, email))
    .returning({ email: users.email, role: users.role });
  if (!row) throw new Error(`No account found for ${email}. Sign up first, then run this again.`);
  console.log(`✓ ${row.email} is now ${row.role}`);
  process.exit(0);
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
