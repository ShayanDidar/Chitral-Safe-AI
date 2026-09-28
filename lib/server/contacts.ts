import { asc, eq } from "drizzle-orm";
import { z } from "zod";
import type { EmergencyContact } from "@/types";
import { getDb } from "./db";
import { emergencyContacts, type ContactRow } from "./db/schema";

export const toContact = (r: ContactRow): EmergencyContact => ({
  id: r.id,
  region: r.region,
  label: r.label,
  labelUr: r.labelUr,
  kind: r.kind as EmergencyContact["kind"],
  value: r.value,
  note: r.note,
  sort: r.sort,
  active: r.active,
});

export async function listContacts(includeInactive = false) {
  const db = await getDb();
  const rows = await db
    .select()
    .from(emergencyContacts)
    .where(includeInactive ? undefined : eq(emergencyContacts.active, true))
    .orderBy(asc(emergencyContacts.sort), asc(emergencyContacts.createdAt));
  return rows.map(toContact);
}

const phone = /^\+?[0-9][0-9 \-()]{1,24}$/;

export const ContactInput = z
  .object({
    region: z.string().trim().min(1).max(80),
    label: z.string().trim().min(1).max(120),
    labelUr: z.string().trim().max(120).nullish(),
    kind: z.enum(["phone", "sms", "email"]),
    value: z.string().trim().min(1).max(200),
    note: z.string().trim().max(300).nullish(),
    sort: z.coerce.number().int().min(0).max(999).default(0),
    active: z.boolean().default(true),
  })
  .superRefine((c, ctx) => {
    const ok = c.kind === "email" ? z.email().safeParse(c.value).success : phone.test(c.value);
    if (!ok) ctx.addIssue({ code: "custom", path: ["value"], message: c.kind === "email" ? "Enter a valid email address." : "Enter a valid phone number." });
  });
