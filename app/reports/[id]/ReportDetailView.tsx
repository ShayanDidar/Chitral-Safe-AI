"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ArrowLeft, EyeOff, Heart, Loader2, Lock, Map as MapIcon, MapPin, ShieldCheck } from "lucide-react";
import { useHazardStore } from "@/lib/store";
import { HAZARD_TYPES, SEVERITIES } from "@/lib/hazards";
import { CRIME_ICONS } from "@/lib/crime";
import { cn, formatDateTime } from "@/lib/utils";
import { Card, ReportIcon, ReportTag, ReviewBadge, SectionHeader, StatusPill, btn } from "@/components/ui/primitives";
import { TimeAgo } from "@/components/ui/TimeAgo";
import { Page } from "@/components/layout/Page";
import { MapView } from "@/components/map";
import { CommentThread, ReportAuthorAvatar, useSignInRedirect } from "@/components/community/CommunityPost";
import { ReportImagePlaceholder } from "@/components/hazards/HazardCard";
import { DeleteReportButton } from "@/components/hazards/DeleteReportButton";
import { ReviewActions } from "@/components/admin/ReviewActions";
import { useI18n } from "@/lib/i18n/LanguageProvider";
import { fetchReport } from "@/services/apiClient";
import type { Report } from "@/types";

export function ReportDetailView({ id }: { id: string }) {
  const { getReport, toggleLike, user, refreshReports } = useHazardStore();
  const router = useRouter();
  const signIn = useSignInRedirect();
  const { t, label, severity, severityDesc, place, authorName, report: localize, lang } = useI18n();
  const fromStore = getReport(id);
  // Reports outside the public list (your pending report, or any report for admins) are loaded from the API.
  const [fetched, setFetched] = useState<Report | null | "loading">(fromStore ? null : "loading");

  useEffect(() => {
    if (fromStore) return;
    let cancelled = false;
    fetchReport(id)
      .then((r) => !cancelled && setFetched(r))
      .catch(() => !cancelled && setFetched(null));
    return () => {
      cancelled = true;
    };
  }, [id, fromStore, user?.id]);

  // A copy fetched/updated here (e.g. after an admin review) wins over the public list.
  const report = (fetched !== "loading" && fetched) || fromStore || null;

  if (!report) {
    return (
      <Page narrow>
        <Card className="p-10 text-center">
          {fetched === "loading" ? (
            <Loader2 className="mx-auto size-6 animate-spin text-slate-400" aria-label={t("common.loading")} />
          ) : (
            <>
              <p className="text-base font-semibold text-slate-900">{t("detail.notAvailable")}</p>
              <p className="mx-auto mt-1 max-w-sm text-sm text-slate-500">{t("detail.notAvailableBody")}</p>
              <div className="mt-5 flex justify-center gap-2">
                <Link href="/community" className={cn(btn.base, btn.primary, btn.md)}>
                  {t("detail.goCommunity")}
                </Link>
                {!user && (
                  <button type="button" onClick={signIn} className={cn(btn.base, btn.secondary, btn.md)}>
                    {t("auth.signIn")}
                  </button>
                )}
              </div>
            </>
          )}
        </Card>
      </Page>
    );
  }

  const text = localize(report);
  const isPublic = report.review === "approved" && report.visibility === "public";
  const guidance =
    report.kind === "hazard"
      ? lang === "ur"
        ? HAZARD_TYPES[report.type].guidanceUr
        : HAZARD_TYPES[report.type].guidance
      : [t("crimeGuide.1"), t("crimeGuide.2"), t("crimeGuide.3")];
  const TypeIcon = report.kind === "hazard" ? HAZARD_TYPES[report.type].icon : CRIME_ICONS[report.category];
  const isAdmin = user?.role === "admin";

  return (
    <Page>
      <Link href={isAdmin && !isPublic ? "/admin" : report.mine && !isPublic ? "/account/submissions" : "/community"} className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-900">
        <ArrowLeft className="size-4 rtl:-scale-x-100" aria-hidden />{" "}
        {isAdmin && !isPublic ? t("admin.title") : report.mine && !isPublic ? t("account.submissions") : t("detail.back")}
      </Link>

      {/* Moderation / privacy status — only ever shown to the submitter and admins. */}
      {(report.mine || isAdmin) && (
        <Card className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
          <div className="flex flex-1 flex-wrap items-center gap-2 text-sm">
            <ReviewBadge review={report.review} />
            {report.visibility === "confidential" && (
              <span className="inline-flex items-center gap-1 rounded-full bg-slate-800 px-2 py-0.5 text-[11px] font-medium text-white">
                <Lock className="size-3" aria-hidden /> {t("visibility.confidential")}
              </span>
            )}
            {report.identity === "anonymous" && (
              <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-700">
                <EyeOff className="size-3" aria-hidden /> {t("identity.anonymous")}
              </span>
            )}
            <span className="text-slate-600">
              {report.review === "pending"
                ? t("review.pendingNote")
                : report.review === "rejected"
                  ? t("review.rejectedNote")
                  : report.visibility === "confidential"
                    ? t("review.confidentialNote")
                    : t("review.approvedNote")}
            </span>
            {report.review === "rejected" && report.rejectionReason && (
              <span dir="auto" className="w-full rounded-lg bg-slate-50 px-3 py-2 text-[13px] text-slate-700">
                <strong className="font-semibold">{t("review.reason")}:</strong> {report.rejectionReason}
              </span>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            {isAdmin && (
              <ReviewActions
                report={report}
                onChange={(r) => {
                  setFetched(r);
                  void refreshReports();
                }}
              />
            )}
            <DeleteReportButton report={report} onDeleted={() => router.push(isAdmin ? "/admin" : "/account/submissions")} />
          </div>
        </Card>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="min-w-0 space-y-5 lg:col-span-2">
          <Card className="overflow-hidden">
            <div className="relative aspect-[16/9] bg-slate-100">
              {report.imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={report.imageUrl} alt={`${t("post.photo")}: ${text.title}`} className="h-full w-full object-cover" />
              ) : report.kind === "hazard" ? (
                <>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={HAZARD_TYPES[report.type].image} alt="" className="h-full w-full object-cover" />
                  <span className="absolute bottom-3 start-3 rounded-md bg-white/90 px-2 py-1 text-[11px] text-slate-600">
                    {t("detail.illustration")}
                  </span>
                </>
              ) : (
                <ReportImagePlaceholder report={report} />
              )}
            </div>
            {report.imageUrls.length > 1 && (
              <div className="flex gap-2 overflow-x-auto p-3">
                {report.imageUrls.slice(1).map((src) => (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img key={src} src={src} alt="" className="h-24 w-36 shrink-0 rounded-lg object-cover" />
                ))}
              </div>
            )}
            <div className="space-y-4 p-5 sm:p-6">
              <div className="flex flex-wrap items-center gap-2">
                <ReportTag report={report} />
                {report.kind === "hazard" && <StatusPill status={report.status} />}
                {report.mine && (
                  <span className="rounded-full bg-brand-700 px-2 py-0.5 text-[11px] font-semibold text-white">{t("common.yourReport")}</span>
                )}
              </div>
              <div>
                <p className="flex items-center gap-1.5 text-sm font-medium text-slate-500">
                  <TypeIcon className="size-4" aria-hidden /> {label(report)}
                </p>
                <h1 className="mt-1 text-xl font-semibold tracking-tight text-slate-900 sm:text-2xl">{text.title}</h1>
                <p className="mt-1.5 flex items-center gap-1 text-sm text-slate-600">
                  <MapPin className="size-4 text-slate-400" aria-hidden />{" "}
                  {t("common.placeArea", { place: place(report.locationName), area: place(report.area) })}
                </p>
                {report.approximate && <p className="mt-1 text-xs text-slate-500">{t("crime.approxNote")}</p>}
              </div>
              <p dir="auto" className="whitespace-pre-line text-[15px] leading-relaxed text-slate-700">
                {text.description}
              </p>
              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4">
                <div className="flex items-center gap-2.5">
                  <ReportAuthorAvatar report={report} />
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{authorName(report)}</p>
                    <p className="text-xs text-slate-500">
                      {t("detail.reported")} <TimeAgo iso={report.reportedAt} />
                    </p>
                  </div>
                </div>
                {isPublic && (
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={async () => {
                        if ((await toggleLike(report.id)) === "signin") signIn();
                      }}
                      aria-pressed={report.likedByMe}
                      className={cn(btn.base, btn.secondary, btn.md, report.likedByMe && "text-red-600")}
                    >
                      <Heart className={cn("size-4", report.likedByMe && "fill-red-500")} aria-hidden />
                      {report.likes}
                    </button>
                    <Link href={`/map?focus=${report.id}`} className={cn(btn.base, btn.primary, btn.md)}>
                      <MapIcon className="size-4" aria-hidden /> {t("common.viewOnMap")}
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </Card>

          {isPublic && (
            <Card className="overflow-hidden">
              <div className="px-5 pb-1 pt-4">
                <SectionHeader title={t("detail.comments", { n: report.comments.length })} subtitle={t("detail.commentsSub")} />
              </div>
              <div className="mt-3">
                <CommentThread report={report} showAll />
              </div>
            </Card>
          )}

          {/* Admins see reporter contact details only for named reports. */}
          {isAdmin && report.reporter && (
            <Card className="p-5">
              <SectionHeader title={t("admin.reporter")} subtitle={t("admin.reporterNote")} />
              <dl className="mt-3 divide-y divide-slate-100 text-sm">
                <Row label={t("profile.name")} value={report.reporter.name} />
                <Row label={t("auth.email")} value={report.reporter.email} />
                {report.reporter.phone && <Row label={t("profile.phone")} value={report.reporter.phone} />}
                {report.reporter.contactEmail && <Row label={t("profile.contactEmail")} value={report.reporter.contactEmail} />}
              </dl>
            </Card>
          )}
        </div>

        <aside className="space-y-5">
          <Card className="p-5">
            <div className="flex items-center gap-3">
              <ReportIcon report={report} size="lg" />
              <div>
                <p className="text-sm font-semibold text-slate-900">{label(report)}</p>
                {report.kind === "hazard" && (
                  <p className={cn("text-xs font-medium", SEVERITIES[report.severity].text)}>
                    {t("detail.severityLine", {
                      label: severity(report.severity),
                      desc: lang === "ur" ? severityDesc(report.severity) : severityDesc(report.severity).toLowerCase(),
                    })}
                  </p>
                )}
              </div>
            </div>
            <dl className="mt-4 divide-y divide-slate-100 text-sm">
              <Row label={t("detail.location")} value={place(report.locationName)} />
              <Row label={t("detail.area")} value={place(report.area)} />
              <Row
                label={t("detail.coords")}
                value={
                  <span className="tabular-nums">
                    {report.coordinates.lat.toFixed(report.approximate ? 2 : 4)}, {report.coordinates.lng.toFixed(report.approximate ? 2 : 4)}
                    {report.approximate && " ≈"}
                  </span>
                }
              />
              {report.kind === "crime" && report.occurredAt && (
                <Row
                  label={t("crime.occurredShort")}
                  value={<span suppressHydrationWarning>{formatDateTime(report.occurredAt, lang)}</span>}
                />
              )}
              <Row
                label={t("detail.reported")}
                value={<span suppressHydrationWarning>{formatDateTime(report.reportedAt, lang)}</span>}
              />
              {report.kind === "hazard" && <Row label={t("detail.status")} value={<StatusPill status={report.status} />} />}
              <Row label={t("detail.source")} value={t("detail.sourceVal")} />
            </dl>
          </Card>

          <Card className="overflow-hidden">
            <div className="h-56">
              <MapView
                reports={[report]}
                admin={isAdmin}
                interactive={false}
                center={[report.coordinates.lat, report.coordinates.lng]}
                zoom={report.approximate ? 12 : 11}
              />
            </div>
            {isPublic && (
              <div className="p-3">
                <Link href={`/map?focus=${report.id}`} className={cn(btn.base, btn.secondary, btn.md, "w-full")}>
                  <MapIcon className="size-4" aria-hidden /> {t("common.viewOnMap")}
                </Link>
              </div>
            )}
          </Card>

          <Card className="p-5">
            <p className="flex items-center gap-2 text-sm font-semibold text-slate-900">
              <ShieldCheck className="size-4 text-brand-700" aria-hidden /> {t("detail.guidance")}
            </p>
            <ul className="mt-3 space-y-2">
              {guidance.map((g) => (
                <li key={g} className="flex gap-2 text-[13px] leading-snug text-slate-600">
                  <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-brand-500" />
                  {g}
                </li>
              ))}
            </ul>
            <Link href="/emergency" className="mt-3 inline-block text-xs font-semibold text-red-700 hover:text-red-800">
              {t("emergency.linkShort")}
            </Link>
          </Card>
        </aside>
      </div>
    </Page>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 py-2.5">
      <dt className="text-slate-500">{label}</dt>
      <dd className="break-all text-end font-medium text-slate-800">{value}</dd>
    </div>
  );
}
