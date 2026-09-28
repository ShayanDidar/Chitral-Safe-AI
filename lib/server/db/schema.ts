import { sql } from "drizzle-orm";
import {
  boolean,
  check,
  customType,
  doublePrecision,
  index,
  integer,
  jsonb,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

const bytea = customType<{ data: Buffer; driverData: Buffer | Uint8Array }>({
  dataType: () => "bytea",
  fromDriver: (v) => (Buffer.isBuffer(v) ? v : Buffer.from(v)),
});

const now = () => timestamp({ withTimezone: true }).notNull().defaultNow();

export const users = pgTable(
  "users",
  {
    id: uuid().primaryKey().defaultRandom(),
    email: text().notNull().unique(),
    passwordHash: text("password_hash").notNull(),
    role: text().notNull().default("user"),
    name: text().notNull(),
    bio: text().notNull().default(""),
    /** Private contact details — only the user (and admins, for named reports) can see them. */
    phone: text(),
    contactEmail: text("contact_email"),
    avatarImageId: uuid("avatar_image_id"),
    createdAt: now(),
    updatedAt: now(),
  },
  (t) => [check("users_role_check", sql`${t.role} in ('user', 'admin')`)],
);

export const sessions = pgTable(
  "sessions",
  {
    /** SHA-256 of the session token; the raw token only lives in the cookie. */
    id: text().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    createdAt: now(),
  },
  (t) => [index("sessions_user_idx").on(t.userId)],
);

export const reports = pgTable(
  "reports",
  {
    id: uuid().primaryKey().defaultRandom(),
    kind: text().notNull(), // hazard | crime
    userId: uuid("user_id").references(() => users.id, { onDelete: "set null" }),
    review: text().notNull().default("pending"), // pending | approved | rejected
    visibility: text().notNull().default("public"), // public | confidential
    identity: text().notNull().default("named"), // named | anonymous
    /** Hazard lifecycle shown on approved hazard reports. */
    status: text().notNull().default("active"),
    hazardType: text("hazard_type"),
    severity: text(),
    crimeCategory: text("crime_category"),
    occurredAt: timestamp("occurred_at", { withTimezone: true }),
    title: text().notNull(),
    description: text().notNull(),
    locationName: text("location_name").notNull(),
    area: text().notNull(),
    lat: doublePrecision().notNull(),
    lng: doublePrecision().notNull(),
    rejectionReason: text("rejection_reason"),
    reviewedBy: uuid("reviewed_by").references(() => users.id, { onDelete: "set null" }),
    reviewedAt: timestamp("reviewed_at", { withTimezone: true }),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
    deletedBy: uuid("deleted_by").references(() => users.id, { onDelete: "set null" }),
    /** Demo content only: stable key (used by alert links), static illustration, like count and Urdu translation. */
    seedKey: text("seed_key").unique(),
    staticImageUrl: text("static_image_url"),
    likeSeed: integer("like_seed").notNull().default(0),
    translations: jsonb().$type<{ ur?: { title: string; description: string } }>(),
    createdAt: now(),
    updatedAt: now(),
  },
  (t) => [
    index("reports_review_idx").on(t.review, t.visibility),
    index("reports_user_idx").on(t.userId),
    check("reports_kind_check", sql`${t.kind} in ('hazard', 'crime')`),
    check("reports_review_check", sql`${t.review} in ('pending', 'approved', 'rejected')`),
    check("reports_visibility_check", sql`${t.visibility} in ('public', 'confidential')`),
    check("reports_identity_check", sql`${t.identity} in ('named', 'anonymous')`),
  ],
);

export const images = pgTable(
  "images",
  {
    id: uuid().primaryKey().defaultRandom(),
    kind: text().notNull(), // report | avatar
    ownerId: uuid("owner_id").references(() => users.id, { onDelete: "cascade" }),
    reportId: uuid("report_id").references(() => reports.id, { onDelete: "cascade" }),
    position: integer().notNull().default(0),
    mime: text().notNull(),
    data: bytea().notNull(),
    size: integer().notNull(),
    createdAt: now(),
  },
  (t) => [index("images_report_idx").on(t.reportId)],
);

export const comments = pgTable(
  "comments",
  {
    id: uuid().primaryKey().defaultRandom(),
    reportId: uuid("report_id")
      .notNull()
      .references(() => reports.id, { onDelete: "cascade" }),
    userId: uuid("user_id").references(() => users.id, { onDelete: "set null" }),
    text: text().notNull(),
    /** Demo content only. */
    textUr: text("text_ur"),
    createdAt: now(),
  },
  (t) => [index("comments_report_idx").on(t.reportId)],
);

export const likes = pgTable(
  "likes",
  {
    reportId: uuid("report_id")
      .notNull()
      .references(() => reports.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    createdAt: now(),
  },
  (t) => [primaryKey({ columns: [t.reportId, t.userId] })],
);

export const emergencyContacts = pgTable(
  "emergency_contacts",
  {
    id: uuid().primaryKey().defaultRandom(),
    region: text().notNull(),
    label: text().notNull(),
    labelUr: text("label_ur"),
    kind: text().notNull(), // phone | sms | email
    value: text().notNull(),
    note: text(),
    sort: integer().notNull().default(0),
    active: boolean().notNull().default(true),
    createdAt: now(),
  },
  (t) => [check("contacts_kind_check", sql`${t.kind} in ('phone', 'sms', 'email')`)],
);

export type UserRow = typeof users.$inferSelect;
export type ReportRow = typeof reports.$inferSelect;
export type ContactRow = typeof emergencyContacts.$inferSelect;
