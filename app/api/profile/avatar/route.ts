import { eq } from "drizzle-orm";
import { requireUser } from "@/lib/server/auth";
import { getDb } from "@/lib/server/db";
import { images, users } from "@/lib/server/db/schema";
import { badRequest, route } from "@/lib/server/http";
import { processImage } from "@/lib/server/images";
import { toCurrentUser } from "@/lib/server/users";

/** Upload or replace the profile picture (validated and re-encoded, metadata stripped). */
export const POST = route(async (req) => {
  const user = await requireUser();
  const file = (await req.formData()).get("avatar");
  if (!(file instanceof File)) throw badRequest("missing_file", "Choose an image to upload.");
  const img = await processImage(file, 512);
  const db = await getDb();
  const newId = await db.transaction(async (tx) => {
    const [row] = await tx.insert(images).values({ kind: "avatar", ownerId: user.id, ...img }).returning({ id: images.id });
    await tx.update(users).set({ avatarImageId: row.id, updatedAt: new Date() }).where(eq(users.id, user.id));
    if (user.avatarImageId) await tx.delete(images).where(eq(images.id, user.avatarImageId));
    return row.id;
  });
  return Response.json({ user: toCurrentUser({ ...user, avatarImageId: newId }) });
});

export const DELETE = route(async () => {
  const user = await requireUser();
  const db = await getDb();
  await db.transaction(async (tx) => {
    await tx.update(users).set({ avatarImageId: null, updatedAt: new Date() }).where(eq(users.id, user.id));
    if (user.avatarImageId) await tx.delete(images).where(eq(images.id, user.avatarImageId));
  });
  return Response.json({ user: toCurrentUser({ ...user, avatarImageId: null }) });
});
