"use client";

import Link from "next/link";
import { Heart, MapPin, MessageCircle, ShieldAlert } from "lucide-react";
import { HAZARD_TYPES } from "@/lib/hazards";
import { CRIME_ICONS } from "@/lib/crime";
import { cn } from "@/lib/utils";
import { ReportIcon, ReportTag, StatusPill } from "@/components/ui/primitives";
import { TimeAgo } from "@/components/ui/TimeAgo";
import { useI18n } from "@/lib/i18n/LanguageProvider";
import type { Report } from "@/types";

/** Image for a report: its photo, the hazard illustration, or null (crime without photo). */
function reportImage(report: Report) {
  return report.imageUrl ?? (report.kind === "hazard" ? HAZARD_TYPES[report.type].image : null);
}

/** Placeholder used where a crime report has no photo. */
export function ReportImagePlaceholder({ report, className }: { report: Report; className?: string }) {
  const Icon = report.kind === "crime" ? CRIME_ICONS[report.category] : ShieldAlert;
  return (
    <div className={cn("grid h-full w-full place-items-center bg-gradient-to-br from-indigo-50 to-slate-100", className)}>
      <Icon className="size-10 text-indigo-300" aria-hidden />
    </div>
  );
}

export function ReportCard({ report, className }: { report: Report; className?: string }) {
  const { t, label, place, report: localize } = useI18n();
  const img = reportImage(report);
  const TypeIcon = report.kind === "hazard" ? HAZARD_TYPES[report.type].icon : CRIME_ICONS[report.category];
  return (
    <Link
      href={`/reports/${report.id}`}
      className={cn(
        "group flex flex-col overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-card transition hover:-translate-y-0.5 hover:shadow-float",
        className,
      )}
    >
      <div className="relative aspect-[16/10] overflow-hidden bg-slate-100">
        {img ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={img}
            alt=""
            loading="lazy"
            className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.03]"
          />
        ) : (
          <ReportImagePlaceholder report={report} />
        )}
        <div className="absolute start-2.5 top-2.5 flex gap-1.5">
          <ReportTag report={report} className="bg-white/95 shadow-sm" />
        </div>
        {report.mine && (
          <span className="absolute end-2.5 top-2.5 rounded-full bg-brand-700 px-2 py-0.5 text-[11px] font-semibold text-white">
            {t("common.yourReport")}
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col p-3.5">
        <div className="flex items-center justify-between gap-2">
          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-700">
            <TypeIcon className="size-3.5 text-slate-500" aria-hidden />
            {label(report)}
          </span>
          <TimeAgo iso={report.reportedAt} className="text-[11px] text-slate-400" />
        </div>
        <p className="mt-1.5 flex items-center gap-1 text-sm font-semibold text-slate-900">
          <MapPin className="size-3.5 shrink-0 text-slate-400" aria-hidden />
          <span className="truncate">{place(report.locationName)}</span>
          {report.approximate && <span className="shrink-0 text-[11px] font-normal text-slate-400">({t("crime.approxShort")})</span>}
        </p>
        <p dir="auto" className="mt-1 line-clamp-2 text-[13px] leading-relaxed text-slate-600">
          {localize(report).description}
        </p>
        <div className="mt-auto flex items-center gap-3 pt-3 text-xs text-slate-500">
          <span className="inline-flex items-center gap-1">
            <Heart className={cn("size-3.5", report.likedByMe && "fill-red-500 text-red-500")} aria-hidden />
            {report.likes}
          </span>
          <span className="inline-flex items-center gap-1">
            <MessageCircle className="size-3.5" aria-hidden />
            {report.comments.length}
          </span>
          {report.kind === "hazard" && <StatusPill status={report.status} className="ms-auto" />}
        </div>
      </div>
    </Link>
  );
}

export function ReportListItem({
  report,
  active,
  onClick,
}: {
  report: Report;
  active?: boolean;
  onClick?: () => void;
}) {
  const { t, label, place, status } = useI18n();
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex w-full items-start gap-3 rounded-xl p-2.5 text-start transition-colors",
        active ? "bg-brand-50 ring-1 ring-inset ring-brand-200" : "hover:bg-slate-50",
      )}
    >
      <ReportIcon report={report} size="sm" />
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <p className="truncate text-[13px] font-semibold text-slate-900">{label(report)}</p>
          <TimeAgo iso={report.reportedAt} className="shrink-0 text-[11px] text-slate-400" />
        </div>
        <p className="truncate text-xs text-slate-500">
          {place(report.locationName)}
          {report.kind === "hazard" && report.status !== "active" && ` · ${status(report.status)}`}
          {report.approximate && ` · ${t("crime.approxShort")}`}
        </p>
        <div className="mt-1.5 flex items-center gap-1.5">
          <ReportTag report={report} />
          {report.mine && (
            <span className="rounded-full bg-brand-700 px-1.5 py-0.5 text-[10px] font-semibold text-white">{t("common.yourReport")}</span>
          )}
        </div>
      </div>
    </button>
  );
}
