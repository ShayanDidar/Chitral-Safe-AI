import { eq } from "drizzle-orm";
import { z } from "zod";
import { requireAdmin } from "@/lib/server/auth";
import { getDb } from "@/lib/server/db";
import { reports } from "@/lib/server/db/schema";
import { notFound, route } from "@/lib/server/http";
import { findRow, getForViewer } from "@/lib/server/reports";

const Body = z.discriminatedUnion("action", [
  z.object({ action: z.literal("approve") }),
  z.object({ action: z.literal("reject"), reason: z.string().trim().max(500).optional() }),
]);

/**
 * Approve or reject a submission. Approval only changes the review status:
 * a confidential report stays confidential and never becomes public.
 */
export const PATCH = route<RouteContext<"/api/admin/reports/[id]">>(async (req, ctx) => {
  const { id } = await ctx.params;
  const admin = await requireAdmin();
  const body = Body.parse(await req.json());
  const row = await findRow(id);
  if (!row) throw notFound();
  const db = await getDb();
  await db
    .update(reports)
    .set({
      review: body.action === "approve" ? "approved" : "rejected",
      rejectionReason: body.action === "reject" ? body.reason || null : null,
      reviewedBy: admin.id,
      reviewedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(reports.id, row.id));
  return Response.json({ report: await getForViewer(row.id, admin) });
});
