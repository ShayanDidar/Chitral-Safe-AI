import { eq } from "drizzle-orm";
import { z } from "zod";
import { createSession, hashPassword, isBootstrapAdmin, verifyPassword } from "@/lib/server/auth";
import { getDb } from "@/lib/server/db";
import { users } from "@/lib/server/db/schema";
import { HttpError, clientIp, rateLimit, route } from "@/lib/server/http";

const Body = z.object({
  email: z.string().trim().toLowerCase().max(200),
  password: z.string().max(200),
});

export const POST = route(async (req) => {
  const body = Body.parse(await req.json());
  rateLimit(`login:${clientIp(req)}`, 20, 15 * 60_000);
  rateLimit(`login:${body.email}`, 8, 15 * 60_000);
  const db = await getDb();
  const [user] = await db.select().from(users).where(eq(users.email, body.email));
  // Hash even when the user doesn't exist, so response time doesn't reveal which emails are registered.
  const ok = user ? await verifyPassword(body.password, user.passwordHash) : (await hashPassword(body.password), false);
  if (!user || !ok) throw new HttpError(401, "invalid_credentials", "Email or password is incorrect.");
  if (user.role !== "admin" && isBootstrapAdmin(user.email)) {
    await db.update(users).set({ role: "admin" }).where(eq(users.id, user.id));
  }
  await createSession(user.id);
  return Response.json({ ok: true });
});
