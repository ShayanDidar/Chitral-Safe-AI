"use client";

import { ShieldAlert } from "lucide-react";
import { HAZARD_TYPES, SEVERITIES } from "@/lib/hazards";
import { CRIME_ICONS } from "@/lib/crime";
import { useI18n } from "@/lib/i18n/LanguageProvider";
import { cn } from "@/lib/utils";
import type { Report, ReportStatus, ReviewStatus, Severity } from "@/types";

/** Four-step bar meter so severity is readable without relying on colour. */
export function SeverityMeter({ severity, className }: { severity: Severity; className?: string }) {
  const meta = SEVERITIES[severity];
  return (
    <span className={cn("inline-flex items-end gap-[2px]", className)} aria-hidden>
      {[1, 2, 3, 4].map((i) => (
        <span
          key={i}
          className={cn("w-[3px] rounded-full", i <= meta.level ? meta.dot : "bg-current opacity-20")}
          style={{ height: 4 + i * 2 }}
        />
      ))}
    </span>
  );
}

const STATUS: Record<ReportStatus, { cls: string }> = {
  active: { cls: "bg-slate-900 text-white" },
  monitoring: { cls: "bg-slate-100 text-slate-700" },
  resolved: { cls: "bg-green-50 text-green-800" },
};

export function SeverityBadge({ severity, className }: { severity: Severity; className?: string }) {
  const meta = SEVERITIES[severity];
  const { severity: severityLabel } = useI18n();
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset",
        meta.badge,
        className,
      )}
    >
      <SeverityMeter severity={severity} />
      {severityLabel(severity)}
    </span>
  );
}

export function StatusPill({ status, className }: { status: ReportStatus; className?: string }) {
  const { status: label } = useI18n();
  return (
    <span className={cn("rounded-full px-2 py-0.5 text-[11px] font-medium", STATUS[status].cls, className)}>
      {label(status)}
    </span>
  );
}

export function DemoBadge({ live, label }: { live: boolean; label?: string }) {
  const { t } = useI18n();
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-medium ring-1 ring-inset",
        live ? "bg-brand-50 text-brand-800 ring-brand-600/20" : "bg-slate-100 text-slate-600 ring-slate-300/60",
      )}
    >
      <span className={cn("size-1.5 rounded-full", live ? "bg-brand-500" : "bg-slate-400")} />
      {label ?? (live ? t("weather.live") : t("weather.demo"))}
    </span>
  );
}

const REVIEW_STYLE: Record<ReviewStatus, string> = {
  pending: "bg-amber-50 text-amber-800 ring-amber-600/25",
  approved: "bg-green-50 text-green-800 ring-green-600/20",
  rejected: "bg-slate-100 text-slate-700 ring-slate-400/30",
};

/** Moderation status of a submission. */
export function ReviewBadge({ review, className }: { review: ReviewStatus; className?: string }) {
  const { review: label } = useI18n();
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-semibold ring-1 ring-inset",
        REVIEW_STYLE[review],
        className,
      )}
    >
      <span
        className={cn(
          "size-1.5 rounded-full",
          review === "pending" ? "bg-amber-500" : review === "approved" ? "bg-green-600" : "bg-slate-400",
        )}
      />
      {label(review)}
    </span>
  );
}

/** Icon tile for any report: hazard icon tinted by severity, or the crime category icon. */
export function ReportIcon({ report, size = "md" }: { report: Report; size?: "sm" | "md" | "lg" }) {
  const Icon = report.kind === "hazard" ? HAZARD_TYPES[report.type].icon : CRIME_ICONS[report.category];
  const s = report.kind === "hazard" ? SEVERITIES[report.severity] : null;
  return (
    <span
      className={cn(
        "grid shrink-0 place-items-center rounded-xl",
        s ? cn(s.soft, s.text) : "bg-indigo-50 text-indigo-700",
        size === "sm" && "size-8",
        size === "md" && "size-10",
        size === "lg" && "size-12",
      )}
    >
      <Icon className={size === "lg" ? "size-6" : size === "md" ? "size-5" : "size-4"} aria-hidden />
    </span>
  );
}

/** Severity for hazards, a "Safety report" tag for crime reports. */
export function ReportTag({ report, className }: { report: Report; className?: string }) {
  const { t } = useI18n();
  if (report.kind === "hazard") return <SeverityBadge severity={report.severity} className={className} />;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full bg-indigo-50 px-2 py-0.5 text-xs font-medium text-indigo-800 ring-1 ring-inset ring-indigo-600/20",
        className,
      )}
    >
      <ShieldAlert className="size-3" aria-hidden />
      {t("crime.badge")}
    </span>
  );
}
