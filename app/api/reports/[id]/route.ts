import { eq } from "drizzle-orm";
import { getCurrentUser, requireUser } from "@/lib/server/auth";
import { getDb } from "@/lib/server/db";
import { images, reports } from "@/lib/server/db/schema";
import { forbidden, notFound, route } from "@/lib/server/http";
import { findRow, getForViewer } from "@/lib/server/reports";

export const dynamic = "force-dynamic";

export const GET = route<RouteContext<"/api/reports/[id]">>(async (_req, ctx) => {
  const { id } = await ctx.params;
  const report = await getForViewer(id, await getCurrentUser());
  // Hidden reports return 404 (not 403) so their existence isn't revealed.
  if (!report) throw notFound();
  return Response.json({ report });
});

/** Owners can delete their own reports; admins can delete any report. */
export const DELETE = route<RouteContext<"/api/reports/[id]">>(async (_req, ctx) => {
  const { id } = await ctx.params;
  const user = await requireUser();
  const row = await findRow(id);
  if (!row) throw notFound();
  const isOwner = row.userId === user.id;
  if (!isOwner && user.role !== "admin") {
    // Don't reveal hidden reports to non-owners.
    if (row.review !== "approved" || row.visibility !== "public") throw notFound();
    throw forbidden();
  }
  const db = await getDb();
  await db.transaction(async (tx) => {
    await tx.update(reports).set({ deletedAt: new Date(), deletedBy: user.id, updatedAt: new Date() }).where(eq(reports.id, row.id));
    // Photos are removed permanently.
    await tx.delete(images).where(eq(images.reportId, row.id));
  });
  return Response.json({ ok: true });
});
