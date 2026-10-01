/**
 * Inserts demo content the first time the database is set up, so the app
 * looks alive at an exhibition. Disable with SEED_DEMO_DATA=false.
 */
import { randomBytes } from "node:crypto";
import { and, count, eq, inArray, isNotNull, ne, or } from "drizzle-orm";
import { LOCATIONS } from "@/data/locations";
import { SEED_REPORTS } from "@/data/reports";
import type { DB } from "./index";
import { comments, emergencyContacts, reports, users } from "./schema";

/**
 * Makes sure the demo reports and emergency contacts exist.
 * Safe to run many times: it only adds demo reports that are missing
 * (it never brings back demo reports an admin deleted).
 */
export async function seedIfEmpty(db: DB) {
  if (process.env.SEED_DEMO_DATA !== "false") await seedReports(db, false);
  await seedContacts(db);
}

/**
 * Admin "Restore demo reports" button: adds missing demo reports and brings
 * back deleted or rejected ones. Returns how many were added or restored.
 */
export async function restoreDemoReports(db: DB) {
  return seedReports(db, true);
}

/** Demo authors are real rows but cannot sign in (their password hash is unusable). */
async function seedUser(db: DB, name: string, cache: Map<string, string>) {
  const hit = cache.get(name);
  if (hit) return hit;
  const email = `${name.toLowerCase().replace(/[^a-z]+/g, ".")}@demo.chitralsafe.invalid`;
  const [existing] = await db.select({ id: users.id }).from(users).where(eq(users.email, email));
  const id =
    existing?.id ??
    (
      await db
        .insert(users)
        .values({ email, name, passwordHash: `disabled$${randomBytes(16).toString("hex")}` })
        .returning({ id: users.id })
    )[0].id;
  cache.set(name, id);
  return id;
}

async function seedReports(db: DB, restore: boolean) {
  const now = Date.now();
  const ago = (m: number) => new Date(now - m * 60_000);
  const cache = new Map<string, string>();
  let changed = 0;

  const keys = SEED_REPORTS.map((s) => s.id);
  const existing = new Set(
    (await db.select({ key: reports.seedKey }).from(reports).where(inArray(reports.seedKey, keys))).map((r) => r.key),
  );

  if (restore) {
    const restored = await db
      .update(reports)
      .set({ deletedAt: null, deletedBy: null, review: "approved", visibility: "public", rejectionReason: null })
      .where(
        and(
          inArray(reports.seedKey, keys),
          or(isNotNull(reports.deletedAt), ne(reports.review, "approved"), ne(reports.visibility, "public")),
        ),
      )
      .returning({ id: reports.id });
    changed += restored.length;
  }

  for (const s of SEED_REPORTS) {
    if (existing.has(s.id)) continue;
    changed++;
    const loc = LOCATIONS.find((l) => l.id === s.locationId) ?? LOCATIONS[0];
    const userId = await seedUser(db, s.author, cache);
    const [row] = await db
      .insert(reports)
      .values({
        kind: "hazard",
        seedKey: s.id,
        userId,
        review: "approved",
        reviewedAt: ago(s.minutesAgo - 1),
        visibility: "public",
        identity: "named",
        status: s.status,
        hazardType: s.type,
        severity: s.severity,
        title: s.title,
        description: s.description,
        locationName: loc.name,
        area: loc.area,
        lat: +(loc.coordinates.lat + s.offset[0]).toFixed(5),
        lng: +(loc.coordinates.lng + s.offset[1]).toFixed(5),
        staticImageUrl: s.image,
        likeSeed: s.likes,
        translations: { ur: { title: s.ur.title, description: s.ur.description } },
        createdAt: ago(s.minutesAgo),
        updatedAt: ago(s.minutesAgo),
      })
      .returning({ id: reports.id });

    for (const [i, c] of s.comments.entries()) {
      await db.insert(comments).values({
        reportId: row.id,
        userId: await seedUser(db, c.author, cache),
        text: c.text,
        textUr: s.ur.comments[i],
        createdAt: ago(c.minutesAgo),
      });
    }
  }
  return changed;
}

/**
 * Only numbers we are confident about are seeded. Admins can add email/SMS
 * contacts and other regional numbers from the admin portal.
 */
async function seedContacts(db: DB) {
  const [{ n }] = await db.select({ n: count() }).from(emergencyContacts);
  if (n > 0) return;
  await db.insert(emergencyContacts).values([
    {
      region: "Khyber Pakhtunkhwa",
      label: "Rescue 1122 (ambulance, fire, rescue)",
      labelUr: "ریسکیو 1122 (ایمبولینس، فائر، ریسکیو)",
      kind: "phone",
      value: "1122",
      sort: 0,
    },
    {
      region: "Pakistan",
      label: "Police emergency",
      labelUr: "پولیس ایمرجنسی",
      kind: "phone",
      value: "15",
      sort: 1,
    },
  ]);
}
