import { requireAdmin } from "@/lib/server/auth";
import { getDb } from "@/lib/server/db";
import { restoreDemoReports } from "@/lib/server/db/seed";
import { route } from "@/lib/server/http";

/** Admin "Restore demo reports": re-adds missing demo reports and un-deletes deleted ones. */
export const POST = route(async () => {
  await requireAdmin();
  const changed = await restoreDemoReports(await getDb());
  return Response.json({ changed });
});
