/**
 * Report queries and the single place where access rules are applied
 * (server-only). Every API response about reports goes through `toDto`.
 *
 * Views:
 *  - "public": approved + public reports only. Anonymous reporters are never
 *    named, and crime reports only get an approximate location.
 *  - "owner":  the submitter's own reports, any status, exact location.
 *  - "admin":  everything; reporter contact details only for named reports.
 */
import { and, count, desc, eq, inArray, isNull, or, sql, type SQL } from "drizzle-orm";
import { getDb } from "./db";
import { comments, images, likes, reports, users, type ReportRow } from "./db/schema";
import { approximate, nearestPlace } from "./geo";
import type { SessionUser } from "./auth";
import type { CrimeCategory, HazardType, Report, ReportComment, ReportStatus, Severity } from "@/types";

export type View = "public" | "owner" | "admin";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export const imageUrl = (id: string) => `/api/images/${id}`;

type AuthorInfo = {
  name: string;
  email: string;
  phone: string | null;
  contactEmail: string | null;
  avatarImageId: string | null;
} | null;

interface Extras {
  author: AuthorInfo;
  imageIds: string[];
  likeCount: number;
  likedByMe: boolean;
  comments: ReportComment[];
}

function toDto(row: ReportRow, x: Extras, view: View, viewer: SessionUser | null): Report {
  const anonymous = row.identity === "anonymous";
  const hideExact = view === "public" && row.kind === "crime";
  const place = nearestPlace(row.lat, row.lng);
  const coords = hideExact ? approximate(row.lat, row.lng) : { lat: row.lat, lng: row.lng };
  const imageUrls = row.staticImageUrl ? [row.staticImageUrl] : x.imageIds.map(imageUrl);

  const base = {
    id: row.id,
    status: row.status as ReportStatus,
    title: row.title,
    description: row.description,
    locationName: hideExact ? place.name : row.locationName,
    area: row.area,
    coordinates: coords,
    approximate: hideExact,
    imageUrls,
    imageUrl: imageUrls[0],
    author:
      anonymous || !x.author
        ? null
        : { name: x.author.name, avatarUrl: x.author.avatarImageId ? imageUrl(x.author.avatarImageId) : null },
    reportedAt: row.createdAt.toISOString(),
    likes: row.likeSeed + x.likeCount,
    likedByMe: x.likedByMe,
    comments: x.comments,
    review: row.review as Report["review"],
    visibility: row.visibility as Report["visibility"],
    identity: row.identity as Report["identity"],
    rejectionReason: view === "public" ? null : row.rejectionReason,
    reviewedAt: view === "public" ? null : (row.reviewedAt?.toISOString() ?? null),
    mine: !!viewer && row.userId === viewer.id,
    ur: row.translations?.ur,
    reporter:
      view === "admin" && !anonymous && x.author
        ? { name: x.author.name, email: x.author.email, phone: x.author.phone, contactEmail: x.author.contactEmail }
        : null,
  };

  if (row.kind === "crime") {
    return {
      ...base,
      kind: "crime",
      category: (row.crimeCategory ?? "other") as CrimeCategory,
      occurredAt: row.occurredAt?.toISOString() ?? null,
    };
  }
  return { ...base, kind: "hazard", type: (row.hazardType ?? "other") as HazardType, severity: (row.severity ?? "medium") as Severity };
}

/** Loads rows plus authors, images, likes and comments in a few batched queries. */
async function hydrate(rows: ReportRow[], view: View, viewer: SessionUser | null) {
  if (!rows.length) return [];
  const db = await getDb();
  const ids = rows.map((r) => r.id);
  const authorIds = [...new Set(rows.map((r) => r.userId).filter((v): v is string => !!v))];

  const [authorRows, imageRows, likeRows, myLikes, commentRows] = await Promise.all([
    authorIds.length
      ? db
          .select({
            id: users.id,
            name: users.name,
            email: users.email,
            phone: users.phone,
            contactEmail: users.contactEmail,
            avatarImageId: users.avatarImageId,
          })
          .from(users)
          .where(inArray(users.id, authorIds))
      : [],
    db
      .select({ id: images.id, reportId: images.reportId })
      .from(images)
      .where(and(inArray(images.reportId, ids), eq(images.kind, "report")))
      .orderBy(images.position),
    db.select({ reportId: likes.reportId, n: count() }).from(likes).where(inArray(likes.reportId, ids)).groupBy(likes.reportId),
    viewer
      ? db.select({ reportId: likes.reportId }).from(likes).where(and(inArray(likes.reportId, ids), eq(likes.userId, viewer.id)))
      : [],
    db
      .select({
        id: comments.id,
        reportId: comments.reportId,
        userId: comments.userId,
        text: comments.text,
        textUr: comments.textUr,
        createdAt: comments.createdAt,
        name: users.name,
        avatarImageId: users.avatarImageId,
      })
      .from(comments)
      .leftJoin(users, eq(comments.userId, users.id))
      .where(inArray(comments.reportId, ids))
      .orderBy(comments.createdAt),
  ]);

  const authors = new Map(authorRows.map((a) => [a.id, a]));
  const liked = new Set(myLikes.map((l) => l.reportId));
  const likeCounts = new Map(likeRows.map((l) => [l.reportId, l.n]));

  return rows.map((row) => {
    const a = row.userId ? authors.get(row.userId) : undefined;
    const reportComments: ReportComment[] = commentRows
      .filter((c) => c.reportId === row.id)
      .map((c) => {
        // On anonymous reports, the reporter's own comments must not reveal who they are.
        const byAnonReporter = row.identity === "anonymous" && c.userId === row.userId;
        return {
          id: c.id,
          author: byAnonReporter ? "Anonymous reporter" : (c.name ?? "Former user"),
          avatarUrl: byAnonReporter || !c.avatarImageId ? null : imageUrl(c.avatarImageId),
          text: c.text,
          textUr: c.textUr ?? undefined,
          createdAt: c.createdAt.toISOString(),
        };
      });
    return toDto(
      row,
      {
        author: a ?? null,
        imageIds: imageRows.filter((i) => i.reportId === row.id).map((i) => i.id),
        likeCount: likeCounts.get(row.id) ?? 0,
        likedByMe: liked.has(row.id),
        comments: reportComments,
      },
      view,
      viewer,
    );
  });
}

const notDeleted = isNull(reports.deletedAt);
const isPublic = and(eq(reports.review, "approved"), eq(reports.visibility, "public"), notDeleted)!;

export async function listPublic(viewer: SessionUser | null) {
  const db = await getDb();
  const rows = await db.select().from(reports).where(isPublic).orderBy(desc(reports.createdAt)).limit(300);
  return hydrate(rows, "public", viewer);
}

export async function listMine(user: SessionUser) {
  const db = await getDb();
  const rows = await db
    .select()
    .from(reports)
    .where(and(eq(reports.userId, user.id), notDeleted))
    .orderBy(desc(reports.createdAt));
  return hydrate(rows, "owner", user);
}

export async function listForAdmin(
  admin: SessionUser,
  filter: { review?: string; kind?: string; visibility?: string },
) {
  const db = await getDb();
  const conds: SQL[] = [notDeleted];
  if (filter.review && filter.review !== "all") conds.push(eq(reports.review, filter.review));
  if (filter.kind && filter.kind !== "all") conds.push(eq(reports.kind, filter.kind));
  if (filter.visibility && filter.visibility !== "all") conds.push(eq(reports.visibility, filter.visibility));
  const rows = await db
    .select()
    .from(reports)
    .where(and(...conds))
    // pending first, newest first
    .orderBy(sql`case when ${reports.review} = 'pending' then 0 else 1 end`, desc(reports.createdAt))
    .limit(500);
  return hydrate(rows, "admin", admin);
}

export async function adminCounts() {
  const db = await getDb();
  const rows = await db
    .select({ review: reports.review, n: count() })
    .from(reports)
    .where(notDeleted)
    .groupBy(reports.review);
  return Object.fromEntries(rows.map((r) => [r.review, r.n])) as Partial<Record<Report["review"], number>>;
}

/** Finds a non-deleted report by id (or demo seed key). */
export async function findRow(idOrKey: string) {
  const db = await getDb();
  const cond = UUID_RE.test(idOrKey) ? or(eq(reports.id, idOrKey), eq(reports.seedKey, idOrKey)) : eq(reports.seedKey, idOrKey);
  const [row] = await db.select().from(reports).where(and(cond, notDeleted));
  return row ?? null;
}

/** Decides which view (if any) a viewer gets for a report. */
export function viewFor(row: ReportRow, viewer: SessionUser | null): View | null {
  if (viewer?.role === "admin") return "admin";
  if (viewer && row.userId === viewer.id) return "owner";
  if (row.review === "approved" && row.visibility === "public") return "public";
  return null;
}

export async function getForViewer(idOrKey: string, viewer: SessionUser | null) {
  const row = await findRow(idOrKey);
  if (!row) return null;
  const view = viewFor(row, viewer);
  if (!view) return null;
  const [dto] = await hydrate([row], view, viewer);
  return dto;
}

export const isPubliclyVisible = (row: ReportRow) =>
  row.review === "approved" && row.visibility === "public" && !row.deletedAt;
