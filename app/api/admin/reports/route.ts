import { requireAdmin } from "@/lib/server/auth";
import { route } from "@/lib/server/http";
import { adminCounts, listForAdmin } from "@/lib/server/reports";

export const dynamic = "force-dynamic";

/** Admin review queue. Role is enforced here, not just in the UI. */
export const GET = route(async (req) => {
  const admin = await requireAdmin();
  const q = new URL(req.url).searchParams;
  const [reports, counts] = await Promise.all([
    listForAdmin(admin, {
      review: q.get("review") ?? "pending",
      kind: q.get("kind") ?? "all",
      visibility: q.get("visibility") ?? "all",
    }),
    adminCounts(),
  ]);
  return Response.json({ reports, counts });
});
