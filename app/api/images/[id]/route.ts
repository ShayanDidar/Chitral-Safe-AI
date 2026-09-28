import { eq } from "drizzle-orm";
import { getCurrentUser } from "@/lib/server/auth";
import { getDb } from "@/lib/server/db";
import { images, reports } from "@/lib/server/db/schema";
import { notFound, route } from "@/lib/server/http";
import { viewFor } from "@/lib/server/reports";

export const dynamic = "force-dynamic";

/**
 * Serves stored images with the same access rules as the report they belong
 * to. Photos on confidential or unapproved reports are only visible to the
 * submitter and admins.
 */
export const GET = route<RouteContext<"/api/images/[id]">>(async (_req, ctx) => {
  const { id } = await ctx.params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) throw notFound();
  const db = await getDb();
  const [img] = await db.select().from(images).where(eq(images.id, id));
  if (!img) throw notFound();

  let cache = "public, max-age=86400";
  if (img.kind === "report") {
    if (!img.reportId) throw notFound();
    const [report] = await db.select().from(reports).where(eq(reports.id, img.reportId));
    if (!report || report.deletedAt) throw notFound();
    const view = viewFor(report, await getCurrentUser());
    if (!view) throw notFound();
    // Restricted photos must never be stored by shared caches.
    cache = view === "public" ? "public, max-age=300" : "private, no-store";
  }

  return new Response(new Uint8Array(img.data), {
    headers: {
      "content-type": img.mime,
      "content-length": String(img.size),
      "cache-control": cache,
      "x-content-type-options": "nosniff",
    },
  });
});
