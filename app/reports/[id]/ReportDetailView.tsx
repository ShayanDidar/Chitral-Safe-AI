"use client";

import Link from "next/link";
import { ArrowLeft, Heart, Map as MapIcon, MapPin, ShieldCheck } from "lucide-react";
import { useHazardStore } from "@/lib/store";
import { HAZARD_TYPES, SEVERITIES } from "@/lib/hazards";
import { cn, formatDateTime } from "@/lib/utils";
import { Avatar, Card, HazardIcon, SectionHeader, SeverityBadge, StatusPill, btn } from "@/components/ui/primitives";
import { TimeAgo } from "@/components/ui/TimeAgo";
import { Page } from "@/components/layout/Page";
import { MapView } from "@/components/map";
import { CommentThread } from "@/components/community/CommunityPost";
import { useI18n } from "@/lib/i18n/LanguageProvider";

export function ReportDetailView({ id }: { id: string }) {
  const { getReport, toggleLike } = useHazardStore();
  const report = getReport(id);
  const { t, hazard, severity, severityDesc, place, person, report: localize, lang } = useI18n();

  if (!report) {
    return (
      <Page narrow>
        <Card className="p-10 text-center">
          <p className="text-base font-semibold text-slate-900">{t("detail.notAvailable")}</p>
          <p className="mx-auto mt-1 max-w-sm text-sm text-slate-500">
            {t("detail.notAvailableBody")}
          </p>
          <div className="mt-5 flex justify-center gap-2">
            <Link href="/community" className={cn(btn.base, btn.primary, btn.md)}>
              {t("detail.goCommunity")}
            </Link>
            <Link href="/map" className={cn(btn.base, btn.secondary, btn.md)}>
              {t("common.openMap")}
            </Link>
          </div>
        </Card>
      </Page>
    );
  }

  const meta = HAZARD_TYPES[report.type];
  const sev = SEVERITIES[report.severity];
  const TypeIcon = meta.icon;
  const text = localize(report);
  const guidance = lang === "ur" ? meta.guidanceUr : meta.guidance;

  return (
    <Page>
      <Link href="/community" className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-900">
        <ArrowLeft className="size-4 rtl:-scale-x-100" aria-hidden /> {t("detail.back")}
      </Link>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="min-w-0 space-y-5 lg:col-span-2">
          <Card className="overflow-hidden">
            <div className="relative aspect-[16/9] bg-slate-100">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={report.imageUrl ?? meta.image} alt={`${t("post.photo")}: ${text.title}`} className="h-full w-full object-cover" />
              {!report.imageUrl && (
                <span className="absolute bottom-3 start-3 rounded-md bg-white/90 px-2 py-1 text-[11px] text-slate-600">
                  {t("detail.illustration")}
                </span>
              )}
            </div>
            <div className="space-y-4 p-5 sm:p-6">
              <div className="flex flex-wrap items-center gap-2">
                <SeverityBadge severity={report.severity} />
                <StatusPill status={report.status} />
                {report.source === "user" && (
                  <span className="rounded-full bg-brand-700 px-2 py-0.5 text-[11px] font-semibold text-white">{t("common.yourReport")}</span>
                )}
              </div>
              <div>
                <p className="flex items-center gap-1.5 text-sm font-medium text-slate-500">
                  <TypeIcon className="size-4" aria-hidden /> {hazard(report.type)}
                </p>
                <h1 className="mt-1 text-xl font-semibold tracking-tight text-slate-900 sm:text-2xl">{text.title}</h1>
                <p className="mt-1.5 flex items-center gap-1 text-sm text-slate-600">
                  <MapPin className="size-4 text-slate-400" aria-hidden /> {t("common.placeArea", { place: place(report.locationName), area: place(report.area) })}
                </p>
              </div>
              <p dir="auto" className="text-[15px] leading-relaxed text-slate-700">
                {text.description}
              </p>
              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4">
                <div className="flex items-center gap-2.5">
                  <Avatar name={person(report.author)} />
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{person(report.author)}</p>
                    <p className="text-xs text-slate-500">
                      {t("detail.reported")} <TimeAgo iso={report.reportedAt} />
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => toggleLike(report.id)}
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
              </div>
            </div>
          </Card>

          <Card className="overflow-hidden">
            <div className="px-5 pb-1 pt-4">
              <SectionHeader title={t("detail.comments", { n: report.comments.length })} subtitle={t("detail.commentsSub")} />
            </div>
            <div className="mt-3">
              <CommentThread report={report} showAll />
            </div>
          </Card>
        </div>

        <aside className="space-y-5">
          <Card className="p-5">
            <div className="flex items-center gap-3">
              <HazardIcon type={report.type} severity={report.severity} size="lg" />
              <div>
                <p className="text-sm font-semibold text-slate-900">{hazard(report.type)}</p>
                <p className={cn("text-xs font-medium", sev.text)}>
                  {t("detail.severityLine", {
                    label: severity(report.severity),
                    desc: lang === "ur" ? severityDesc(report.severity) : severityDesc(report.severity).toLowerCase(),
                  })}
                </p>
              </div>
            </div>
            <dl className="mt-4 divide-y divide-slate-100 text-sm">
              <Row label={t("detail.location")} value={place(report.locationName)} />
              <Row label={t("detail.area")} value={place(report.area)} />
              <Row
                label={t("detail.coords")}
                value={
                  <span className="tabular-nums">
                    {report.coordinates.lat.toFixed(4)}, {report.coordinates.lng.toFixed(4)}
                  </span>
                }
              />
              <Row
                label={t("detail.reported")}
                value={<span suppressHydrationWarning>{formatDateTime(report.reportedAt, lang)}</span>}
              />
              <Row label={t("detail.status")} value={<StatusPill status={report.status} />} />
              <Row label={t("detail.source")} value={t("detail.sourceVal")} />
            </dl>
          </Card>

          <Card className="overflow-hidden">
            <div className="h-56">
              <MapView
                reports={[report]}
                interactive={false}
                center={[report.coordinates.lat, report.coordinates.lng]}
                zoom={11}
              />
            </div>
            <div className="p-3">
              <Link href={`/map?focus=${report.id}`} className={cn(btn.base, btn.secondary, btn.md, "w-full")}>
                <MapIcon className="size-4" aria-hidden /> {t("common.viewOnMap")}
              </Link>
            </div>
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
            <p className="mt-3 text-xs text-slate-500">
              {t("detail.emergency")}{" "}
              <a href="tel:1122" className="font-semibold text-red-700">
                {t("shell.rescue")}
              </a>
            </p>
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
      <dd className="text-end font-medium text-slate-800">{value}</dd>
    </div>
  );
}
