import { z } from "zod";
import { getCurrentUser, requireUser } from "@/lib/server/auth";
import { getDb } from "@/lib/server/db";
import { images, reports } from "@/lib/server/db/schema";
import { isInServiceArea, nearestPlace } from "@/lib/server/geo";
import { badRequest, rateLimit, route } from "@/lib/server/http";
import { processImage } from "@/lib/server/images";
import { getForViewer, listPublic } from "@/lib/server/reports";
import { CRIME_CATEGORIES } from "@/lib/crime";
import { HAZARD_TYPE_LIST, SEVERITY_LIST } from "@/lib/hazards";
import { CRIME_TERMS, HAZARD_TERMS, placeName } from "@/lib/i18n/terms";

export const dynamic = "force-dynamic";

/** Approved, public reports only — this is what the feed and public map show. */
export const GET = route(async () => {
  const viewer = await getCurrentUser();
  return Response.json({ reports: await listPublic(viewer) });
});

const MAX_IMAGES = 4;

const Common = z.object({
  description: z.string().trim().min(10, "Add a short description (at least 10 characters).").max(2000),
  locationName: z.string().trim().min(1, "Enter a location.").max(160),
  lat: z.coerce.number(),
  lng: z.coerce.number(),
  identity: z.enum(["named", "anonymous"]).default("named"),
});

const Hazard = Common.extend({
  kind: z.literal("hazard"),
  type: z.enum(HAZARD_TYPE_LIST as [string, ...string[]]),
  severity: z.enum(SEVERITY_LIST as [string, ...string[]]),
});

const Crime = Common.extend({
  kind: z.literal("crime"),
  category: z.enum(CRIME_CATEGORIES as [string, ...string[]]),
  visibility: z.enum(["public", "confidential"]),
  occurredAt: z.coerce.date().refine((d) => d.getTime() <= Date.now() + 5 * 60_000, "The date can't be in the future."),
});

const Body = z.discriminatedUnion("kind", [Hazard, Crime]);

/** Every submission starts as "pending" and waits for an admin. */
export const POST = route(async (req) => {
  const user = await requireUser();
  rateLimit(`submit:${user.id}`, 20, 60 * 60_000);

  const form = await req.formData();
  const fields = Object.fromEntries([...form.entries()].filter(([, v]) => typeof v === "string"));
  const body = Body.parse(fields);
  if (!isInServiceArea(body.lat, body.lng)) {
    throw badRequest("invalid_location", "Choose a location inside the Chitral region on the map.");
  }

  const files = form.getAll("images").filter((f): f is File => f instanceof File && f.size > 0);
  if (files.length > MAX_IMAGES) throw badRequest("too_many_images", `You can attach up to ${MAX_IMAGES} images.`);
  const processed = await Promise.all(files.map((f) => processImage(f, 1600)));

  const place = nearestPlace(body.lat, body.lng);
  const label = body.kind === "hazard" ? HAZARD_TERMS[body.type as keyof typeof HAZARD_TERMS] : CRIME_TERMS[body.category as keyof typeof CRIME_TERMS];
  // Titles avoid the free-text location so a public crime title never reveals an exact address.
  const titlePlace = body.kind === "crime" ? place.name : body.locationName;

  const db = await getDb();
  const id = await db.transaction(async (tx) => {
    const [row] = await tx
      .insert(reports)
      .values({
        kind: body.kind,
        userId: user.id,
        review: "pending",
        visibility: body.kind === "crime" ? body.visibility : "public",
        identity: body.identity,
        status: "active",
        hazardType: body.kind === "hazard" ? body.type : null,
        severity: body.kind === "hazard" ? body.severity : null,
        crimeCategory: body.kind === "crime" ? body.category : null,
        occurredAt: body.kind === "crime" ? body.occurredAt : null,
        title: `${label.en} reported near ${titlePlace}`,
        description: body.description,
        locationName: body.locationName,
        area: place.area,
        lat: +body.lat.toFixed(6),
        lng: +body.lng.toFixed(6),
        translations: {
          ur: { title: `${placeName(titlePlace, "ur")} کے قریب ${label.ur} کی اطلاع`, description: body.description },
        },
      })
      .returning({ id: reports.id });
    if (processed.length) {
      await tx.insert(images).values(
        processed.map((img, i) => ({ kind: "report", ownerId: user.id, reportId: row.id, position: i, ...img })),
      );
    }
    return row.id;
  });

  return Response.json({ report: await getForViewer(id, user) }, { status: 201 });
});
