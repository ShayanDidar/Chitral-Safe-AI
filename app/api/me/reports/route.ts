import { requireUser } from "@/lib/server/auth";
import { route } from "@/lib/server/http";
import { listMine } from "@/lib/server/reports";

export const dynamic = "force-dynamic";

/** The signed-in user's own submissions, with review status. */
export const GET = route(async () => {
  const user = await requireUser();
  return Response.json({ reports: await listMine(user) });
});
