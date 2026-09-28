/**
 * Email + password authentication with database sessions (server-only).
 * Passwords are hashed with scrypt; the session cookie holds a random token
 * and only its SHA-256 hash is stored.
 */
import { createHash, randomBytes, scrypt as scryptCb, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";
import { cookies } from "next/headers";
import { unstable_rethrow } from "next/navigation";
import { and, eq, gt } from "drizzle-orm";
import { getDb } from "./db";
import { sessions, users, type UserRow } from "./db/schema";
import { forbidden, unauthorized } from "./http";

const scrypt = promisify(scryptCb) as (pw: string, salt: Buffer, len: number) => Promise<Buffer>;
const COOKIE = "cs_session";
const SESSION_DAYS = 30;

export async function hashPassword(password: string) {
  const salt = randomBytes(16);
  const hash = await scrypt(password, salt, 64);
  return `scrypt$${salt.toString("base64")}$${hash.toString("base64")}`;
}

export async function verifyPassword(password: string, stored: string) {
  const [algo, saltB64, hashB64] = stored.split("$");
  if (algo !== "scrypt" || !saltB64 || !hashB64) return false;
  const expected = Buffer.from(hashB64, "base64");
  const actual = await scrypt(password, Buffer.from(saltB64, "base64"), expected.length);
  return timingSafeEqual(actual, expected);
}

const hashToken = (token: string) => createHash("sha256").update(token).digest("hex");

export async function createSession(userId: string) {
  const token = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 86_400_000);
  const db = await getDb();
  await db.insert(sessions).values({ id: hashToken(token), userId, expiresAt });
  const store = await cookies();
  store.set(COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: expiresAt,
  });
}

export async function destroySession() {
  const store = await cookies();
  const token = store.get(COOKIE)?.value;
  if (token) {
    const db = await getDb();
    await db.delete(sessions).where(eq(sessions.id, hashToken(token)));
  }
  store.delete(COOKIE);
}

export type SessionUser = Pick<
  UserRow,
  "id" | "email" | "role" | "name" | "bio" | "phone" | "contactEmail" | "avatarImageId"
>;

/** Returns the signed-in user, or null. */
export async function getCurrentUser(): Promise<SessionUser | null> {
  const store = await cookies();
  const token = store.get(COOKIE)?.value;
  if (!token) return null;
  const db = await getDb();
  const [row] = await db
    .select({
      id: users.id,
      email: users.email,
      role: users.role,
      name: users.name,
      bio: users.bio,
      phone: users.phone,
      contactEmail: users.contactEmail,
      avatarImageId: users.avatarImageId,
    })
    .from(sessions)
    .innerJoin(users, eq(sessions.userId, users.id))
    .where(and(eq(sessions.id, hashToken(token)), gt(sessions.expiresAt, new Date())));
  return row ?? null;
}

/** Like getCurrentUser, but treats an unreachable database as "signed out". */
export async function currentUserOrNull() {
  try {
    return await getCurrentUser();
  } catch (err) {
    unstable_rethrow(err);
    console.error("[auth] could not load session:", err);
    return null;
  }
}

export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) throw unauthorized();
  return user;
}

/** Admin checks always happen on the server; the UI only hides buttons. */
export async function requireAdmin() {
  const user = await requireUser();
  if (user.role !== "admin") throw forbidden();
  return user;
}

export const isAdmin = (u: { role: string } | null | undefined) => u?.role === "admin";

/** Emails listed in ADMIN_EMAILS become admins when they sign up or sign in. */
export function isBootstrapAdmin(email: string) {
  return (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean)
    .includes(email.toLowerCase());
}
