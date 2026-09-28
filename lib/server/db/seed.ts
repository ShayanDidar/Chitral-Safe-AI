/**
 * Inserts demo content the first time the database is set up, so the app
 * looks alive at an exhibition. Disable with SEED_DEMO_DATA=false.
 */
import { randomBytes } from "node:crypto";
import { count, eq } from "drizzle-orm";
import { LOCATIONS } from "@/data/locations";
import { SEED_REPORTS } from "@/data/reports";
import type { DB } from "./index";
import { comments, emergencyContacts, reports, users } from "./schema";

export async function seedIfEmpty(db: DB) {
  if (process.env.SEED_DEMO_DATA === "false") {
    await seedContacts(db);
    return;
  }
  const [{ n }] = await db.select({ n: count() }).from(reports);
  if (n === 0) await seedReports(db);
  await seedContacts(db);
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

async function seedReports(db: DB) {
  const now = Date.now();
  const ago = (m: number) => new Date(now - m * 60_000);
  const cache = new Map<string, string>();

  for (const s of SEED_REPORTS) {
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
