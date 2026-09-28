import { eq } from "drizzle-orm";
import { requireAdmin } from "@/lib/server/auth";
import { getDb } from "@/lib/server/db";
import { emergencyContacts } from "@/lib/server/db/schema";
import { notFound, route } from "@/lib/server/http";
import { ContactInput, toContact } from "@/lib/server/contacts";

export const PATCH = route<RouteContext<"/api/admin/contacts/[id]">>(async (req, ctx) => {
  const { id } = await ctx.params;
  await requireAdmin();
  const input = ContactInput.parse(await req.json());
  const db = await getDb();
  const [row] = await db.update(emergencyContacts).set(input).where(eq(emergencyContacts.id, id)).returning();
  if (!row) throw notFound();
  return Response.json({ contact: toContact(row) });
});

export const DELETE = route<RouteContext<"/api/admin/contacts/[id]">>(async (_req, ctx) => {
  const { id } = await ctx.params;
  await requireAdmin();
  const db = await getDb();
  await db.delete(emergencyContacts).where(eq(emergencyContacts.id, id));
  return Response.json({ ok: true });
});
