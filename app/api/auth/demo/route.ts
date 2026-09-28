import { randomBytes } from "node:crypto";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { createSession } from "@/lib/server/auth";
import { getDb } from "@/lib/server/db";
import { users } from "@/lib/server/db/schema";
import { notFound, route } from "@/lib/server/http";
import { DEMO_ACCOUNTS, demoLoginEnabled } from "@/lib/server/demoAccounts";

const Body = z.object({ account: z.enum(["admin", "user"]) });

/** Signs in as a demo account without a password (only while DEMO_LOGIN is not "false"). */
export const POST = route(async (req) => {
  if (!demoLoginEnabled()) throw notFound();
  const { account } = Body.parse(await req.json());
  const demo = DEMO_ACCOUNTS[account];
  const db = await getDb();
  const [existing] = await db.select({ id: users.id }).from(users).where(eq(users.email, demo.email));
  let id = existing?.id;
  if (id) {
    await db.update(users).set({ role: demo.role }).where(eq(users.id, id));
  } else {
    [{ id }] = await db
      .insert(users)
      .values({
        email: demo.email,
        name: demo.name,
        role: demo.role,
        // No usable password: demo accounts can only be entered through this button.
        passwordHash: `disabled$${randomBytes(16).toString("hex")}`,
      })
      .returning({ id: users.id });
  }
  await createSession(id!);
  return Response.json({ ok: true });
});
