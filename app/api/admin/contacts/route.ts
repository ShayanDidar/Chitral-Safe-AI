import { requireAdmin } from "@/lib/server/auth";
import { getDb } from "@/lib/server/db";
import { emergencyContacts } from "@/lib/server/db/schema";
import { route } from "@/lib/server/http";
import { ContactInput, listContacts, toContact } from "@/lib/server/contacts";

export const dynamic = "force-dynamic";

export const GET = route(async () => {
  await requireAdmin();
  return Response.json({ contacts: await listContacts(true) });
});

export const POST = route(async (req) => {
  await requireAdmin();
  const input = ContactInput.parse(await req.json());
  const db = await getDb();
  const [row] = await db.insert(emergencyContacts).values(input).returning();
  return Response.json({ contact: toContact(row) }, { status: 201 });
});
