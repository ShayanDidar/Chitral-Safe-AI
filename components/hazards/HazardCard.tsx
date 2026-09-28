"use client";

import Link from "next/link";
import { Heart, MapPin, MessageCircle } from "lucide-react";
import { HAZARD_TYPES } from "@/lib/hazards";
import { cn } from "@/lib/utils";
import { HazardIcon, HazardTypeLabel, SeverityBadge, StatusPill } from "@/components/ui/primitives";
import { TimeAgo } from "@/components/ui/TimeAgo";
import { useI18n } from "@/lib/i18n/LanguageProvider";
import type { HazardReport } from "@/types";

export function HazardCard({ report, className }: { report: HazardReport; className?: string }) {
  const { t, place, report: localize } = useI18n();
  return (
    <Link
      href={`/reports/${report.id}`}
      className={cn(
        "group flex flex-col overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-card transition hover:-translate-y-0.5 hover:shadow-float",
        className,
      )}
    >
      <div className="relative aspect-[16/10] overflow-hidden bg-slate-100">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={report.imageUrl ?? HAZARD_TYPES[report.type].image}
          alt=""
          loading="lazy"
          className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.03]"
        />
        <div className="absolute start-2.5 top-2.5 flex gap-1.5">
          <SeverityBadge severity={report.severity} className="bg-white/95 shadow-sm" />
        </div>
        {report.source === "user" && (
          <span className="absolute end-2.5 top-2.5 rounded-full bg-brand-700 px-2 py-0.5 text-[11px] font-semibold text-white">
            {t("common.yourReport")}
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col p-3.5">
        <div className="flex items-center justify-between gap-2">
          <HazardTypeLabel type={report.type} />
          <TimeAgo iso={report.reportedAt} className="text-[11px] text-slate-400" />
        </div>
        <p className="mt-1.5 flex items-center gap-1 text-sm font-semibold text-slate-900">
          <MapPin className="size-3.5 shrink-0 text-slate-400" aria-hidden />
          <span className="truncate">{place(report.locationName)}</span>
        </p>
        <p className="mt-1 line-clamp-2 text-[13px] leading-relaxed text-slate-600">{localize(report).description}</p>
        <div className="mt-auto flex items-center gap-3 pt-3 text-xs text-slate-500">
          <span className="inline-flex items-center gap-1">
            <Heart className={cn("size-3.5", report.likedByMe && "fill-red-500 text-red-500")} aria-hidden />
            {report.likes}
          </span>
          <span className="inline-flex items-center gap-1">
            <MessageCircle className="size-3.5" aria-hidden />
            {report.comments.length}
          </span>
          <StatusPill status={report.status} className="ms-auto" />
        </div>
      </div>
    </Link>
  );
}

export function HazardListItem({
  report,
  active,
  onClick,
}: {
  report: HazardReport;
  active?: boolean;
  onClick?: () => void;
}) {
  const { t, hazard, place, status } = useI18n();
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex w-full items-start gap-3 rounded-xl p-2.5 text-start transition-colors",
        active ? "bg-brand-50 ring-1 ring-inset ring-brand-200" : "hover:bg-slate-50",
      )}
    >
      <HazardIcon type={report.type} severity={report.severity} size="sm" />
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <p className="truncate text-[13px] font-semibold text-slate-900">{hazard(report.type)}</p>
          <TimeAgo iso={report.reportedAt} className="shrink-0 text-[11px] text-slate-400" />
        </div>
        <p className="truncate text-xs text-slate-500">
          {place(report.locationName)}
          {report.status !== "active" && ` · ${status(report.status)}`}
        </p>
        <div className="mt-1.5 flex items-center gap-1.5">
          <SeverityBadge severity={report.severity} />
          {report.source === "user" && (
            <span className="rounded-full bg-brand-700 px-1.5 py-0.5 text-[10px] font-semibold text-white">{t("common.new")}</span>
          )}
        </div>
      </div>
    </button>
  );
}
