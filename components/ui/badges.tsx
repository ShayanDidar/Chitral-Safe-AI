"use client";

import { HAZARD_TYPES, SEVERITIES } from "@/lib/hazards";
import { useI18n } from "@/lib/i18n/LanguageProvider";
import { cn } from "@/lib/utils";
import type { HazardType, ReportStatus, Severity } from "@/types";

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

export function HazardTypeLabel({ type, className }: { type: HazardType; className?: string }) {
  const meta = HAZARD_TYPES[type];
  const Icon = meta.icon;
  const { hazard } = useI18n();
  return (
    <span className={cn("inline-flex items-center gap-1.5 text-xs font-medium text-slate-700", className)}>
      <Icon className="size-3.5 text-slate-500" aria-hidden />
      {hazard(type)}
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
