import { eq } from "drizzle-orm";
import { z } from "zod";
import { requireUser } from "@/lib/server/auth";
import { getDb } from "@/lib/server/db";
import { users } from "@/lib/server/db/schema";
import { route } from "@/lib/server/http";
import { toCurrentUser } from "@/lib/server/users";

const optional = (schema: z.ZodType<string>) =>
  z.preprocess((v) => (typeof v === "string" && v.trim() === "" ? null : v), schema.nullable());

const Body = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters.").max(60),
  bio: z.string().trim().max(300, "Bio must be 300 characters or fewer."),
  phone: optional(z.string().trim().regex(/^\+?[0-9][0-9 \-()]{5,24}$/, "Enter a valid phone number.")),
  contactEmail: optional(z.email("Enter a valid email address.").trim().max(200)),
});

export const PATCH = route(async (req) => {
  const user = await requireUser();
  const body = Body.parse(await req.json());
  const db = await getDb();
  await db
    .update(users)
    .set({ ...body, updatedAt: new Date() })
    .where(eq(users.id, user.id));
  return Response.json({ user: toCurrentUser({ ...user, ...body }) });
});
