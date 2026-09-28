import { z } from "zod";
import { requireUser } from "@/lib/server/auth";
import { getDb } from "@/lib/server/db";
import { comments } from "@/lib/server/db/schema";
import { notFound, rateLimit, route } from "@/lib/server/http";
import { findRow, getForViewer, isPubliclyVisible } from "@/lib/server/reports";

const Body = z.object({ text: z.string().trim().min(1).max(500) });

/** Comments are only allowed on approved, public reports. */
export const POST = route<RouteContext<"/api/reports/[id]/comments">>(async (req, ctx) => {
  const { id } = await ctx.params;
  const user = await requireUser();
  rateLimit(`comment:${user.id}`, 30, 10 * 60_000);
  const { text } = Body.parse(await req.json());
  const row = await findRow(id);
  if (!row || !isPubliclyVisible(row)) throw notFound();
  const db = await getDb();
  await db.insert(comments).values({ reportId: row.id, userId: user.id, text });
  return Response.json({ report: await getForViewer(row.id, user) }, { status: 201 });
});
