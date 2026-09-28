import { and, eq } from "drizzle-orm";
import { requireUser } from "@/lib/server/auth";
import { getDb } from "@/lib/server/db";
import { likes } from "@/lib/server/db/schema";
import { notFound, route } from "@/lib/server/http";
import { findRow, isPubliclyVisible } from "@/lib/server/reports";

/** Toggles the signed-in user's like on a public report. */
export const POST = route<RouteContext<"/api/reports/[id]/like">>(async (_req, ctx) => {
  const { id } = await ctx.params;
  const user = await requireUser();
  const row = await findRow(id);
  if (!row || !isPubliclyVisible(row)) throw notFound();
  const db = await getDb();
  const where = and(eq(likes.reportId, row.id), eq(likes.userId, user.id));
  const [existing] = await db.select().from(likes).where(where);
  if (existing) await db.delete(likes).where(where);
  else await db.insert(likes).values({ reportId: row.id, userId: user.id });
  return Response.json({ liked: !existing });
});
