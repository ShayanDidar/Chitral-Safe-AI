import { eq } from "drizzle-orm";
import { z } from "zod";
import { createSession, hashPassword, isBootstrapAdmin } from "@/lib/server/auth";
import { getDb } from "@/lib/server/db";
import { users } from "@/lib/server/db/schema";
import { HttpError, clientIp, rateLimit, route } from "@/lib/server/http";

const Body = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters.").max(60),
  email: z.email("Enter a valid email address.").trim().toLowerCase().max(200),
  password: z.string().min(8, "Password must be at least 8 characters.").max(200),
});

export const POST = route(async (req) => {
  rateLimit(`signup:${clientIp(req)}`, 10, 60 * 60_000);
  const body = Body.parse(await req.json());
  const db = await getDb();
  const [existing] = await db.select({ id: users.id }).from(users).where(eq(users.email, body.email));
  if (existing) throw new HttpError(409, "email_taken", "An account with this email already exists.");
  const [user] = await db
    .insert(users)
    .values({
      name: body.name,
      email: body.email,
      passwordHash: await hashPassword(body.password),
      role: isBootstrapAdmin(body.email) ? "admin" : "user",
    })
    .returning({ id: users.id });
  await createSession(user.id);
  return Response.json({ ok: true }, { status: 201 });
});
