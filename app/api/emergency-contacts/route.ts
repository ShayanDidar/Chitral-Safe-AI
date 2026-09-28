import { route } from "@/lib/server/http";
import { listContacts } from "@/lib/server/contacts";

export const dynamic = "force-dynamic";

export const GET = route(async () => Response.json({ contacts: await listContacts() }));
